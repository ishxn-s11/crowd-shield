# CrowdShield Demo Guide

## Quick Start (5 minutes)

### 1. Start the Backend
```bash
cd services/api
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 2. Start the Dashboard
```bash
cd apps/dashboard
npm install
npm run dev
```

### 3. Open Dashboard
Navigate to http://localhost:5173

### 4. Start a Demo Scenario
Click any scenario button in the top bar:
- **Normal Crowd** — steady state
- **Crowd Surge** — dramatic risk escalation
- **Gate Blocked** — emergency exit blocked
- **Reverse Flow** — crowd suddenly reverses

## Full Demo Flow

### Phase 1: Normal State
1. Dashboard shows **LOW** risk
2. All zones healthy
3. No alerts

### Phase 2: Crowd Surge
1. Click **"Crowd Surge"**
2. Watch density increase in real-time
3. See risk climb from LOW → MODERATE → HIGH → CRITICAL
4. Alerts appear in the sidebar
5. Recommendations generated

### Phase 3: Intervention
1. Click **"IMPLEMENT"** on a recommendation
2. Gate states change
3. Watch risk begin to decrease

### Phase 4: Recovery
1. Click **"Recovery"** scenario
2. Watch crowd thin out
3. Risk returns to LOW

## Running with Webcam

```bash
# Start webcam server
cd services/vision
python webcam_standalone.py --source simulated --port 8002

# Or with real webcam
python webcam_standalone.py --source webcam --camera 0 --port 8002
```

Then open http://localhost:8002 for the live webcam viewer.

## Running with Docker

```bash
docker compose up
```

Then open http://localhost:5173

## Mobile App

```bash
cd apps/mobile
npm install
npx expo start
```

Scan QR code with Expo Go app on your phone.

## API Testing

```bash
# Health check
curl http://localhost:8000/health

# Start simulation
curl -X POST http://localhost:8000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"scenario": "crowd_surge"}'

# Get risk
curl http://localhost:8000/api/risk/ensemble

# Get alerts
curl http://localhost:8000/api/alerts

# AI assistant
curl -X POST http://localhost:8000/api/ai-assistant/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the highest risk zone?"}'
```

## Available Scenarios

| Scenario | Description | Risk Pattern |
|----------|-------------|-------------|
| Normal Crowd | Steady-state flow | LOW (stable) |
| Rising Density | Gradual increase | LOW → MODERATE |
| Crowd Surge | Rapid dangerous influx | LOW → HIGH → CRITICAL |
| Gate Blocked | Emergency exit blocked | MODERATE → HIGH |
| Reverse Flow | Crowd suddenly reverses | HIGH risk |
| Panic-Like Flow | Scattered movement | CRITICAL |
| Recovery | Post-incident thinning | HIGH → LOW |
