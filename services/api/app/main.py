"""CrowdShield API — main application."""
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from app.core.config import settings
from app.core.database import init_db, close_db, get_db, async_session
from app.core.websocket import ws_manager
from app.core.auth import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.models.database import (
    User, Venue, Zone, Camera, CrowdMetric, RiskPrediction,
    Alert, Incident, Recommendation, SecurityPersonnel, CitizenReport,
    SimulationRun, AuditLog, Base
)
from app.services.simulation import simulation, SCENARIOS

# ML Risk Engine + Ensemble integration
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
try:
    from ml.inference import MLRiskEngine
    ml_engine = MLRiskEngine(
        model_path=os.path.join(os.path.dirname(__file__), '..', '..', '..', 'ml', 'models', 'risk_model.json')
    )
    HAS_ML = True
except Exception:
    ml_engine = None
    HAS_ML = False

try:
    from ml.lightweight_sequence import SequenceModelManager
    seq_manager = SequenceModelManager()
    HAS_SEQ = True
except Exception:
    seq_manager = None
    HAS_SEQ = False

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Body

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)
logger = structlog.get_logger()

# ── Background simulation task ──
sim_task: Optional[asyncio.Task] = None


async def _simulation_broadcaster():
    """Periodically broadcast simulation state to all WebSocket clients."""
    while True:
        if simulation.is_running:
            state = simulation.get_state()
            await ws_manager.broadcast("simulation", {
                "type": "simulation_update",
                "data": state,
            })
            await ws_manager.broadcast("risk", {
                "type": "risk_update",
                "data": state,
            })
        await asyncio.sleep(1.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    simulation.initialize_demo_venue()
    logger.info("app_started", port=settings.API_PORT)
    
    # Seed default admin user
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@crowdshield.io",
                hashed_password=hash_password("admin123"),
                full_name="System Admin",
                role="ADMIN",
            )
            db.add(admin)
            await db.commit()
            logger.info("admin_user_created")
    
    bg_task = asyncio.create_task(_simulation_broadcaster())
    yield
    # Shutdown
    simulation.stop()
    bg_task.cancel()
    await close_db()
    logger.info("app_stopped")


app = FastAPI(
    title="CrowdShield API",
    description="AI-Powered Crowd Safety Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════
# Health & Status
# ══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "1.0.0", "service": "crowdshield-api"}


@app.get("/ready")
async def ready():
    return {"status": "ready"}


@app.get("/api/status")
async def system_status():
    return {
        "status": "operational",
        "version": "1.0.0",
        "simulation_running": simulation.is_running,
        "ws_connections": ws_manager.get_connection_count(),
        "uptime": datetime.utcnow().isoformat(),
    }


# ══════════════════════════════════════════════════════════════
# Authentication
# ══════════════════════════════════════════════════════════════

@app.post("/api/auth/login")
async def login(username: str = Body(...), password: str = Body(...)):
    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access = create_access_token({"sub": user.id, "role": user.role})
        refresh = create_refresh_token({"sub": user.id, "role": user.role})
        
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "full_name": user.full_name,
            },
        }


@app.post("/api/auth/refresh")
async def refresh_token(refresh_token: str = Body(...)):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    access = create_access_token({"sub": payload["sub"], "role": payload["role"]})
    return {"access_token": access, "token_type": "bearer"}


@app.get("/api/auth/me")
async def get_me(user=Depends(get_current_user)):
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user["id"]))
        u = result.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": u.id, "username": u.username, "role": u.role, "full_name": u.full_name}


# ══════════════════════════════════════════════════════════════
# Venue & Zone endpoints
# ══════════════════════════════════════════════════════════════

@app.get("/api/venues")
async def get_venues():
    """List all venues. For demo, return the simulation venue."""
    return [{
        "id": "demo-venue-1",
        "name": "CrowdShield Demo Festival",
        "description": "Large-scale public gathering simulation venue",
        "venue_type": "festival",
        "capacity": 10000,
        "zones_count": len(simulation.zones),
        "gates_count": len(simulation.gates),
    }]


@app.get("/api/venues/{venue_id}")
async def get_venue(venue_id: str):
    return {
        "id": "demo-venue-1",
        "name": "CrowdShield Demo Festival",
        "description": "Large-scale public gathering simulation venue",
        "venue_type": "festival",
        "capacity": 10000,
        "zones": list(simulation.zones.keys()),
        "gates": list(simulation.gates.keys()),
    }


@app.get("/api/venues/{venue_id}/zones")
async def get_venue_zones(venue_id: str):
    state = simulation.get_state()
    return list(state["zones"].values())


@app.get("/api/venues/{venue_id}/gates")
async def get_venue_gates(venue_id: str):
    state = simulation.get_state()
    return list(state["gates"].values())


# ══════════════════════════════════════════════════════════════
# Crowd Metrics
# ══════════════════════════════════════════════════════════════

@app.get("/api/crowd/live")
async def crowd_live():
    state = simulation.get_state()
    return {
        "timestamp": state["timestamp"],
        "total_persons": state["total_persons"],
        "zones": state["zones"],
    }


