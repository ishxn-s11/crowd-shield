# 🛡️ CrowdShield — AI-Powered Crowd Safety Platform

> **Detect dangerous crowd conditions early, explain why risk is increasing, recommend practical interventions, and help authorities act before a crowd disaster occurs.**

---

## 🎯 The Problem

Crowd disasters kill hundreds of people every year at festivals, pilgrimages, stadiums, and public gatherings. Current crowd management is **reactive** — authorities respond only after danger has already escalated.

**Key questions authorities need answered:**
1. Where is crowd density increasing abnormally?
2. Which locations are becoming bottlenecks?
3. Is there a risk of crowd crush within the next few minutes?
4. Which evacuation route is safest?
5. How should authorities redistribute security personnel?
6. Which gates should be opened or closed?
7. What announcement should authorities make?

---

## 💡 The Solution

**CrowdShield** is a production-grade AI-powered early-warning and crowd-safety platform that transforms crowd management from reactive monitoring to **predictive public safety**.

### Core Capabilities

| Module | Description |
|--------|-------------|
| 🎥 **Video/Camera Ingestion** | Live webcam, uploaded video, RTSP streams, simulated cameras |
| 👁️ **Computer Vision Pipeline** | Person detection (YOLO), tracking, counting, density estimation |
| 🌊 **Crowd Flow Analysis** | Velocity, direction, flow conflict, reverse movement detection |
| 🚧 **Bottleneck Detection** | High density + low speed + restricted geometry identification |
| ⚠️ **Abnormal Behavior Detection** | Sudden acceleration, stopping, circular movement, surges |
| 🔴 **Risk Prediction Engine** | Rule-based + ML risk scoring with explainability |
| 📊 **Command Center Dashboard** | Real-time map, heatmaps, alerts, CCTV, analytics |
| 🗺️ **Venue Digital Twin** | Graph-based venue representation with zones, gates, routes |
| 🎮 **Crowd Simulation** | What-if scenario testing, intervention simulation |
| 🤖 **AI Assistant** | Natural language queries about system state |
| 📱 **Citizen App** | Alerts, safe routes, incident reporting |
| 🌐 **Multilingual Alerts** | English, Hindi, Tamil announcements |

---

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Cameras /   │────▶│  Vision AI   │────▶│  Risk Engine │
│  Video Input │     │  Pipeline    │     │  + ML Model  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                    ┌──────────────┐     ┌────────▼────────┐
                    │  Simulation  │◀───▶│  FastAPI Backend│
                    │  Engine      │     │  + WebSockets   │
                    └──────────────┘     └────────┬────────┘
                                                  │
                                      ┌───────────┴───────────┐
                                      ▼                       ▼
                              ┌──────────────┐       ┌──────────────┐
                              │   Command    │       │   Citizen    │
                              │   Dashboard  │       │   Mobile App │
                              └──────────────┘       └──────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.10, FastAPI, SQLAlchemy, SQLite/PostgreSQL |
| **Real-time** | WebSockets, Server-Sent Events |
| **Dashboard** | React 18, TypeScript, Vite, Tailwind CSS, Recharts |
| **CV Pipeline** | OpenCV, YOLO (Ultralytics), NumPy |
| **Risk Engine** | Rule-based engine + XGBoost/LightGBM (pluggable) |
| **Simulation** | Custom agent-based model, NetworkX graphs |
| **Auth** | JWT, bcrypt, role-based access control |
| **Deployment** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Git**

### Local Development

```bash
# 1. Clone the repository
git clone <repo-url> crowdshield
cd crowdshield

# 2. Install API dependencies
cd services/api
pip install -r requirements.txt
cd ../..

# 3. Start the API server
cd services/api
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 4. (In another terminal) Start the dashboard
cd apps/dashboard
npm install
npm run dev
```

### Docker

```bash
docker compose up
```

- **Dashboard**: http://localhost:5173
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🎮 Demo Instructions

### Full Demo Flow (5 minutes)

1. **Start the application** using the instructions above
2. **Open the dashboard** at http://localhost:5173
3. You'll see the **CrowdShield Command Center** with an interactive venue map
4. Click **"Crowd Surge"** in the scenario bar at the top
5. Watch the system in action:

