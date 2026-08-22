"""Standalone webcam inference server.

Minimal, self-contained server for webcam inference.
Does NOT depend on FastAPI lifespan — runs as a background thread.

Usage:
    python webcam_standalone.py --source simulated --port 8002
    python webcam_standalone.py --source webcam --camera 0 --port 8002
"""
import asyncio
import json
import os
import sys
import time
import threading
from typing import Optional

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from app.detector import FallbackDetector, Detection, create_detector
from app.tracker import ByteTracker, TrackState
from app.density import CrowdDensityEstimator, ZoneConfig, ZoneMetrics
from app.sources import SimulatedSource, WebcamSource, RTSPSource, create_source
from app.webcam_server import draw_detections

from fastapi import FastAPI, WebSocket as FastWS, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
import uvicorn
import structlog

logger = structlog.get_logger()

app = FastAPI(title="CrowdShield Webcam", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Global state ──────────────────────────────────────────────
state = {
    "running": False,
    "camera_id": "CAM-WEBCAM",
    "source_type": "simulated",
    "fps": 0,
    "frame_id": 0,
    "inference_ms": 0,
    "person_count": 0,
    "total_persons": 0,
    "zones": {},
    "tracks": {},
}
latest_annotated: Optional[np.ndarray] = None
ws_clients: list = []
processing_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()


def _processing_loop(source_type: str, source_url: str, camera_id: str,
                     model_path: str, confidence: float, target_fps: int):
    """Blocking processing loop — runs in a background thread."""
    global latest_annotated, state

    source = create_source(source_type=source_type, source_url=source_url, source_id=camera_id)
    if not source.open():
        logger.error("source_open_failed", type=source_type)
        return

    detector = create_detector(model_path=model_path, confidence_threshold=confidence)
    tracker = ByteTracker(track_thresh=0.5, match_thresh=0.3, max_time_lost=30)
    estimator = CrowdDensityEstimator([
        ZoneConfig("Z1", "Zone A", area_sqm=1000, max_capacity=1000),
        ZoneConfig("Z2", "Zone B", area_sqm=800, max_capacity=800),
        ZoneConfig("Z3", "Zone C", area_sqm=600, max_capacity=600),
        ZoneConfig("Z4", "Zone D", area_sqm=1200, max_capacity=1200),
    ])

    frame_interval = 1.0 / target_fps
    fps_counter = 0
    fps_timer = time.time()
    current_fps = 0.0

    logger.info("processing_started", source=source_type, camera=camera_id)

    while not _stop_event.is_set():
        t_start = time.time()

        frame_data = source.read()
        if frame_data is None:
            time.sleep(0.05)
            continue

        frame = frame_data.image

        # Detect
        detections = detector.detect(frame)

        # Track
        tracks_list = tracker.update(detections.detections)
        tracks_dict = {t.track_id: t for t in tracks_list}

        # Metrics
        zone_metrics = estimator.compute_metrics(tracks_dict, frame.shape)

        # Annotate
        annotated = draw_detections(
            frame, detections.detections, tracks_dict, zone_metrics,
            fps=current_fps, inference_ms=detections.inference_time_ms,
        )
        latest_annotated = annotated

        # FPS
        fps_counter += 1
        elapsed = time.time() - fps_timer
        if elapsed >= 1.0:
            current_fps = fps_counter / elapsed
            fps_counter = 0
            fps_timer = time.time()

        # Update state
        state.update({
            "running": True,
            "camera_id": camera_id,
            "source_type": source_type,
            "fps": round(current_fps, 1),
            "frame_id": frame_data.frame_id,
            "inference_ms": round(detections.inference_time_ms, 1),
            "person_count": len(tracks_dict),
            "total_persons": sum(zm.person_count for zm in zone_metrics.values()),
            "zones": {
                zid: {
                    "id": zid,
                    "name": zm.zone_id,
                    "person_count": zm.person_count,
                    "density": round(zm.density, 3),
                    "avg_velocity": round(zm.avg_velocity, 2),
                    "flow_conflict": round(zm.flow_conflict, 2),
                    "bottleneck_score": round(zm.bottleneck_score, 2),
                    "anomaly_score": round(zm.anomaly_score, 2),
                }
                for zid, zm in zone_metrics.items()
            },
            "tracks": {
                str(tid): {
                    "id": t.track_id,
                    "bbox": [int(v) for v in t.bbox],
                    "center": [int(t.center[0]), int(t.center[1])],
                    "confidence": round(t.confidence, 3),
                    "speed": round(t.speed, 2),
                    "velocity": [round(t.velocity[0], 1), round(t.velocity[1], 1)],
                    "age": t.age,
                }
                for tid, t in tracks_dict.items()
            },
        })

        # Broadcast
        msg = json.dumps({"type": "webcam_update", **state})
        dead = []
        for ws in ws_clients:
            try:
                asyncio.run(ws.send_text(msg))
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in ws_clients:
                ws_clients.remove(ws)

        # Rate limit
        processing_time = time.time() - t_start
        sleep_time = max(0, frame_interval - processing_time)
        if sleep_time > 0:
            time.sleep(sleep_time)

    source.close()
    logger.info("processing_stopped")


# ─── HTTP Endpoints ────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "webcam-inference", "running": state["running"]}


@app.get("/")
async def index():
    return HTMLResponse(WEB_VIEWER_HTML)


@app.get("/stream.mjpg")
async def mjpeg_stream():
    async def generate():
        while True:
            if latest_annotated is not None:
                _, buffer = cv2.imencode('.jpg', latest_annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' +
                       buffer.tobytes() + b'\r\n')
            await asyncio.sleep(0.07)  # ~15fps
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/api/webcam/status")
async def webcam_status():
    return state


@app.websocket("/ws/webcam")
async def webcam_ws(websocket: FastWS):
    await websocket.accept()
    ws_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "get_state":
                await websocket.send_json({"type": "webcam_update", **state})
    except WebSocketDisconnect:
        if websocket in ws_clients:
            ws_clients.remove(websocket)


# ─── HTML Viewer ───────────────────────────────────────────────

WEB_VIEWER_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CrowdShield - Live Webcam</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0e17;color:#e5e7eb;font-family:'Inter',system-ui,sans-serif}
.hdr{background:#111827;padding:12px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #374151}
.hdr h1{font-size:16px;font-weight:800;letter-spacing:.05em}
.hdr .sub{font-size:11px;color:#6b7280}
.main{display:flex;height:calc(100vh - 52px)}
.vid{flex:1;position:relative;background:#000;display:flex;align-items:center;justify-content:center}
.vid img{max-width:100%;max-height:100%;object-fit:contain}
.side{width:340px;background:#111827;border-left:1px solid #374151;overflow-y:auto;padding:12px}
.pnl{background:#1f2937;border-radius:8px;padding:12px;margin-bottom:10px;border:1px solid #374151}
.pnl h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:8px}
.m{display:flex;justify-content:space-between;padding:4px 0;font-size:12px}
.m .v{font-weight:700;font-variant-numeric:tabular-nums}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px}
.dot.on{background:#22c55e;animation:p 1.5s infinite}
@keyframes p{0%,100%{opacity:1}50%{opacity:.4}}
.zc{background:#111827;border-radius:6px;padding:8px 10px;margin-bottom:6px;border:1px solid #374151}
.ov{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.7);padding:8px 12px;border-radius:6px;font-size:12px}
.bb{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.8);padding:8px 16px;display:flex;justify-content:space-between;font-size:11px}
</style>
</head>
<body>
<div class="hdr">
<div><h1>CROWDSHIELD — LIVE WEBCAM</h1><div class="sub">YOLO Detection + ByteTrack Tracking</div></div>
<div style="margin-left:auto;display:flex;align-items:center;gap:12px">
<div style="display:flex;align-items:center;font-size:12px">
<span class="dot" id="dot"></span><span id="stxt">CONNECTING...</span>
</div></div></div>
<div class="main">
<div class="vid">
<img src="/stream.mjpg" id="vid" alt="Live"/>
<div class="ov"><div>Camera: <b id="cid">-</b></div><div>FPS: <b id="fps">-</b> | <b id="inf">-</b>ms</div></div>
<div class="bb"><span>Persons: <b id="tp">0</b></span><span>Tracks: <b id="tc">0</b></span></div>
</div>
<div class="side">
<div class="pnl"><h3>Status</h3>
<div class="m"><span>FPS</span><span class="v" id="fpsv">-</span></div>
<div class="m"><span>Inference</span><span class="v" id="infv">-</span></div>
<div class="m"><span>Tracks</span><span class="v" id="trkv">0</span></div>
<div class="m"><span>Persons</span><span class="v" id="tots">0</span></div>
</div>
<div class="pnl"><h3>Zones</h3><div id="zl"></div></div>
<div class="pnl"><h3>Tracks</h3><div id="tl" style="max-height:200px;overflow-y:auto"></div></div>
</div></div>
<script>
let ws;
function connect(){
ws=new WebSocket((location.protocol==='https:'?'wss:':'ws:')+'//'+location.host+'/ws/webcam');
ws.onopen=()=>{document.getElementById('stxt').textContent='LIVE';document.getElementById('dot').className='dot on';ws.send('get_state')};
ws.onmessage=e=>{try{const d=JSON.parse(e.data);if(d.type==='webcam_update')ui(d)}catch{}};
ws.onclose=()=>{document.getElementById('stxt').textContent='OFFLINE';document.getElementById('dot').className='dot';setTimeout(connect,2000)};
}
function ui(d){
document.getElementById('cid').textContent=d.camera_id;
document.getElementById('fps').textContent=d.fps;
document.getElementById('inf').textContent=d.inference_ms;
document.getElementById('fpsv').textContent=d.fps;
document.getElementById('infv').textContent=d.inference_ms+'ms';
document.getElementById('trkv').textContent=Object.keys(d.tracks||{}).length;
document.getElementById('tp').textContent=d.total_persons;
document.getElementById('tots').textContent=d.total_persons;
document.getElementById('tc').textContent=Object.keys(d.tracks||{}).length;
let zh='';for(const[z,zm]of Object.entries(d.zones||{})){
const c=zm.density>1.2?'#ef4444':zm.density>.8?'#f97316':zm.density>.4?'#eab308':'#22c55e';
zh+=`<div class="zc" style="border-left:3px solid ${c}"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600"><span>${zm.name||z}</span><span style="color:${c}">${zm.person_count} ppl</span></div><div style="font-size:11px;color:#9ca3af;margin-top:4px">Density: ${zm.density} p/m2 | Speed: ${zm.avg_velocity} m/s</div></div>`}
document.getElementById('zl').innerHTML=zh||'<div style="color:#6b7280;font-size:12px">No data</div>';
let th='';for(const[t,tv]of Object.entries(d.tracks||{})){
th+=`<div style="font-size:11px;padding:3px 0;border-bottom:1px solid #374151"><span style="color:#3b82f6">#${tv.id}</span> <span>${(tv.confidence*100).toFixed(0)}%</span> <span style="color:#9ca3af">${tv.speed}m/s</span></div>`}
document.getElementById('tl').innerHTML=th||'<div style="color:#6b7280;font-size:12px">No tracks</div>';
}
connect();
</script>
</body></html>"""


# ─── Main ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="simulated", choices=["webcam", "rtsp", "simulated", "video"])
    parser.add_argument("--camera", default="0")
    parser.add_argument("--port", type=int, default=8002)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--model", default="yolov8n.pt")
    parser.add_argument("--confidence", type=float, default=0.5)
    parser.add_argument("--fps", type=int, default=15)

    args = parser.parse_args()

    # Start processing thread
    _stop_event.clear()
    processing_thread = threading.Thread(
        target=_processing_loop,
        args=(args.source, args.camera, "CAM-WEBCAM", args.model, args.confidence, args.fps),
        daemon=True,
    )
    processing_thread.start()

    print(f"""
=== CrowdShield Webcam Inference Server ===
  Source:   {args.source}
  Camera:   {args.camera}
  Port:     {args.port}
  Model:    {args.model}

  Viewer:   http://localhost:{args.port}
  Stream:   http://localhost:{args.port}/stream.mjpg
  API:      http://localhost:{args.port}/api/webcam/status
  WebSocket: ws://localhost:{args.port}/ws/webcam
============================================
    """)

    try:
        uvicorn.run(app, host=args.host, port=args.port, log_level="info")
    finally:
        _stop_event.set()
        if processing_thread:
            processing_thread.join(timeout=3)