@app.get("/api/crowd/metrics/{zone_id}")
async def crowd_metrics(zone_id: str):
    if zone_id not in simulation.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    state = simulation.get_state()
    return state["zones"][zone_id]


@app.get("/api/crowd/history/{zone_id}")
async def crowd_history(zone_id: str, limit: int = Query(60, le=300)):
    history = simulation.risk_history.get(zone_id, [])[-limit:]
    return history


# ══════════════════════════════════════════════════════════════
# Risk
# ══════════════════════════════════════════════════════════════

@app.get("/api/risk/live")
async def risk_live():
    state = simulation.get_state()
    return {
        "overall_risk": state["overall_risk"],
        "overall_risk_level": state["overall_risk_level"],
        "zones": {zid: {"risk_score": z["risk_score"], "risk_level": z["risk_level"]} for zid, z in state["zones"].items()},
    }


@app.get("/api/risk/history")
async def risk_history(limit: int = Query(60, le=300)):
    return simulation.overall_risk_history[-limit:]


@app.get("/api/risk/zone/{zone_id}")
async def risk_zone(zone_id: str):
    if zone_id not in simulation.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    zone = simulation.zones[zone_id]
    risk = simulation.risk_engine.calculate_risk(zone)
    return risk


@app.get("/api/risk/ml")
async def risk_ml_live():
    """ML-powered risk prediction for all zones."""
    # Use the simulation's ML engine if available
    engine = getattr(simulation, '_ml_engine', None)
    if engine is None:
        engine = ml_engine
    if engine is None:
        return {"error": "ML model not available", "using": "rule-based"}
    
    results = {}
    for zid, zone in simulation.zones.items():
        metrics = {
            "density": zone.density,
            "person_count": zone.person_count,
            "avg_velocity": zone.avg_velocity,
            "velocity_variance": zone.velocity_variance,
            "flow_magnitude": zone.flow_magnitude,
            "flow_consistency": zone.flow_consistency,
            "flow_conflict": zone.flow_conflict,
            "bottleneck_score": zone.bottleneck_score,
            "anomaly_score": zone.anomaly_score,
            "entry_rate": zone.entry_rate,
            "exit_rate": zone.exit_rate,
            "density_growth_rate": zone.density_growth_rate,
            "area_sqm": zone.area_sqm,
            "max_capacity": zone.max_capacity,
            "critical_density": zone.critical_density,
        }
        result = engine.update_zone(zid, metrics)
        results[zid] = result
    
    return {
        "model": "hybrid-ml",
        "zones": results,
    }


@app.get("/api/ml/status")
async def ml_status():
    """ML model status and info."""
    return {
        "ml_available": HAS_ML,
        "model_loaded": ml_engine._ml_predictor is not None if ml_engine else False,
        "model_path": "ml/models/risk_model.json",
        "engine_type": "hybrid (rule-based + XGBoost)",
    }


@app.get("/api/ml/features")
async def ml_features():
    """Get feature names used by the ML model."""
    if not HAS_ML or ml_engine is None:
        return {"error": "ML model not available"}
    from ml.feature_engineering import CrowdFeatureExtractor
    return {
        "features": CrowdFeatureExtractor.FEATURE_NAMES,
        "num_features": len(CrowdFeatureExtractor.FEATURE_NAMES),
    }


@app.get("/api/risk/ensemble")
async def risk_ensemble():
    """Ensemble risk prediction using LSTM + Transformer + XGBoost + Rules."""
    if not HAS_SEQ or seq_manager is None:
        return {"error": "Sequence models not available", "using": "rule-based"}
    
    results = {}
    for zid, zone in simulation.zones.items():
        metrics = {
            "density": zone.density,
            "person_count": zone.person_count,
            "avg_velocity": zone.avg_velocity,
            "velocity_variance": zone.velocity_variance,
            "flow_magnitude": zone.flow_magnitude,
            "flow_consistency": zone.flow_consistency,
            "flow_conflict": zone.flow_conflict,
            "bottleneck_score": zone.bottleneck_score,
            "anomaly_score": zone.anomaly_score,
            "entry_rate": zone.entry_rate,
            "exit_rate": zone.exit_rate,
            "density_growth_rate": zone.density_growth_rate,
            "area_sqm": zone.area_sqm,
            "max_capacity": zone.max_capacity,
            "critical_density": zone.critical_density,
        }
        result = seq_manager.update_zone(zid, metrics)
        results[zid] = result
    
    return {
        "model": "ensemble-lstm-transformer",
        "models_loaded": {
            "lstm": seq_manager.lstm is not None,
            "transformer": seq_manager.transformer is not None,
            "use_pytorch": seq_manager.use_pytorch,
        },
        "zones": results,
    }


@app.get("/api/ml/ensemble-status")
async def ensemble_status():
    """Status of the ensemble model system."""
    status = {
        "xgboost": HAS_ML and ml_engine is not None and ml_engine._ml_predictor is not None,
        "sequence_models": HAS_SEQ and seq_manager is not None,
        "lstm_loaded": False,
        "transformer_loaded": False,
        "use_pytorch": False,
    }
    if seq_manager:
        status["lstm_loaded"] = seq_manager.lstm is not None
        status["transformer_loaded"] = seq_manager.transformer is not None
        status["use_pytorch"] = seq_manager.use_pytorch
    return status


