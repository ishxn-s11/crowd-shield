# CrowdShield Architecture

## System Overview

CrowdShield is a production-grade AI-powered crowd safety platform that transforms reactive monitoring into predictive public safety.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    INPUT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Webcam   │  │ RTSP/CCTV│  │  Upload  │  │ Simulated│   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘        │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│               COMPUTER VISION PIPELINE                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  YOLO    │→ │ ByteTrack│→ │  Density │→ │   Flow   │   │
│  │Detection │  │ Tracking │  │Estimation│  │ Analysis │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                RISK ENGINE (ENSEMBLE)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Rule-   │  │ XGBoost  │  │   LSTM   │  │Transformer│   │
│  │  Based   │  │  Model   │  │  Model   │  │  Model   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘        │
│                       ↓ Weighted Ensemble ↓                  │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND (port 8000)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  REST    │  │WebSocket │  │  Auth    │  │Simulation│   │
│  │  APIs    │  │ Streaming│  │  (JWT)   │  │ Engine   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────┬─────────────┬─────────────┬───────────────────────┘
         ↓             ↓             ↓
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  ┌──────────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │    Dashboard      │  │  Webcam  │  │   Mobile App     │  │
│  │  React+Vite+TS    │  │ Viewer   │  │  React Native    │  │
│  │  (port 5173)      │  │(port8002)│  │  (Expo)          │  │
│  └──────────────────┘  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Port Map

| Port | Service | Protocol |
|------|---------|----------|
| 8000 | API Backend | HTTP + WebSocket |
| 5173 | Dashboard | HTTP |
| 8002 | Webcam Inference | HTTP + WebSocket + MJPEG |
| 8554 | RTSP Proxy | RTSP |

## Data Flow

1. **Frame Capture** — Video source provides frames (webcam/RTSP/simulated)
2. **Person Detection** — YOLO detects people in each frame
3. **Tracking** — ByteTrack assigns persistent IDs across frames
4. **Density Estimation** — Per-zone crowd metrics computed
5. **Risk Prediction** — Ensemble model predicts risk scores
6. **Alert Generation** — Rules trigger alerts at thresholds
7. **Recommendations** — AI generates actionable interventions
8. **Dashboard Display** — Real-time updates via WebSocket

## Risk Engine Architecture

The risk engine uses a 4-model ensemble:

| Model | Role | Activation |
|-------|------|-----------|
| Rule-based | Baseline, always active | Weight: 0.40 |
| XGBoost | Snapshot features | Weight: 0.3-0.5 |
| LSTM | Short sequences (5+) | Weight: 0.3-0.46 |
| Transformer | Long sequences (8+) | Weight: 0.3-0.50 |

## Security

- JWT authentication with bcrypt password hashing
- Role-based access control (ADMIN, COMMANDER, OPERATOR, etc.)
- No facial recognition — crowd-level analytics only
- Anonymous citizen sessions
- Environment-based secrets
