"""Crowd simulation engine for CrowdShield digital twin."""
import asyncio
import math
import random
import time
import uuid
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field
import numpy as np
import structlog

logger = structlog.get_logger()

# ──────────────────────────────────────────────────────────────
# Data structures
# ──────────────────────────────────────────────────────────────

@dataclass
class SimZone:
    id: str
    name: str
    area_sqm: float
    max_capacity: int
    critical_density: float = 2.0
    high_density: float = 1.2
    moderate_density: float = 0.8
    zone_type: str = "plaza"
    # State
    person_count: int = 0
    density: float = 0.0
    avg_velocity: float = 1.2  # m/s normal walking
    velocity_variance: float = 0.1
    flow_direction: float = 0.0  # degrees
    flow_magnitude: float = 0.0
    flow_consistency: float = 0.8
    flow_conflict: float = 0.0
    entry_rate: float = 5.0  # people per second
    exit_rate: float = 4.0
    bottleneck_score: float = 0.0
    anomaly_score: float = 0.0
    density_growth_rate: float = 0.0
    density_history: list = field(default_factory=list)
    velocity_history: list = field(default_factory=list)
    risk_score: float = 0.0
    risk_level: str = "LOW"


@dataclass
class SimGate:
    id: str
    name: str
    gate_type: str  # entry, exit, emergency
    zone_id: str
    capacity: int = 500
    is_blocked: bool = False
    flow_rate: float = 10.0  # people per second capacity
    current_flow: float = 0.0


@dataclass
class SimPerson:
    id: int
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    zone_id: str = ""
    target_zone_id: str = ""
    speed: float = 1.2
    state: str = "walking"  # walking, stopped, fleeing


@dataclass
class SimAlert:
    id: str
    zone_id: str
    severity: str
    title: str
    message: str
    alert_type: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_acknowledged: bool = False


@dataclass
class SimRecommendation:
    id: str
    action_type: str
    title: str
    description: str
    expected_effect: str
    priority: str
    zone_id: str
    confidence: float = 0.85


# ──────────────────────────────────────────────────────────────
# Scenario definitions
# ──────────────────────────────────────────────────────────────