@app.get("/api/ml/predict/{zone_id}")
async def ml_predict_zone(zone_id: str):
    """Get ML prediction for a specific zone."""
    if not HAS_ML or ml_engine is None:
        return {"error": "ML model not available"}
    if zone_id not in simulation.zones:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    zone = simulation.zones[zone_id]
    metrics = {
        "density": zone.density,
        "person_count": zone.person_count,
        "avg_velocity": zone.avg_velocity,
        "velocity_variance": zone.velocity_variance,
        "flow_magnitude": zone.flow_magnitude,
        "flow_consistency": zone.flow_consistency,
        "flow_conflict": zone.flow_conflict,
        "bottleneck_score": zone.bottleneck_score,
        "anomaly_score": zone.anomaly_score,
        "entry_rate": zone.entry_rate,
        "exit_rate": zone.exit_rate,
        "density_growth_rate": zone.density_growth_rate,
        "area_sqm": zone.area_sqm,
        "max_capacity": zone.max_capacity,
        "critical_density": zone.critical_density,
    }
    result = ml_engine.update_zone(zone_id, metrics)
    return result


# ══════════════════════════════════════════════════════════════
# Alerts
# ══════════════════════════════════════════════════════════════

@app.get("/api/alerts")
async def get_alerts(limit: int = Query(20, le=100)):
    alerts = simulation.alerts[-limit:]
    return [{
        "id": a.id,
        "zone_id": a.zone_id,
        "severity": a.severity,
        "title": a.title,
        "message": a.message,
        "alert_type": a.alert_type,
        "created_at": a.created_at.isoformat(),
        "is_acknowledged": a.is_acknowledged,
    } for a in reversed(alerts)]


@app.get("/api/alerts/active")
async def get_active_alerts():
    """Return deduplicated active alerts with elapsed time."""
    return simulation.get_active_alerts()


@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    # Try active alerts first (deduped)
    if simulation.acknowledge_alert(alert_id):
        return {"status": "acknowledged", "alert_id": alert_id}
    # Fall back to history
    for alert in simulation.alerts:
        if alert.id == alert_id:
            alert.is_acknowledged = True
            return {"status": "acknowledged", "alert_id": alert_id}
    raise HTTPException(status_code=404, detail="Alert not found")


# ══════════════════════════════════════════════════════════════
# Live Monitoring
# ══════════════════════════════════════════════════════════════

# In-memory camera store
cameras_db: dict[str, dict] = {
    "CAM-01": {"id": "CAM-01", "name": "Main Entrance Cam", "type": "RTSP", "url": "rtsp://192.168.1.100:554/stream", "zone_id": "Z1", "status": "ONLINE", "resolution": "1920x1080", "fps": 30},
    "CAM-02": {"id": "CAM-02", "name": "North Corridor Cam", "type": "RTSP", "url": "rtsp://192.168.1.101:554/stream", "zone_id": "Z2", "status": "ONLINE", "resolution": "1920x1080", "fps": 25},
    "CAM-03": {"id": "CAM-03", "name": "Food Court Cam", "type": "USB", "url": "/dev/video0", "zone_id": "Z3", "status": "OFFLINE", "resolution": "1280x720", "fps": 30},
    "CAM-04": {"id": "CAM-04", "name": "Stadium Gate Cam", "type": "RTSP", "url": "rtsp://192.168.1.102:554/stream", "zone_id": "Z6", "status": "ONLINE", "resolution": "1920x1080", "fps": 30},
    "CAM-05": {"id": "CAM-05", "name": "Parking Area Cam", "type": "USB", "url": "/dev/video1", "zone_id": "Z7", "status": "OFFLINE", "resolution": "1280x720", "fps": 25},
}

# Inference sessions store
inference_sessions: dict[str, dict] = {}


@app.get("/api/monitor/cameras")
async def list_cameras():
    return list(cameras_db.values())


@app.post("/api/monitor/cameras")
async def add_camera(
    name: str = Body(...),
    camera_type: str = Body(..., alias="type"),
    url: str = Body(...),
    zone_id: str = Body("Z1"),
):
    cam_id = f"CAM-{len(cameras_db) + 1:02d}"
    cam = {"id": cam_id, "name": name, "type": camera_type, "url": url, "zone_id": zone_id, "status": "ONLINE", "resolution": "1920x1080", "fps": 30}
    cameras_db[cam_id] = cam
    return cam


@app.patch("/api/monitor/cameras/{cam_id}")
async def update_camera(cam_id: str, updates: dict = Body(...)):
    if cam_id not in cameras_db:
        raise HTTPException(status_code=404, detail="Camera not found")
    cameras_db[cam_id].update(updates)
    return cameras_db[cam_id]


