# Computer Vision Pipeline

## Overview

The CV pipeline processes video frames to extract crowd metrics:
person detection → tracking → density estimation → flow analysis

## Components

### 1. Person Detection (`detector.py`)

**YOLO Detector (primary)**
- Model: YOLOv8 (nano/small/medium/large/xlarge)
- Class: Person (COCO class 0)
- Confidence: 0.5 (configurable)
- GPU auto-detection

**Fallback Detector (no GPU)**
- Background subtraction (MOG2)
- Contour analysis
- Motion-based detection

### 2. Multi-Object Tracking (`tracker.py`)

**ByteTrack Algorithm**
- Two-stage matching:
  1. High-confidence detections → existing tracks (IoU)
  2. Low-confidence detections → lost tracks (recovery)
- Persistent IDs across frames
- Velocity estimation with EMA smoothing
- Trajectory recording

### 3. Density Estimation (`density.py`)

Per-zone metrics:
- Person count and density (persons/m²)
- Density growth rate
- Average velocity and variance
- Flow direction and magnitude
- Flow consistency and conflict
- Bottleneck scoring
- Anomaly detection

### 4. Video Sources (`sources.py`)

| Source | Use Case |
|--------|----------|
| `WebcamSource` | Local USB camera |
| `RTSPSource` | IP cameras / CCTV |
| `VideoFileSource` | Uploaded video files |
| `SimulatedSource` | Demo with synthetic frames |

## Running

```bash
# Standalone webcam server
cd services/vision
python webcam_standalone.py --source simulated --port 8002

# With real webcam
python webcam_standalone.py --source webcam --camera 0

# With RTSP camera
python webcam_standalone.py --source rtsp --camera "rtsp://ip:port/stream"
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | HTML viewer with live feed |
| `GET /stream.mjpg` | MJPEG video stream |
| `GET /api/webcam/status` | JSON status |
| `WS /ws/webcam` | WebSocket for detection data |
