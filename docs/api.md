# CrowdShield API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{ "username": "admin", "password": "admin123" }
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "...", "username": "admin", "role": "ADMIN" }
}
```

## Venue Endpoints

### List Venues
```http
GET /api/venues
```

### Get Venue
```http
GET /api/venues/{id}
```

### Get Venue Zones
```http
GET /api/venues/{id}/zones
```

### Get Venue Gates
```http
GET /api/venues/{id}/gates
```

## Crowd Data

### Live Crowd Metrics
```http
GET /api/crowd/live
```

### Zone Metrics
```http
GET /api/crowd/metrics/{zone_id}
```

### Zone History
```http
GET /api/crowd/history/{zone_id}?limit=60
```

## Risk

### Live Risk (Rule-based)
```http
GET /api/risk/live
```

### ML Risk (XGBoost hybrid)
```http
GET /api/risk/ml
```

### Ensemble Risk (LSTM + Transformer + XGBoost + Rules)
```http
GET /api/risk/ensemble
```

### Zone Risk with Contributing Factors
```http
GET /api/risk/zone/{zone_id}
```

## Alerts

### List Alerts
```http
GET /api/alerts?limit=20
```

### Acknowledge Alert
```http
POST /api/alerts/{id}/acknowledge
```

## Incidents

### List Incidents
```http
GET /api/incidents
```

### Create Incident
```http
POST /api/incidents
Content-Type: application/json

{
  "incident_type": "CROWD_SURGE",
  "zone_id": "Z4",
  "severity": "CRITICAL",
  "title": "Crowd surge at Stadium",
  "description": "Rapid density increase detected"
}
```

### Update Incident
```http
PATCH /api/incidents/{id}
Content-Type: application/json

{ "status": "RESOLVED" }
```

## Recommendations

### Get Recommendations
```http
GET /api/recommendations
```

### Implement Recommendation
```http
POST /api/recommendations/{id}/implement
```

## Simulation

### List Scenarios
```http
GET /api/simulation/scenarios
```

### Start Simulation
```http
POST /api/simulation/start
Content-Type: application/json

{ "scenario": "crowd_surge" }
```

### Stop Simulation
```http
POST /api/simulation/stop
```

### Get Simulation State
```http
GET /api/simulation/state
```

## Gates

### Block Gate
```http
POST /api/gates/{id}/block
```

### Open Gate
```http
POST /api/gates/{id}/open
```

## Routes

### Find Safest Route
```http
GET /api/routes/safest?from_zone=Z4&to_zone=Z5
```

## AI Assistant

### Query
```http
POST /api/ai-assistant/query
Content-Type: application/json

{ "query": "What is the overall risk?" }
```

## ML Model

### Model Status
```http
GET /api/ml/status
```

### Ensemble Status
```http
GET /api/ml/ensemble-status
```

### Features
```http
GET /api/ml/features
```

## WebSocket

### Simulation Updates
```
ws://localhost:8000/ws/simulation
```

### Risk Updates
```
ws://localhost:8000/ws/risk
```

### Webcam Updates
```
ws://localhost:8002/ws/webcam
```