@app.delete("/api/monitor/cameras/{cam_id}")
async def delete_camera(cam_id: str):
    if cam_id not in cameras_db:
        raise HTTPException(status_code=404, detail="Camera not found")
    del cameras_db[cam_id]
    return {"status": "deleted", "camera_id": cam_id}


@app.post("/api/monitor/start")
async def start_monitoring(
    camera_id: str = Body(...),
    source: str = Body("cctv"),
    model: str = Body("yolov8n"),
    detection_threshold: float = Body(0.5),
    tracking_enabled: bool = Body(True),
):
    """Start ML inference on a camera feed."""
    cam = cameras_db.get(camera_id)
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    session_id = f"ses-{camera_id}-{int(__import__('time').time())}"
    session = {
        "session_id": session_id,
        "camera_id": camera_id,
        "camera_name": cam["name"],
        "source": source,
        "model": model,
        "detection_threshold": detection_threshold,
        "tracking_enabled": tracking_enabled,
        "status": "RUNNING",
        "started_at": __import__('datetime').datetime.utcnow().isoformat(),
        "detections": [],
        "stats": {"fps": 0, "persons_detected": 0, "avg_confidence": 0, "frames_processed": 0},
    }
    inference_sessions[session_id] = session
    return session


@app.post("/api/monitor/stop")
async def stop_monitoring(session_id: str = Body(...)):
    session = inference_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["status"] = "STOPPED"
    return session


@app.get("/api/monitor/sessions")
async def list_sessions():
    return list(inference_sessions.values())


@app.get("/api/monitor/sessions/{session_id}")
async def get_session(session_id: str):
    session = inference_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    # Simulate live detection updates
    import random
    session["stats"]["fps"] = round(random.uniform(15, 30), 1)
    session["stats"]["persons_detected"] = random.randint(5, 120)
    session["stats"]["avg_confidence"] = round(random.uniform(0.6, 0.95), 3)
    session["stats"]["frames_processed"] += random.randint(10, 30)
    return session


@app.post("/api/monitor/detect")
async def detect_frame(
    camera_id: str = Body(...),
    zone_id: str = Body("Z1"),
):
    """Run detection on a single frame (for device camera uploads)."""
    import random
    num_persons = random.randint(3, 50)
    detections = []
    for i in range(num_persons):
        detections.append({
            "id": i,
            "label": "person",
            "confidence": round(random.uniform(0.5, 0.99), 3),
            "bbox": {
                "x": random.randint(50, 800),
                "y": random.randint(50, 500),
                "w": random.randint(30, 80),
                "h": random.randint(60, 150),
            },
        })
    return {
        "camera_id": camera_id,
        "zone_id": zone_id,
        "frame_id": f"frame-{int(__import__('time').time() * 1000)}",
        "detections": detections,
        "count": num_persons,
        "density": round(num_persons / 50.0, 2),
        "model": "yolov8n",
        "inference_ms": round(random.uniform(15, 80), 1),
    }


# ══════════════════════════════════════════════════════════════
# Incidents
# ══════════════════════════════════════════════════════════════

@app.get("/api/incidents")
async def get_incidents():
    return simulation.incidents


@app.post("/api/incidents")
async def create_incident(
    incident_type: str = Body(...),
    zone_id: str = Body(...),
    severity: str = Body("MODERATE"),
    title: str = Body(""),
    description: str = Body(""),
):
    incident_id = f"INC-{len(simulation.incidents) + 1024:04d}"
    incident = {
        "id": incident_id,
        "type": incident_type,
        "zone_id": zone_id,
        "severity": severity,
        "status": "DETECTED",
        "title": title or f"{incident_type.replace('_', ' ').title()} at {simulation.zones.get(zone_id, type('', (), {'name': 'Unknown'})()).name}",
        "description": description,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "assigned_team": "Response Team A",
    }
    simulation.incidents.append(incident)
    return incident


@app.patch("/api/incidents/{incident_id}")
async def update_incident(incident_id: str, status: str = Body(..., embed=True)):
    for inc in simulation.incidents:
        if inc["id"] == incident_id:
            inc["status"] = status
            inc["updated_at"] = datetime.utcnow().isoformat()
            if status == "RESOLVED":
                inc["resolved_at"] = datetime.utcnow().isoformat()
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")


# ══════════════════════════════════════════════════════════════
# Recommendations
# ══════════════════════════════════════════════════════════════

@app.get("/api/recommendations")
async def get_recommendations():
    return simulation.recommendations


@app.post("/api/recommendations/{rec_id}/implement")
async def implement_recommendation(rec_id: str):
    for rec in simulation.recommendations:
        if rec.id == rec_id:
            # Apply the recommendation
            if rec.action_type == "OPEN_EXIT":
                for g in simulation.gates.values():
                    if g.zone_id == rec.zone_id and g.gate_type == "exit" and g.is_blocked:
                        g.is_blocked = False
                        g.flow_rate = 15.0
                        break
            elif rec.action_type == "RESTRICT_ENTRY":
                for g in simulation.gates.values():
                    if g.zone_id == rec.zone_id and g.gate_type == "entry" and not g.is_blocked:
                        g.flow_rate = max(2.0, g.flow_rate * 0.3)
                        break
            elif rec.action_type == "OPEN_ALTERNATE_EXIT":
                for g in simulation.gates.values():
                    if g.gate_type == "emergency" and g.is_blocked:
                        g.is_blocked = False
                        g.flow_rate = 20.0
                        break
            return {"status": "implemented", "recommendation_id": rec_id}
    raise HTTPException(status_code=404, detail="Recommendation not found")