SCENARIOS = {
    "normal": {
        "name": "Normal Crowd",
        "description": "Typical steady-state crowd flow",
        "duration": 60,
        "phases": [
            {"time": 0, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0}
        ],
    },
    "rising_density": {
        "name": "Rising Density",
        "description": "Crowd density gradually increasing",
        "duration": 120,
        "phases": [
            {"time": 0, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
            {"time": 15, "gate_modifications": {"G3": {"flow_rate": 25}}, "zone_modifications": {}, "inflow_multiplier": 2.0},
            {"time": 45, "gate_modifications": {"G3": {"flow_rate": 35}}, "zone_modifications": {}, "inflow_multiplier": 3.0},
        ],
    },
    "crowd_surge": {
        "name": "Crowd Surge",
        "description": "Rapid crowd influx creating dangerous conditions",
        "duration": 180,
        "phases": [
            {"time": 0, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
            {"time": 10, "gate_modifications": {"G3": {"flow_rate": 40}}, "zone_modifications": {}, "inflow_multiplier": 3.0},
            {"time": 30, "gate_modifications": {"G3": {"flow_rate": 50}}, "zone_modifications": {}, "inflow_multiplier": 4.0},
            {"time": 50, "gate_modifications": {"G1": {"flow_rate": 30}, "G2": {"flow_rate": 30}}, "zone_modifications": {}, "inflow_multiplier": 5.0},
            # Intervention
            {"time": 80, "gate_modifications": {"G3": {"is_blocked": True}, "E2": {"is_blocked": False, "flow_rate": 30}}, "zone_modifications": {}, "inflow_multiplier": 3.0},
            {"time": 110, "gate_modifications": {"G3": {"is_blocked": True}, "E2": {"flow_rate": 40}}, "zone_modifications": {}, "inflow_multiplier": 2.0},
            {"time": 140, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
        ],
    },
    "gate_blocked": {
        "name": "Gate Blocked",
        "description": "Emergency exit blocked, crowd rerouting",
        "duration": 120,
        "phases": [
            {"time": 0, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
            {"time": 15, "gate_modifications": {"E1": {"is_blocked": True}}, "zone_modifications": {}, "inflow_multiplier": 1.5},
            {"time": 60, "gate_modifications": {"E2": {"flow_rate": 20}}, "zone_modifications": {}, "inflow_multiplier": 1.5},
        ],
    },
    "reverse_flow": {
        "name": "Reverse Flow",
        "description": "Crowd suddenly reversing direction",
        "duration": 120,
        "phases": [
            {"time": 0, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
            {"time": 20, "gate_modifications": {"G1": {"flow_rate": 40}, "G2": {"flow_rate": 40}}, "zone_modifications": {}, "inflow_multiplier": 4.0},
            {"time": 40, "gate_modifications": {"G1": {"is_blocked": True}, "G2": {"is_blocked": True}}, "zone_modifications": {}, "inflow_multiplier": 0.5},
            {"time": 60, "gate_modifications": {"G1": {"is_blocked": True}, "G2": {"is_blocked": True}, "E1": {"flow_rate": 30}}, "zone_modifications": {}, "inflow_multiplier": 0.3},
        ],
    },
    "panic_like": {
        "name": "Panic-Like Flow",
        "description": "Sudden acceleration and scattered movement",
        "duration": 180,
        "phases": [
            {"time": 0, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
            {"time": 10, "gate_modifications": {"G3": {"flow_rate": 50}}, "zone_modifications": {}, "inflow_multiplier": 5.0},
            {"time": 25, "gate_modifications": {"G3": {"flow_rate": 50}, "G1": {"flow_rate": 40}}, "zone_modifications": {}, "inflow_multiplier": 6.0},
            {"time": 40, "gate_modifications": {"G3": {"flow_rate": 50}, "G1": {"flow_rate": 40}, "E1": {"is_blocked": True}, "E2": {"is_blocked": True}}, "zone_modifications": {}, "inflow_multiplier": 6.0},
            {"time": 70, "gate_modifications": {"E1": {"is_blocked": False, "flow_rate": 35}, "E2": {"is_blocked": False, "flow_rate": 35}, "G3": {"is_blocked": True}}, "zone_modifications": {}, "inflow_multiplier": 2.0},
            {"time": 120, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
        ],
    },
    "recovery": {
        "name": "Recovery",
        "description": "Post-incident recovery, crowd thinning",
        "duration": 90,
        "phases": [
            {"time": 0, "gate_modifications": {"G1": {"flow_rate": 5}, "G2": {"flow_rate": 5}, "G3": {"flow_rate": 5}}, "zone_modifications": {}, "inflow_multiplier": 0.3},
            {"time": 30, "gate_modifications": {"G1": {"flow_rate": 8}, "G2": {"flow_rate": 8}, "G3": {"flow_rate": 8}}, "zone_modifications": {}, "inflow_multiplier": 0.5},
            {"time": 60, "gate_modifications": {}, "zone_modifications": {}, "inflow_multiplier": 1.0},
        ],
    },
}

# ──────────────────────────────────────────────────────────────
# Risk Engine
# ──────────────────────────────────────────────────────────────

class RiskEngine:
    """Rule-based + heuristic risk prediction engine."""
    
    CRITICAL_TRIGGER = 75
    HIGH_TRIGGER = 50
    MODERATE_TRIGGER = 25
    HYSTERESIS_RECOVERY = 15
    CONFIRMATION_FRAMES = 3
    
    def __init__(self):
        self._critical_count: dict[str, int] = {}
        self._high_count: dict[str, int] = {}
        self._prev_risk: dict[str, float] = {}
    
    def calculate_risk(self, zone: SimZone) -> dict:
        """Calculate comprehensive risk score with contributing factors."""
        factors = []
        
        # 1. Density factor (0-30 points)
        if zone.area_sqm > 0:
            density_ratio = zone.person_count / zone.area_sqm
        else:
            density_ratio = 0
        
        if density_ratio > zone.critical_density:
            density_score = 30
        elif density_ratio > zone.high_density:
            density_score = 22
        elif density_ratio > zone.moderate_density:
            density_score = 12
        else:
            density_score = (density_ratio / max(zone.moderate_density, 0.01)) * 10
        
        factors.append({"factor": "Crowd Density", "contribution": round(density_score, 1), "value": f"{density_ratio:.2f} p/m²"})
        
        # 2. Density growth rate (0-20 points)
        growth = zone.density_history[-1] if zone.density_history else 0
        if growth > 0.5:
            growth_score = 20
        elif growth > 0.3:
            growth_score = 14
        elif growth > 0.1:
            growth_score = 8
        else:
            growth_score = max(0, growth * 30)
        
        factors.append({"factor": "Density Growth", "contribution": round(growth_score, 1), "value": f"+{growth*100:.0f}%"})
        
        # 3. Speed factor (0-20 points) — lower speed = higher risk
        if zone.avg_velocity < 0.3:
            speed_score = 20
        elif zone.avg_velocity < 0.6:
            speed_score = 15
        elif zone.avg_velocity < 0.9:
            speed_score = 8
        else:
            speed_score = 2
        
        factors.append({"factor": "Speed Reduction", "contribution": round(speed_score, 1), "value": f"{zone.avg_velocity:.2f} m/s"})
        
        # 4. Flow conflict (0-15 points)
        conflict_score = zone.flow_conflict * 15
        factors.append({"factor": "Flow Conflict", "contribution": round(conflict_score, 1), "value": f"{zone.flow_conflict:.2f}"})
        
        # 5. Bottleneck (0-15 points)
        bottleneck_score = zone.bottleneck_score * 15
        factors.append({"factor": "Bottleneck", "contribution": round(bottleneck_score, 1), "value": f"{zone.bottleneck_score:.2f}"})
        
        # 6. Velocity variance (0-10 points)
        variance_score = min(zone.velocity_variance * 10, 10)
        factors.append({"factor": "Velocity Variance", "contribution": round(variance_score, 1), "value": f"{zone.velocity_variance:.2f}"})
        
        # 7. Anomaly score (0-10 points)
        anomaly_score = zone.anomaly_score * 10
        factors.append({"factor": "Behavior Anomaly", "contribution": round(anomaly_score, 1), "value": f"{zone.anomaly_score:.2f}"})
        
        raw_score = min(100, density_score + growth_score + speed_score + conflict_score + bottleneck_score + variance_score + anomaly_score)
        
        # Temporal smoothing with hysteresis
        prev = self._prev_risk.get(zone.id, 0)
        smoothed = prev * 0.3 + raw_score * 0.7
        
        # Apply hysteresis
        if prev >= self.CRITICAL_TRIGGER:
            smoothed = max(smoothed, prev - self.HYSTERESIS_RECOVERY)
        elif prev >= self.HIGH_TRIGGER:
            smoothed = max(smoothed, prev - self.HYSTERESIS_RECOVERY)
        
        # Confirmation frames
        zone_key = zone.id
        if smoothed >= self.CRITICAL_TRIGGER:
            self._critical_count[zone_key] = self._critical_count.get(zone_key, 0) + 1
            if self._critical_count[zone_key] < self.CONFIRMATION_FRAMES:
                smoothed = min(smoothed, self.CRITICAL_TRIGGER - 1)
        else:
            self._critical_count[zone_key] = 0
        
        if smoothed >= self.HIGH_TRIGGER:
            self._high_count[zone_key] = self._high_count.get(zone_key, 0) + 1
            if self._high_count[zone_key] < self.CONFIRMATION_FRAMES:
                smoothed = min(smoothed, self.HIGH_TRIGGER - 1)
        else:
            self._high_count[zone_key] = 0
        
        self._prev_risk[zone_key] = smoothed
        
        # Risk level
        if smoothed >= self.CRITICAL_TRIGGER:
            risk_level = "CRITICAL"
        elif smoothed >= self.HIGH_TRIGGER:
            risk_level = "HIGH"
        elif smoothed >= self.MODERATE_TRIGGER:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"
        
        # Prediction horizon
        if smoothed > 50:
            rate_of_change = (smoothed - prev) if prev > 0 else 0
            if rate_of_change > 5:
                horizon = max(1, min(15, int((100 - smoothed) / max(rate_of_change, 0.1))))
            else:
                horizon = max(5, min(30, int((100 - smoothed) / max(rate_of_change, 0.01))))
        else:
            horizon = 15
        
        confidence = min(0.98, 0.6 + (self._critical_count.get(zone_key, 0) + self._high_count.get(zone_key, 0)) * 0.05)
        
        zone.risk_score = round(smoothed, 1)
        zone.risk_level = risk_level
        
        return {
            "risk_score": round(smoothed, 1),
            "risk_level": risk_level,
            "prediction_horizon_minutes": min(horizon, 30),
            "confidence": round(confidence, 2),
            "zone_id": zone.id,
            "contributing_factors": factors,
        }


# ──────────────────────────────────────────────────────────────
# Recommendation Engine
# ──────────────────────────────────────────────────────────────

class RecommendationEngine:
    """Generates actionable recommendations based on risk state."""
    
    def generate(self, zones: dict[str, SimZone], gates: dict[str, SimGate]) -> list[SimRecommendation]:
        recs = []
        for zid, zone in zones.items():
            if zone.risk_level in ("HIGH", "CRITICAL"):
                ratio = zone.person_count / max(zone.area_sqm * zone.critical_density, 1)
                
                if ratio > 1.0:
                    recs.append(SimRecommendation(
                        id=str(uuid.uuid4())[:8],
                        action_type="OPEN_EXIT",
                        title=f"Open alternate exit near {zone.name}",
                        description=f"Density at {zone.name} exceeds critical threshold ({ratio:.0%} of capacity). Open nearby emergency exit.",
                        expected_effect="Reduce density by redirecting outflow",
                        priority="HIGH" if zone.risk_level == "CRITICAL" else "MEDIUM",
                        zone_id=zid,
                        confidence=0.9,
                    ))
                
                blocked = [g for g in gates.values() if g.gate_type == "exit" and not g.is_blocked and g.zone_id == zid]
                if blocked:
                    recs.append(SimRecommendation(
                        id=str(uuid.uuid4())[:8],
                        action_type="REDIRECT_CROWD",
                        title=f"Redirect crowd away from {zone.name}",
                        description=f"Send incoming crowd toward less congested zones.",
                        expected_effect="Reduce inflow pressure",
                        priority="HIGH",
                        zone_id=zid,
                        confidence=0.85,
                    ))
                
                if zone.risk_level == "CRITICAL":
                    recs.append(SimRecommendation(
                        id=str(uuid.uuid4())[:8],
                        action_type="RESTRICT_ENTRY",
                        title=f"Temporarily restrict entry to {zone.name}",
                        description=f"Close or reduce flow at entry gates serving {zone.name}.",
                        expected_effect="Stop density increase",
                        priority="HIGH",
                        zone_id=zid,
                        confidence=0.92,
                    ))
                    recs.append(SimRecommendation(
                        id=str(uuid.uuid4())[:8],
                        action_type="DEPLOY_SECURITY",
                        title=f"Deploy +{max(3, int(ratio * 5))} security personnel to {zone.name}",
                        description=f"Deploy additional security personnel to manage crowd at {zone.name}.",
                        expected_effect="Improve crowd control and flow management",
                        priority="HIGH",
                        zone_id=zid,
                        confidence=0.88,
                    ))
                    recs.append(SimRecommendation(
                        id=str(uuid.uuid4())[:8],
                        action_type="ISSUE_ANNOUNCEMENT",
                        title=f"Broadcast safety announcement for {zone.name}",
                        description="Issue calm multilingual announcement directing people to safe exits.",
                        expected_effect="Inform citizens and reduce panic risk",
                        priority="HIGH",
                        zone_id=zid,
                        confidence=0.95,
                    ))
        
        return recs


# ──────────────────────────────────────────────────────────────
# Main simulation
# ──────────────────────────────────────────────────────────────

class CrowdSimulation:
    """Real-time crowd simulation engine for the digital twin."""
    
    def __init__(self):
        self.zones: dict[str, SimZone] = {}
        self.gates: dict[str, SimGate] = {}
        self.risk_engine = RiskEngine()
        self.recommendation_engine = RecommendationEngine()
        self.scenario: Optional[str] = None
        self.scenario_elapsed: float = 0.0
        self.is_running: bool = False
        self.tick_rate: float = 1.0  # seconds between ticks
        self._task: Optional[asyncio.Task] = None
        self.alerts: list[SimAlert] = []
        self.recommendations: list[SimRecommendation] = []
        self.risk_history: dict[str, list] = {}  # zone_id -> [{time, score}]
        self.overall_risk_history: list = []
        self._listeners: list = []
        self._current_phase_idx: dict[str, int] = {}
        self._last_alert_time: dict[str, float] = {}
        self._metrics_history: list = []
        self._alert_id_counter = 0
        self._active_alerts: dict[str, SimAlert] = {}  # zone_id -> current active alert
        self.incidents: list = []
    
    def initialize_demo_venue(self):
        """Set up the CrowdShield Demo Festival venue."""
        self.zones = {
            "Z1": SimZone("Z1", "Main Entrance", area_sqm=1200, max_capacity=1200, zone_type="entrance"),
            "Z2": SimZone("Z2", "Central Plaza", area_sqm=2500, max_capacity=2500, zone_type="plaza"),
            "Z3": SimZone("Z3", "Food Court", area_sqm=800, max_capacity=800, zone_type="food"),
            "Z4": SimZone("Z4", "Stadium", area_sqm=3000, max_capacity=3000, zone_type="stadium"),
            "Z5": SimZone("Z5", "Emergency Exit Zone", area_sqm=600, max_capacity=600, zone_type="exit"),
            "Z6": SimZone("Z6", "North Corridor", area_sqm=400, max_capacity=400, zone_type="corridor"),
            "Z7": SimZone("Z7", "VIP Area", area_sqm=500, max_capacity=500, zone_type="vip"),
        }
        self.gates = {
            "G1": SimGate("G1", "Gate 1", "entry", "Z1", capacity=500, flow_rate=10),
            "G2": SimGate("G2", "Gate 2", "entry", "Z1", capacity=400, flow_rate=8),
            "G3": SimGate("G3", "Gate 3", "entry", "Z4", capacity=600, flow_rate=12),
            "G4": SimGate("G4", "Gate 4", "entry", "Z6", capacity=300, flow_rate=6),
            "E1": SimGate("E1", "Exit A", "exit", "Z5", capacity=500, flow_rate=15),
            "E2": SimGate("E2", "Exit B", "exit", "Z2", capacity=400, flow_rate=12),
            "E3": SimGate("E3", "Exit C", "emergency", "Z5", capacity=300, flow_rate=20, is_blocked=True),
        }
        # Initial state
        self.zones["Z1"].person_count = 200
        self.zones["Z2"].person_count = 450
        self.zones["Z3"].person_count = 120
        self.zones["Z4"].person_count = 350
        self.zones["Z5"].person_count = 80
        self.zones["Z6"].person_count = 150
        self.zones["Z7"].person_count = 60
        self._recalc_all_densities()
    
    def _recalc_all_densities(self):
        for z in self.zones.values():
            z.density = z.person_count / max(z.area_sqm, 1)
            z.density_history.append(z.density)
            if len(z.density_history) > 60:
                z.density_history = z.density_history[-60:]
    
    def start_scenario(self, scenario_key: str):
        if scenario_key not in SCENARIOS:
            raise ValueError(f"Unknown scenario: {scenario_key}")
        self.scenario = scenario_key
        self.scenario_elapsed = 0.0
        self._current_phase_idx = {}
        self.alerts.clear()
        self.recommendations.clear()
        self.risk_history.clear()
        self.overall_risk_history.clear()
        self.risk_engine = RiskEngine()
        self._last_alert_time.clear()
        self._active_alerts.clear()
        # Reset gates to default
        for g in self.gates.values():
            g.is_blocked = False
            g.flow_rate = 15.0
        logger.info("scenario_started", scenario=scenario_key)
    
    def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
    
    async def run(self, scenario_key: str = "crowd_surge"):
        self.initialize_demo_venue()
        self.start_scenario(scenario_key)
        self.is_running = True
        self._task = asyncio.current_task()
        
        while self.is_running:
            await self._tick()
            await asyncio.sleep(self.tick_rate)
    
    async def _tick(self):
        self.scenario_elapsed += self.tick_rate
        scenario = SCENARIOS.get(self.scenario)
        if not scenario:
            return
        
        # Apply scenario phases
        for i, phase in enumerate(scenario["phases"]):
            if self.scenario_elapsed >= phase["time"] and self._current_phase_idx.get(self.scenario, -1) < i:
                self._apply_phase(phase)
                self._current_phase_idx[self.scenario] = i
        
        # Simulate crowd dynamics
        self._simulate_dynamics()
        
        # Calculate risk for all zones
        for zone in self.zones.values():
            risk = self.risk_engine.calculate_risk(zone)
            zid = zone.id
            if zid not in self.risk_history:
                self.risk_history[zid] = []
            self.risk_history[zid].append({
                "time": round(self.scenario_elapsed, 1),
                "score": risk["risk_score"],
                "level": risk["risk_level"],
            })
            if len(self.risk_history[zid]) > 300:
                self.risk_history[zid] = self.risk_history[zid][-300:]
        
        # Feed data to ML engine (import once, reuse singleton)
        try:
            if not hasattr(self, '_ml_engine'):
                import sys, os
                # Find project root (crowdshield/)
                project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
                sys.path.insert(0, project_root)
                from ml.inference import MLRiskEngine
                model_path = os.path.join(project_root, 'ml', 'models', 'risk_model.json')
                self._ml_engine = MLRiskEngine(model_path=model_path)
            for zone in self.zones.values():
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
                self._ml_engine.update_zone(zone.id, metrics)
        except Exception:
            pass
        
        # Feed data to sequence model manager (LSTM + Transformer)
        try:
            if not hasattr(self, '_seq_manager'):
                import sys, os
                project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
                sys.path.insert(0, project_root)
                from ml.lightweight_sequence import SequenceModelManager
                self._seq_manager = SequenceModelManager()
            for zone in self.zones.values():
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
                self._seq_manager.update_zone(zone.id, metrics)
        except Exception:
            pass
        
        # Overall risk
        overall = max((z.risk_score for z in self.zones.values()), default=0)
        self.overall_risk_history.append({
            "time": round(self.scenario_elapsed, 1),
            "score": round(overall, 1),
        })
        if len(self.overall_risk_history) > 300:
            self.overall_risk_history = self.overall_risk_history[-300:]
        
        # Generate alerts
        self._generate_alerts()
        
        # Generate recommendations
        self.recommendations = self.recommendation_engine.generate(self.zones, self.gates)
        
        # Notify listeners
        await self._notify_listeners()
    
    def _apply_phase(self, phase: dict):
        for gate_id, mods in phase.get("gate_modifications", {}).items():
            if gate_id in self.gates:
                gate = self.gates[gate_id]
                for k, v in mods.items():
                    if hasattr(gate, k):
                        setattr(gate, k, v)
        
        inflow = phase.get("inflow_multiplier", 1.0)
        # Apply to entry gates
        base_rates = {"G1": 10, "G2": 8, "G3": 12, "G4": 6}
        for gid, base in base_rates.items():
            if gid in self.gates:
                gate = self.gates[gid]
                if not gate.is_blocked:
                    gate.flow_rate = base * inflow
        
        logger.info("phase_applied", elapsed=self.scenario_elapsed, inflow=inflow)
    
    def _simulate_dynamics(self):
        inflow = 0
        outflow = 0
        
        # Process gates
        for gate in self.gates.values():
            if gate.is_blocked:
                gate.current_flow = 0
                continue
            
            if gate.gate_type == "entry" or gate.gate_type == "exit":
                zone = self.zones.get(gate.zone_id)
                if not zone:
                    continue
                
                noise = random.uniform(0.8, 1.2)
                flow = gate.flow_rate * noise
                
                if gate.gate_type == "entry":
                    zone.entry_rate = flow
                    zone.person_count += int(flow * self.tick_rate)
                    inflow += flow
                else:
                    exit_rate = min(flow, zone.person_count * 0.1)
                    zone.exit_rate = exit_rate
                    zone.person_count = max(0, zone.person_count - int(exit_rate * self.tick_rate))
                    outflow += exit_rate
            
            gate.current_flow = gate.flow_rate * random.uniform(0.85, 1.15)
        
        # Zone-to-zone transfers
        # Z1 -> Z2, Z6
        self._transfer("Z1", "Z2", 0.02)
        self._transfer("Z1", "Z6", 0.01)
        # Z6 -> Z4
        self._transfer("Z6", "Z4", 0.03)
        # Z4 -> Z2
        self._transfer("Z4", "Z2", 0.015)
        # Z2 -> Z3
        self._transfer("Z2", "Z3", 0.01)
        # Z2 -> Z5
        self._transfer("Z2", "Z5", 0.005)
        # Z5 -> out
        self._drain_zone("Z5", 0.05)
        
        # Calculate metrics
        for zone in self.zones.values():
            zid = zone.id
            ratio = zone.person_count / max(zone.area_sqm, 1)
            
            # Velocity: decreases as density increases
            if ratio > zone.critical_density:
                zone.avg_velocity = random.uniform(0.1, 0.3)
                zone.velocity_variance = random.uniform(0.5, 1.5)
            elif ratio > zone.high_density:
                zone.avg_velocity = random.uniform(0.3, 0.7)
                zone.velocity_variance = random.uniform(0.3, 0.8)
            elif ratio > zone.moderate_density:
                zone.avg_velocity = random.uniform(0.7, 1.0)
                zone.velocity_variance = random.uniform(0.1, 0.4)
            else:
                zone.avg_velocity = random.uniform(1.0, 1.5)
                zone.velocity_variance = random.uniform(0.05, 0.2)
            
            zone.velocity_history.append(zone.avg_velocity)
            if len(zone.velocity_history) > 60:
                zone.velocity_history = zone.velocity_history[-60:]
            
            # Flow
            zone.flow_magnitude = zone.avg_velocity * (1 + random.uniform(-0.1, 0.1))
            
            prev_density = zone.density_history[-2] if len(zone.density_history) >= 2 else zone.density
            zone.density_history.append(ratio)
            if len(zone.density_history) > 60:
                zone.density_history = zone.density_history[-60:]
            zone.density = ratio
            
            growth = (ratio - prev_density) / max(prev_density, 0.001) if prev_density > 0 else 0
            zone.density_growth_rate = growth
            
            # Flow conflict: how many conflicting directions
            blocked_neighbors = sum(1 for g in self.gates.values() if g.zone_id == zid and g.is_blocked)
            zone.flow_conflict = min(1.0, blocked_neighbors * 0.3 + (zone.velocity_variance * 0.5))
            
            # Flow consistency
            zone.flow_consistency = max(0, 1.0 - zone.flow_conflict - zone.velocity_variance * 0.3)
            
            # Bottleneck: high density + low speed + blocked exits
            density_factor = min(1.0, ratio / max(zone.critical_density, 0.1))
            speed_factor = max(0, 1.0 - zone.avg_velocity / 1.5)
            exit_factor = blocked_neighbors * 0.25
            zone.bottleneck_score = min(1.0, density_factor * 0.4 + speed_factor * 0.3 + exit_factor * 0.3)
            
            # Anomaly detection
            anomaly_signals = []
            # Sudden density spike
            if len(zone.density_history) >= 3:
                d_rates = [zone.density_history[i] - zone.density_history[i-1] for i in range(-2, 0)]
                if any(r > 0.2 for r in d_rates):
                    anomaly_signals.append(0.3)
            # Low speed in moving crowd
            if zone.avg_velocity < 0.3 and zone.flow_magnitude > 0.5:
                anomaly_signals.append(0.3)
            # High flow conflict
            if zone.flow_conflict > 0.6:
                anomaly_signals.append(0.25)
            # Reverse flow indicator (blocked entry, open exit)
            entry_blocked = any(g.is_blocked and g.gate_type == "entry" for g in self.gates.values() if g.zone_id == zid)
            if entry_blocked and zone.person_count > zone.max_capacity * 0.5:
                anomaly_signals.append(0.15)
            
            zone.anomaly_score = min(1.0, sum(anomaly_signals))
    
    def _transfer(self, from_id: str, to_id: str, rate: float):
        src = self.zones.get(from_id)
        dst = self.zones.get(to_id)
        if not src or not dst:
            return
        count = max(0, int(src.person_count * rate * self.tick_rate * random.uniform(0.5, 1.5)))
        if count > 0:
            src.person_count = max(0, src.person_count - count)
            dst.person_count += count
    
    def _drain_zone(self, zone_id: str, rate: float):
        zone = self.zones.get(zone_id)
        if zone:
            drain = max(0, int(zone.person_count * rate * self.tick_rate * random.uniform(0.7, 1.3)))
            zone.person_count = max(0, zone.person_count - drain)
    
    def _generate_alerts(self):
        """Generate alerts with deduplication — one active alert per zone."""
        now = self.scenario_elapsed
        zones_to_remove = []
        
        for zone in self.zones.values():
            key = zone.id
            existing = self._active_alerts.get(key)
            
            # Determine what alert severity this zone should have
            target_severity = None
            target_title = None
            target_message = None
            
            if zone.risk_level == "CRITICAL":
                target_severity = "CRITICAL"
                target_title = f"{zone.name} at dangerous density"
                target_message = f"Density at {zone.name} ({zone.density:.2f} p/m²) exceeds critical threshold. Movement speed severely reduced. Immediate action required."
            elif zone.risk_level == "HIGH":
                target_severity = "WARNING"
                target_title = f"HIGH risk at {zone.name}"
                target_message = f"{zone.name} approaching critical density ({zone.density:.2f} p/m²). Monitor closely."
            
            if target_severity is None:
                # Zone is safe — remove active alert if it exists
                if existing:
                    zones_to_remove.append(key)
                continue
            
            if existing:
                # Update existing alert in-place (don't create new one)
                existing.title = target_title
                existing.message = target_message
                existing.severity = target_severity
            else:
                # Create new alert only if none exists for this zone
                self._alert_id_counter += 1
                alert = SimAlert(
                    id=f"ALT-{self._alert_id_counter:04d}",
                    zone_id=key,
                    severity=target_severity,
                    title=target_title,
                    message=target_message,
                    alert_type="density",
                )
                self._active_alerts[key] = alert
                self.alerts.append(alert)
        
        # Remove alerts for zones that returned to safe levels
        for key in zones_to_remove:
            removed = self._active_alerts.pop(key, None)
            if removed:
                removed.is_acknowledged = True  # mark as resolved in history
        
        # Keep only last 50 in history
        if len(self.alerts) > 50:
            self.alerts = self.alerts[-50:]
    
    def get_active_alerts(self) -> list[dict]:
        """Return deduplicated active alerts with elapsed time."""
        now = datetime.utcnow()
        result = []
        for alert in self._active_alerts.values():
            elapsed = (now - alert.created_at).total_seconds()
            result.append({
                "id": alert.id,
                "zone_id": alert.zone_id,
                "severity": alert.severity,
                "title": alert.title,
                "message": alert.message,
                "alert_type": alert.alert_type,
                "created_at": alert.created_at.isoformat(),
                "elapsed_seconds": round(elapsed),
                "is_acknowledged": alert.is_acknowledged,
            })
        # Sort by severity (CRITICAL first), then by most recent
        severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
        result.sort(key=lambda a: (severity_order.get(a["severity"], 9), -a["elapsed_seconds"]))
        return result
    
    def acknowledge_alert(self, alert_id: str) -> bool:
        """Acknowledge (dismiss) an active alert."""
        for key, alert in self._active_alerts.items():
            if alert.id == alert_id:
                alert.is_acknowledged = True
                del self._active_alerts[key]
                return True
        return False
    
    def on_update(self, callback):
        self._listeners.append(callback)
    
    async def _notify_listeners(self):
        data = self.get_state()
        for cb in self._listeners:
            try:
                await cb(data)
            except Exception:
                pass
    
    def get_state(self) -> dict:
        overall_risk = max((z.risk_score for z in self.zones.values()), default=0)
        
        zones_state = {}
        for zid, z in self.zones.items():
            zones_state[zid] = {
                "id": z.id,
                "name": z.name,
                "person_count": z.person_count,
                "density": round(z.density, 3),
                "area_sqm": z.area_sqm,
                "max_capacity": z.max_capacity,
                "avg_velocity": round(z.avg_velocity, 2),
                "velocity_variance": round(z.velocity_variance, 2),
                "flow_direction": z.flow_direction,
                "flow_magnitude": round(z.flow_magnitude, 2),
                "flow_consistency": round(z.flow_consistency, 2),
                "flow_conflict": round(z.flow_conflict, 2),
                "entry_rate": round(z.entry_rate, 1),
                "exit_rate": round(z.exit_rate, 1),
                "bottleneck_score": round(z.bottleneck_score, 2),
                "anomaly_score": round(z.anomaly_score, 2),
                "risk_score": z.risk_score,
                "risk_level": z.risk_level,
                "zone_type": z.zone_type,
                "density_growth_rate": round(z.density_growth_rate, 3),
            }
        
        gates_state = {}
        for gid, g in self.gates.items():
            gates_state[gid] = {
                "id": g.id,
                "name": g.name,
                "gate_type": g.gate_type,
                "zone_id": g.zone_id,
                "capacity": g.capacity,
                "is_blocked": g.is_blocked,
                "flow_rate": round(g.flow_rate, 1),
                "current_flow": round(g.current_flow, 1),
            }
        
        alerts_state = [{
            "id": a.id,
            "zone_id": a.zone_id,
            "severity": a.severity,
            "title": a.title,
            "message": a.message,
            "alert_type": a.alert_type,
            "created_at": a.created_at.isoformat(),
            "is_acknowledged": a.is_acknowledged,
        } for a in self.alerts[-20:]]
        
        recs_state = [{
            "id": r.id,
            "action_type": r.action_type,
            "title": r.title,
            "description": r.description,
            "expected_effect": r.expected_effect,
            "priority": r.priority,
            "zone_id": r.zone_id,
            "confidence": r.confidence,
        } for r in self.recommendations]
        
        overall_risk_level = "CRITICAL" if overall_risk >= 75 else "HIGH" if overall_risk >= 50 else "MODERATE" if overall_risk >= 25 else "LOW"
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "scenario": self.scenario,
            "scenario_name": SCENARIOS.get(self.scenario, {}).get("name", "Unknown"),
            "elapsed_seconds": round(self.scenario_elapsed, 1),
            "is_running": self.is_running,
            "overall_risk": round(overall_risk, 1),
            "overall_risk_level": overall_risk_level,
            "zones": zones_state,
            "gates": gates_state,
            "alerts": alerts_state,
            "recommendations": recs_state,
            "total_persons": sum(z.person_count for z in self.zones.values()),
        }


# Singleton
simulation = CrowdSimulation()
