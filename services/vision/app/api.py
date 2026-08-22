"""Vision service API endpoints.

Provides:
- Camera management (add/remove/status)
- Pipeline control (start/stop)
- Live metrics streaming via WebSocket
- Frame capture endpoints
"""
import asyncio
import time
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
import structlog

from .pipeline import VisionPipeline, PipelineConfig, MultiCameraManager
from .density import ZoneConfig

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)
logger = structlog.get_logger()

app = FastAPI(title="CrowdShield Vision Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ──
camera_manager = MultiCameraManager()
_default_zones = [
    ZoneConfig("Z1", "Main Entrance", area_sqm=1200, max_capacity=1200),
    ZoneConfig("Z2", "Central Plaza", area_sqm=2500, max_capacity=2500),
    ZoneConfig("Z3", "Food Court", area_sqm=800, max_capacity=800),
    ZoneConfig("Z4", "Stadium", area_sqm=3000, max_capacity=3000),
    ZoneConfig("Z5", "Emergency Exit Zone", area_sqm=600, max_capacity=600),
]


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "crowdshield-vision"}


@app.get("/api/vision/status")
async def vision_status():
    cameras = camera_manager.get_all_state()
    return {
        "status": "operational",
        "cameras": len(cameras),
        "cameras_detail": {
            cam_id: {
                "is_running": state.get("is_running", False),
                "fps": state.get("fps", 0),
                "person_count": state.get("person_count", 0),
            }
            for cam_id, state in cameras.items()
        },
    }


@app.post("/api/vision/cameras")
async def add_camera(
    camera_id: str = Body(...),
    source_type: str = Body("simulated"),
    source_url: str = Body(""),
    width: int = Body(1280),
    height: int = Body(720),
    fps: int = Body(15),
    num_people: int = Body(50),
):
    """Add and start a new camera pipeline."""
    zones = _default_zones.copy()

    if source_type == "simulated":
        source_url = ""  # Simulated doesn't use URL

    config = PipelineConfig(
        source_type=source_type,
        source_url=source_url,
        zones=zones,
        max_fps=fps,
        process_width=width,
        process_height=height,
    )

    # Create and start pipeline
    pipeline = VisionPipeline(config)

    # If simulated, set crowd size
    if source_type == "simulated" and hasattr(pipeline, '_source'):
        pass  # Will be set after open

    camera_manager.pipelines[camera_id] = pipeline
    await pipeline.start()

    # Set crowd size for simulated source
    if source_type == "simulated" and pipeline._source:
        if hasattr(pipeline._source, 'set_crowd_size'):
            pipeline._source.set_crowd_size(num_people)

    logger.info("camera_added", id=camera_id, type=source_type)
    return {
        "status": "added",
        "camera_id": camera_id,
        "source_type": source_type,
    }


@app.delete("/api/vision/cameras/{camera_id}")
async def remove_camera(camera_id: str):
    if camera_id not in camera_manager.pipelines:
        raise HTTPException(status_code=404, detail="Camera not found")
    await camera_manager.remove_camera(camera_id)
    return {"status": "removed", "camera_id": camera_id}


@app.get("/api/vision/cameras")
async def list_cameras():
    cameras = camera_manager.get_all_state()
    return [
        {
            "id": cam_id,
            "is_running": state.get("is_running", False),
            "fps": state.get("fps", 0),
            "person_count": state.get("person_count", 0),
            "inference_time_ms": state.get("inference_time_ms", 0),
            "global_metrics": state.get("global_metrics", {}),
        }
        for cam_id, state in cameras.items()
    ]


@app.get("/api/vision/cameras/{camera_id}/metrics")
async def get_camera_metrics(camera_id: str):
    if camera_id not in camera_manager.pipelines:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera_manager.pipelines[camera_id].get_state_dict()


@app.post("/api/vision/cameras/{camera_id}/crowd-size")
async def set_crowd_size(camera_id: str, size: int = Body(..., embed=True)):
    """Adjust crowd size for simulated cameras."""
    if camera_id not in camera_manager.pipelines:
        raise HTTPException(status_code=404, detail="Camera not found")

    pipeline = camera_manager.pipelines[camera_id]
    if pipeline._source and hasattr(pipeline._source, 'set_crowd_size'):
        pipeline._source.set_crowd_size(size)
        return {"status": "updated", "camera_id": camera_id, "crowd_size": size}

    return {"status": "not_simulated", "message": "Can only adjust crowd size for simulated cameras"}


@app.post("/api/vision/start-demo")
async def start_demo_cameras():
    """Start a demo setup with multiple simulated cameras."""
    # Stop existing
    await camera_manager.stop_all()
    camera_manager.pipelines.clear()

    # Start demo cameras
    cameras = [
        ("CAM-01", "simulated", 1280, 720, 30),
        ("CAM-02", "simulated", 640, 480, 15),
        ("CAM-03", "simulated", 640, 480, 15),
    ]

    for cam_id, src_type, w, h, fps in cameras:
        config = PipelineConfig(
            source_type=src_type,
            zones=_default_zones.copy(),
            max_fps=fps,
            process_width=w,
            process_height=h,
        )
        pipeline = VisionPipeline(config)
        camera_manager.pipelines[cam_id] = pipeline
        await pipeline.start()

        # Set crowd sizes
        if pipeline._source and hasattr(pipeline._source, 'set_crowd_size'):
            sizes = {"CAM-01": 80, "CAM-02": 40, "CAM-03": 60}
            pipeline._source.set_crowd_size(sizes.get(cam_id, 50))

    return {
        "status": "demo_started",
        "cameras": len(cameras),
    }


@app.post("/api/vision/stop-all")
async def stop_all():
    await camera_manager.stop_all()
    return {"status": "all_stopped"}


# ── WebSocket for live updates ──

class ConnectionManager:
    def __init__(self):
        self.connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.connections.remove(ws)


ws_manager = ConnectionManager()


@app.websocket("/ws/vision")
async def vision_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)

    # Register broadcast callback
    def on_update(data):
        asyncio.get_event_loop().create_task(
            ws_manager.broadcast({"type": "vision_update", "data": data})
        )

    for pipeline in camera_manager.pipelines.values():
        pipeline.on_update(on_update)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "get_state":
                state = camera_manager.get_all_state()
                await websocket.send_json({"type": "state", "data": state})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ── Startup / Shutdown ──

@app.on_event("startup")
async def startup():
    logger.info("vision_service_started")


@app.on_event("shutdown")
async def shutdown():
    await camera_manager.stop_all()
    logger.info("vision_service_stopped")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.api:app", host="0.0.0.0", port=8001, reload=True)