# ══════════════════════════════════════════════════════════════
# Simulation Control
# ══════════════════════════════════════════════════════════════

@app.get("/api/simulation/scenarios")
async def list_scenarios():
    return [{"key": k, "name": v["name"], "description": v["description"], "duration": v["duration"]} for k, v in SCENARIOS.items()]


@app.post("/api/simulation/start")
async def start_simulation(scenario: str = Body("crowd_surge", embed=True)):
    if simulation.is_running:
        simulation.stop()
        await asyncio.sleep(0.2)
    
    sim_task_local = asyncio.create_task(simulation.run(scenario))
    return {
        "status": "started",
        "scenario": scenario,
        "message": f"Simulation '{SCENARIOS.get(scenario, {}).get('name', scenario)}' started",
    }


@app.post("/api/simulation/stop")
async def stop_simulation():
    simulation.stop()
    return {"status": "stopped"}


@app.get("/api/simulation/state")
async def simulation_state():
    return simulation.get_state()


# ══════════════════════════════════════════════════════════════
# Gates control
# ══════════════════════════════════════════════════════════════

@app.post("/api/gates/{gate_id}/block")
async def block_gate(gate_id: str):
    if gate_id not in simulation.gates:
        raise HTTPException(status_code=404, detail="Gate not found")
    simulation.gates[gate_id].is_blocked = True
    return {"status": "blocked", "gate_id": gate_id}


@app.post("/api/gates/{gate_id}/open")
async def open_gate(gate_id: str):
    if gate_id not in simulation.gates:
        raise HTTPException(status_code=404, detail="Gate not found")
    simulation.gates[gate_id].is_blocked = False
    return {"status": "opened", "gate_id": gate_id}


# ══════════════════════════════════════════════════════════════
# Routes
# ══════════════════════════════════════════════════════════════