```
Normal crowd → Gate 3 receives excessive inflow
    ↓
Density increases → Movement speed decreases
    ↓
Bottleneck detected → Risk rises
    ↓
CRITICAL warning → Recommendations generated
    ↓
Click "IMPLEMENT" on a recommendation
    ↓
Density decreases → Flow normalizes → Risk decreases
```

### Available Scenarios

| Scenario | Description |
|----------|-------------|
| 🟢 **Normal Crowd** | Steady-state crowd flow |
| 📈 **Rising Density** | Gradually increasing crowd |
| 🔴 **Crowd Surge** | Rapid influx creating dangerous conditions |
| 🚧 **Gate Blocked** | Emergency exit blocked, crowd rerouting |
| ↔️ **Reverse Flow** | Crowd suddenly reversing direction |
| ⚡ **Panic-Like Flow** | Sudden acceleration and scattered movement |
| 🟢 **Recovery** | Post-incident crowd thinning |

### Dashboard Features

- **Venue Map**: Interactive zone visualization with risk coloring
- **Risk Gauge**: Overall risk score with real-time updates
- **Alerts Panel**: Live alerts with acknowledge/escalate actions
- **Recommendations**: AI-generated actionable interventions with "Implement" buttons
- **Camera Feeds**: Simulated CCTV with per-camera metrics
- **AI Assistant**: Natural language queries about system state
- **Zone Detail**: Deep-dive into individual zone metrics

---

## 📡 Camera & Device Ports

| Port | Service | Description |
|------|---------|-------------|
| **8000** | API Server | REST API + WebSocket server |
| **5173** | Dashboard | React development server |
| **8554** | RTSP Proxy | For CCTV camera RTSP streams |
| **8002** | Webcam Capture | Local webcam feed capture |
| **8003** | Device Camera | For testing with mobile/device cameras |

### Connecting Real Cameras

```bash
# RTSP stream from CCTV camera
curl -X POST http://localhost:8000/api/cameras -d '{
    "name": "Main Gate Camera",
    "source_type": "rtsp",
    "source_url": "rtsp://192.168.1.100:554/stream1",
    "zone_id": "Z1"
}'

# Local webcam (via OpenCV capture)
# Set source_type: "webcam" with source_url: "0" (device index)
```

---

## 🔧 API Reference

### Authentication
```bash
POST /api/auth/login          # Login (username + password)
POST /api/auth/refresh        # Refresh JWT token
GET  /api/auth/me             # Get current user
```

### Venue & Zones
```bash
GET  /api/venues              # List venues
GET  /api/venues/{id}         # Get venue details
GET  /api/venues/{id}/zones   # Get venue zones
GET  /api/venues/{id}/gates   # Get venue gates
```

### Crowd Data
```bash
GET  /api/crowd/live          # Live crowd metrics for all zones
GET  /api/crowd/metrics/{zone_id}  # Zone-specific metrics
GET  /api/crowd/history/{zone_id}  # Historical metrics
```

### Risk
```bash
GET  /api/risk/live           # Current risk levels
GET  /api/risk/history        # Risk history
GET  /api/risk/zone/{zone_id} # Zone risk with contributing factors
```

### Alerts & Incidents
```bash
GET  /api/alerts              # List active alerts
POST /api/alerts/{id}/acknowledge  # Acknowledge alert
GET  /api/incidents           # List incidents
POST /api/incidents           # Create incident
PATCH /api/incidents/{id}     # Update incident status
```

### Recommendations
```bash
GET  /api/recommendations     # Current recommendations
POST /api/recommendations/{id}/implement  # Implement recommendation
```

### Simulation
```bash
GET  /api/simulation/scenarios    # List available scenarios
POST /api/simulation/start        # Start simulation {scenario: "crowd_surge"}
POST /api/simulation/stop         # Stop simulation
GET  /api/simulation/state        # Get current state
```

### Routes & Gates
```bash
GET  /api/routes/safest       # Find safest evacuation route
POST /api/gates/{id}/block    # Block a gate
POST /api/gates/{id}/open     # Open a gate
```

### AI Assistant
```bash
POST /api/ai-assistant/query  # Natural language query
```