@app.get("/api/routes/safest")
async def safest_route(from_zone: str = "Z4", to_zone: str = "Z5"):
    """Find safest evacuation route using Dijkstra-like algorithm."""
    zones = simulation.zones
    gates = simulation.gates
    
    # Build adjacency with risk-weighted edges
    edges = []
    zone_connections = {
        "Z1": ["Z2", "Z6"],
        "Z2": ["Z1", "Z3", "Z4", "Z5"],
        "Z3": ["Z2"],
        "Z4": ["Z2", "Z6"],
        "Z5": ["Z2"],
        "Z6": ["Z1", "Z4"],
        "Z7": ["Z2"],
    }
    
    for src, neighbors in zone_connections.items():
        for dst in neighbors:
            src_z = zones.get(src)
            dst_z = zones.get(dst)
            if src_z and dst_z:
                cost = max(1, dst_z.risk_score + 1)
                if dst_z.density > dst_z.critical_density:
                    cost += 50
                edges.append((src, dst, cost))
                edges.append((dst, src, cost))
    
    # Simple Dijkstra
    import heapq
    dist = {z: float("inf") for z in zones}
    prev = {z: None for z in zones}
    dist[from_zone] = 0
    pq = [(0, from_zone)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for src, dst, cost in edges:
            if src == u:
                nd = d + cost
                if nd < dist[dst]:
                    dist[dst] = nd
                    prev[dst] = u
                    heapq.heappush(pq, (nd, dst))
    
    # Reconstruct path
    path = []
    current = to_zone
    while current:
        path.append(current)
        current = prev.get(current)
    path.reverse()
    
    if path[0] != from_zone:
        return {"error": "No route found", "route": [], "cost": float("inf")}
    
    return {
        "route": [{"zone_id": z, "name": zones[z].name, "risk": zones[z].risk_score} for z in path],
        "cost": dist[to_zone],
        "safe_score": max(0, 100 - dist[to_zone]),
    }


# ══════════════════════════════════════════════════════════════
# Cameras (simulated)
# ══════════════════════════════════════════════════════════════

@app.get("/api/cameras")
async def get_cameras():
    return [
        {"id": "CAM-01", "name": "Gate 1 Cam", "source_type": "simulated", "zone_id": "Z1", "status": "active"},
        {"id": "CAM-02", "name": "Gate 2 Cam", "source_type": "simulated", "zone_id": "Z1", "status": "active"},
        {"id": "CAM-03", "name": "Gate 3 Cam", "source_type": "simulated", "zone_id": "Z4", "status": "active"},
        {"id": "CAM-04", "name": "Central Plaza Cam", "source_type": "simulated", "zone_id": "Z2", "status": "active"},
        {"id": "CAM-05", "name": "Exit A Cam", "source_type": "simulated", "zone_id": "Z5", "status": "active"},
        {"id": "CAM-06", "name": "North Corridor Cam", "source_type": "simulated", "zone_id": "Z6", "status": "active"},
        {"id": "CAM-07", "name": "VIP Cam", "source_type": "simulated", "zone_id": "Z7", "status": "active"},
    ]


# ══════════════════════════════════════════════════════════════
# AI Assistant
# ══════════════════════════════════════════════════════════════

@app.post("/api/ai-assistant/query")
async def ai_assistant_query(query: str = Body(..., embed=True)):
    state = simulation.get_state()
    query_lower = query.lower()
    
    # Find highest risk zone
    max_risk_zone = max(state["zones"].values(), key=lambda z: z["risk_score"], default=None)
    
    if "risk" in query_lower and ("highest" in query_lower or "worst" in query_lower or "top" in query_lower):
        if max_risk_zone:
            return {
                "response": f"The highest risk zone is **{max_risk_zone['name']}** with a risk score of **{max_risk_zone['risk_score']}/100** ({max_risk_zone['risk_level']}). Density is {max_risk_zone['density']:.2f} people/m² with {max_risk_zone['person_count']} people in a {max_risk_zone['area_sqm']}m² area.",
                "data": max_risk_zone,
            }
        return {"response": "No active risk data available. Start a simulation first."}
    
    if "overall" in query_lower and ("risk" in query_lower or "status" in query_lower):
        return {
            "response": f"Overall risk level: **{state['overall_risk']}/100** ({state['overall_risk_level']}). Total crowd: {state['total_persons']} people across {len(state['zones'])} zones.",
            "data": {"overall_risk": state["overall_risk"], "level": state["overall_risk_level"]},
        }
    
    if "what should" in query_lower or "recommend" in query_lower or "action" in query_lower:
        recs = state["recommendations"]
        if recs:
            lines = [f"**{i+1}. {r['title']}** (Priority: {r['priority']})\n   {r['description']}\n   Expected: {r['expected_effect']}" for i, r in enumerate(recs[:5])]
            return {"response": f"Recommended actions:\n\n" + "\n\n".join(lines)}
        return {"response": "No urgent recommendations at this time. All zones within acceptable risk levels."}
    
    if "exit" in query_lower and ("safest" in query_lower or "route" in query_lower):
        if max_risk_zone:
            from_zone = max_risk_zone["id"]
            route = await safest_route(from_zone, "Z5")
            if "route" in route and route["route"]:
                path_str = " → ".join([r["name"] for r in route["route"]])
                return {"response": f"Safest evacuation route from {max_risk_zone['name']}:\n\n{path_str}\n\nSafety score: {route.get('safe_score', 0)}/100"}
        return {"response": "Unable to calculate route. Ensure simulation is running."}
    
    if "incident" in query_lower and ("show" in query_lower or "active" in query_lower or "list" in query_lower):
        incidents = simulation.incidents
        if incidents:
            lines = [f"- **{i['id']}**: {i['title']} ({i['status']}) — {i['severity']}" for i in incidents]
            return {"response": f"Active incidents:\n\n" + "\n".join(lines)}
        return {"response": "No active incidents."}
    
    if "summary" in query_lower or "summarize" in query_lower:
        critical_zones = [z for z in state["zones"].values() if z["risk_level"] == "CRITICAL"]
        high_zones = [z for z in state["zones"].values() if z["risk_level"] == "HIGH"]
        return {
            "response": f"**Situation Summary:**\n\nOverall Risk: {state['overall_risk']}/100 ({state['overall_risk_level']})\nTotal Crowd: {state['total_persons']} people\n\n"
                        f"Critical zones: {', '.join(z['name'] for z in critical_zones) or 'None'}\n"
                        f"High-risk zones: {', '.join(z['name'] for z in high_zones) or 'None'}\n\n"
                        f"Active recommendations: {len(state['recommendations'])}\n"
                        f"Active alerts: {len(state['alerts'])}",
        }
    
    return {
        "response": f"I can help with:\n- **Risk status**: 'What is the overall risk?'\n- **Highest risk zone**: 'Which zone is most dangerous?'\n- **Recommendations**: 'What should we do?'\n- **Evacuation route**: 'Which exit is safest?'\n- **Incidents**: 'Show active incidents'\n- **Summary**: 'Summarize the situation'",
    }


# ══════════════════════════════════════════════════════════════
# Citizen Reports
# ══════════════════════════════════════════════════════════════

@app.post("/api/citizen-reports")
async def create_citizen_report(
    report_type: str = Body(...),
    zone_id: str = Body(""),
    description: str = Body(""),
    latitude: float = Body(0.0),
    longitude: float = Body(0.0),
):
    import uuid
    report = {
        "id": str(uuid.uuid4())[:8],
        "anonymous_id": f"anon-{hash(str(latitude) + str(longitude)) % 10000:04d}",
        "report_type": report_type,
        "zone_id": zone_id,
        "latitude": latitude,
        "longitude": longitude,
        "description": description,
        "created_at": datetime.utcnow().isoformat(),
    }
    return report


# ══════════════════════════════════════════════════════════════
# Multilingual Announcements
# ══════════════════════════════════════════════════════════════

ANNOUNCEMENT_TEMPLATES = {
    "evacuate_calmly": {
        "en": "Please proceed calmly toward {exit}. Follow security personnel instructions.",
        "hi": "कृपया {exit} की ओर शांतिपूर्वक बढ़ें। सुरक्षा कर्मियों के निर्देशों का पालन करें।",
        "ta": "தயவுசெய்து {exit} நோக்கி அமைதியாகச் செல்லுங்கள்.",
    },
    "high_congestion": {
        "en": "High congestion detected near {zone}. Please use alternate routes.",
        "hi": "{zone} के पास भीड़ अधिक है। कृपया वैकल्पिक मार्गों का उपयोग करें।",
        "ta": "{zone} அருகே அதிக நெரிசல் கண்டறியப்பட்டுள்ளது.",
    },
    "gate_restricted": {
        "en": "Entry to {gate} is temporarily restricted. Please use another entrance.",
        "hi": "{gate} में प्रवेश अस्थायी रूप से प्रतिबंधित है। कृपया अन्य प्रवेश द्वार का उपयोग करें।",
        "ta": "{gate} நுழைவு தற்காலிகமாகத் தடைசெய்யப்பட்டுள்ளது.",
    },
}

@app.get("/api/announcements/templates")
async def get_announcement_templates():
    return ANNOUNCEMENT_TEMPLATES


@app.post("/api/announcements/generate")
async def generate_announcement(
    template_key: str = Body(...),
    zone_name: str = Body(""),
    exit_name: str = Body(""),
    gate_name: str = Body(""),
    language: str = Body("en"),
):
    template = ANNOUNCEMENT_TEMPLATES.get(template_key)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    msg = template.get(language, template.get("en", ""))
    msg = msg.replace("{zone}", zone_name).replace("{exit}", exit_name).replace("{gate}", gate_name)
    
    return {
        "message": msg,
        "language": language,
        "template": template_key,
    }


# ══════════════════════════════════════════════════════════════
# Registration
# ══════════════════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register(
    username: str = Body(...),
    email: str = Body(...),
    password: str = Body(...),
    full_name: str = Body(""),
    role: str = Body("OPERATOR"),
):
    async with async_session() as db:
        existing = await db.execute(select(User).where((User.username == username) | (User.email == email)))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username or email already exists")
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name or username,
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        access = create_access_token({"sub": user.id, "role": user.role})
        refresh = create_refresh_token({"sub": user.id, "role": user.role})
        return {
            "access_token": access,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "full_name": user.full_name,
            },
        }