### WebSocket
```bash
WS /ws/simulation             # Real-time simulation updates
WS /ws/risk                   # Real-time risk updates
WS /ws/alerts                 # Real-time alerts
```

---

## 🧠 Risk Engine

### Rule-Based Layer

The risk engine calculates a composite score from weighted factors:

| Factor | Max Points | Description |
|--------|-----------|-------------|
| Crowd Density | 30 | People per square meter vs. thresholds |
| Density Growth | 20 | Rate of density increase |
| Speed Reduction | 20 | Average pedestrian velocity |
| Flow Conflict | 15 | Opposing crowd movements |
| Bottleneck | 15 | High density + low speed + blocked exits |
| Velocity Variance | 10 | Speed inconsistency |
| Behavior Anomaly | 10 | Observable anomaly signals |

### Risk Levels

| Score | Level | Action |
|-------|-------|--------|
| 0–24 | 🟢 LOW | Monitor |
| 25–49 | 🟡 MODERATE | Heightened awareness |
| 50–74 | 🟠 HIGH | Prepare response |
| 75–100 | 🔴 CRITICAL | Immediate action required |

### Hysteresis & Confirmation

- **Confirmation frames**: Risk must stay above threshold for 3 consecutive observations before escalation
- **Hysteresis**: Recovery threshold is 15 points below trigger to prevent alert oscillation

---

## 🔐 Security

- JWT authentication with refresh tokens
- Role-based access control (ADMIN, COMMANDER, OPERATOR, SECURITY, ANALYST, CITIZEN)
- Password hashing with bcrypt
- No facial recognition — focuses on crowd-level behavior
- Anonymous citizen sessions
- Environment-based configuration

---

## 📁 Project Structure

```
crowdshield/
├── apps/
│   ├── dashboard/          # React + TypeScript + Vite
│   └── mobile/             # Citizen mobile app (React Native)
├── services/
│   ├── api/                # FastAPI backend (main service)
│   ├── vision/             # Computer vision pipeline
│   ├── risk-engine/        # ML risk prediction
│   ├── recommendation-engine/
│   ├── simulation/         # Crowd simulation
│   └── ai-assistant/       # LLM-powered assistant
├── ml/
│   ├── datasets/           # Training data
│   ├── training/           # Model training scripts
│   ├── models/             # Trained model artifacts
│   ├── inference/          # Model serving
│   └── evaluation/         # Model evaluation
├── infrastructure/
│   ├── docker/             # Dockerfiles
│   ├── nginx/              # Nginx configs
│   └── deployment/         # Cloud deployment configs
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── tests/                  # Test suite
├── docker-compose.yml      # Full stack orchestration
└── .env.example            # Environment template
```

---

## 🧪 Testing

```bash
# Run all tests
cd services/api
python -m pytest tests/ -v

# Risk engine unit tests
python -m pytest tests/test_risk_engine.py -v

# API integration tests
python -m pytest tests/test_api.py -v
```

---

## 🌐 Offline / Network Resilience

- **Edge processing**: CV pipeline designed to run locally on edge devices
- **Local event buffer**: SQLite-based buffering during network outages
- **Degraded mode**: Dashboard shows "NETWORK: DEGRADED" status
- **Auto-sync**: Buffered events sync when connection returns

---

## ⚖️ Limitations & Future Work

### Current Limitations
- Simulation uses simplified pedestrian dynamics (not agent-level physics)
- ML model requires real crowd data for production accuracy
- No actual YOLO inference in demo mode (uses simulated metrics)
- Mobile app is a scaffold (requires React Native/Expo setup)

### Future Work
- [ ] Real-time YOLO inference with GPU acceleration
- [ ] LSTM/Transformer temporal risk prediction
- [ ] NVIDIA Jetson edge deployment
- [ ] Multi-venue management
- [ ] Historical analytics dashboard
- [ ] SMS/Push notification integration
- [ ] Weather integration
- [ ] Historical crowd pattern learning
- [ ] Full React Native mobile app

---

## 📄 License

MIT License — Built for public safety.

---

**Built with ❤️ for public safety. Detect early. Act fast. Save lives.**