@app.get("/api/users")
async def list_users():
    async with async_session() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        return [{
            "id": u.id, "username": u.username, "email": u.email,
            "full_name": u.full_name, "role": u.role, "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        } for u in users]


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        u = result.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": u.id, "username": u.username, "email": u.email,
            "full_name": u.full_name, "role": u.role, "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }


@app.patch("/api/users/{user_id}")
async def update_user(user_id: str, updates: dict = Body(...)):
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        u = result.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=404, detail="User not found")
        for key in ["full_name", "email", "role"]:
            if key in updates:
                setattr(u, key, updates[key])
        await db.commit()
        return {"id": u.id, "username": u.username, "full_name": u.full_name, "role": u.role, "email": u.email}


# ══════════════════════════════════════════════════════════════
# Response Teams
# ══════════════════════════════════════════════════════════════

# In-memory team storage for demo (persist in DB in production)
_teams: list[dict] = [
    {"id": "TM-001", "name": "Alpha Response Team", "specialty": "Crowd Control", "leader_id": None,
     "members": [], "status": "ACTIVE", "created_at": datetime.utcnow().isoformat()},
    {"id": "TM-002", "name": "Bravo Medical Team", "specialty": "Medical Emergency", "leader_id": None,
     "members": [], "status": "ACTIVE", "created_at": datetime.utcnow().isoformat()},
    {"id": "TM-003", "name": "Charlie Evacuation Team", "specialty": "Evacuation & Routing", "leader_id": None,
     "members": [], "status": "STANDBY", "created_at": datetime.utcnow().isoformat()},
]
_team_id_counter = 3


@app.get("/api/teams")
async def list_teams():
    return _teams


@app.post("/api/teams")
async def create_team(
    name: str = Body(...),
    specialty: str = Body("Crowd Control"),
    leader_id: str = Body(None),
):
    global _team_id_counter
    _team_id_counter += 1
    team = {
        "id": f"TM-{_team_id_counter:03d}",
        "name": name,
        "specialty": specialty,
        "leader_id": leader_id,
        "members": [],
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
    }
    _teams.append(team)
    return team


@app.get("/api/teams/{team_id}")
async def get_team(team_id: str):
    for t in _teams:
        if t["id"] == team_id:
            return t
    raise HTTPException(status_code=404, detail="Team not found")


@app.post("/api/teams/{team_id}/members")
async def add_team_member(team_id: str, user_id: str = Body(...), role_in_team: str = Body("member")):
    for t in _teams:
        if t["id"] == team_id:
            if user_id not in [m["user_id"] for m in t["members"]]:
                t["members"].append({"user_id": user_id, "role": role_in_team, "joined_at": datetime.utcnow().isoformat()})
            return t
    raise HTTPException(status_code=404, detail="Team not found")


@app.delete("/api/teams/{team_id}/members/{user_id}")
async def remove_team_member(team_id: str, user_id: str):
    for t in _teams:
        if t["id"] == team_id:
            t["members"] = [m for m in t["members"] if m["user_id"] != user_id]
            return t
    raise HTTPException(status_code=404, detail="Team not found")


@app.post("/api/teams/{team_id}/assign")
async def assign_team(team_id: str, incident_id: str = Body(...)):
    for t in _teams:
        if t["id"] == team_id:
            t["status"] = "DEPLOYED"
            return {"status": "assigned", "team": t["name"], "incident": incident_id}
    raise HTTPException(status_code=404, detail="Team not found")


# ══════════════════════════════════════════════════════════════
# Device Camera
# ══════════════════════════════════════════════════════════════

@app.get("/api/device-camera/config")
async def device_camera_config():
    """Returns config for the device camera page."""
    return {
        "webrtc_server": f"ws://localhost:8002/ws/webcam",
        "mjpeg_url": f"http://localhost:8002/stream.mjpg",
        "api_url": f"http://localhost:8000",
        "note": "Use device camera for mobile testing. Point phone camera at crowd scene.",
    }


# ══════════════════════════════════════════════════════════════
# Missing Persons & Items
# ══════════════════════════════════════════════════════════════

_missing_persons: list[dict] = []
_missing_items: list[dict] = []


@app.get("/api/missing/persons")
async def get_missing_persons(status: str = Query("MISSING")):
    return [p for p in _missing_persons if p["status"] == status or status == "ALL"]


@app.post("/api/missing/persons")
async def report_missing_person(
    name: str = Body(...),
    age: int = Body(0),
    gender: str = Body(""),
    description: str = Body(""),
    last_seen_zone: str = Body(""),
    last_seen_time: str = Body(""),
    clothing: str = Body(""),
    height: str = Body(""),
    distinguishing_marks: str = Body(""),
    reporter_name: str = Body(""),
    reporter_contact: str = Body(""),
):
    report_id = f"MP-{len(_missing_persons) + 1001:04d}"
    report = {
        "id": report_id,
        "name": name,
        "age": age,
        "gender": gender,
        "description": description,
        "last_seen_zone": last_seen_zone,
        "last_seen_time": last_seen_time or datetime.utcnow().isoformat(),
        "clothing": clothing,
        "height": height,
        "distinguishing_marks": distinguishing_marks,
        "reporter_name": reporter_name,
        "reporter_contact": reporter_contact,
        "status": "MISSING",
        "created_at": datetime.utcnow().isoformat(),
    }
    _missing_persons.append(report)
    return report


@app.patch("/api/missing/persons/{report_id}")
async def update_missing_person(report_id: str, status: str = Body(..., embed=True)):
    for p in _missing_persons:
        if p["id"] == report_id:
            p["status"] = status
            return p
    raise HTTPException(status_code=404, detail="Report not found")


@app.get("/api/missing/items")
async def get_missing_items(status: str = Query("MISSING")):
    return [i for i in _missing_items if i["status"] == status or status == "ALL"]


@app.post("/api/missing/items")
async def report_missing_item(
    item_name: str = Body(...),
    category: str = Body(""),
    description: str = Body(""),
    last_seen_zone: str = Body(""),
    last_seen_time: str = Body(""),
    color: str = Body(""),
    brand: str = Body(""),
    reporter_name: str = Body(""),
    reporter_contact: str = Body(""),
):
    report_id = f"MI-{len(_missing_items) + 1001:04d}"
    report = {
        "id": report_id,
        "item_name": item_name,
        "category": category,
        "description": description,
        "last_seen_zone": last_seen_zone,
        "last_seen_time": last_seen_time or datetime.utcnow().isoformat(),
        "color": color,
        "brand": brand,
        "reporter_name": reporter_name,
        "reporter_contact": reporter_contact,
        "status": "MISSING",
        "created_at": datetime.utcnow().isoformat(),
    }
    _missing_items.append(report)
    return report


@app.patch("/api/missing/items/{report_id}")
async def update_missing_item(report_id: str, status: str = Body(..., embed=True)):
    for i in _missing_items:
        if i["id"] == report_id:
            i["status"] = status
            return i
    raise HTTPException(status_code=404, detail="Report not found")


# ══════════════════════════════════════════════════════════════
# WebSocket
# ══════════════════════════════════════════════════════════════

@app.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str = "simulation"):
    await ws_manager.connect(websocket, channel)
    try:
        # Send initial state
        await websocket.send_json({
            "type": "connected",
            "channel": channel,
            "message": f"Connected to CrowdShield {channel} stream",
        })
        while True:
            data = await websocket.receive_text()
            # Handle client messages (e.g., request state)
            if data == "get_state":
                state = simulation.get_state()
                await websocket.send_json({"type": "state", "data": state})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.API_PORT, reload=True)
