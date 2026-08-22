"""Database models for CrowdShield."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


def gen_uuid():
    return str(uuid.uuid4())


class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatus(str, enum.Enum):
    DETECTED = "DETECTED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESPONDING = "RESPONDING"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"


class IncidentType(str, enum.Enum):
    CROWD_SURGE = "CROWD_SURGE"
    BOTTLENECK = "BOTTLENECK"
    REVERSE_FLOW = "REVERSE_FLOW"
    BLOCKED_ROUTE = "BLOCKED_ROUTE"
    MEDICAL = "MEDICAL"
    FIRE = "FIRE"
    PANIC = "PANIC"
    OTHER = "OTHER"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    COMMANDER = "COMMANDER"
    OPERATOR = "OPERATOR"
    SECURITY = "SECURITY"
    ANALYST = "ANALYST"
    CITIZEN = "CITIZEN"


# --- User & Auth ---

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default=UserRole.OPERATOR.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- Venue ---

class Venue(Base):
    __tablename__ = "venues"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    address = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    capacity = Column(Integer, default=10000)
    venue_type = Column(String(50), default="festival")  # festival, stadium, concert, etc.
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    zones = relationship("Zone", back_populates="venue", cascade="all,delete-orphan")
    cameras = relationship("Camera", back_populates="venue", cascade="all,delete-orphan")


class Zone(Base):
    __tablename__ = "zones"
    id = Column(String, primary_key=True, default=gen_uuid)
    venue_id = Column(String, ForeignKey("venues.id"), nullable=False)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(50))  # entrance, exit, corridor, plaza, etc.
    area_sqm = Column(Float, default=1000.0)
    max_capacity = Column(Integer, default=1000)
    critical_density = Column(Float, default=2.0)  # people per sqm
    high_density = Column(Float, default=1.2)
    moderate_density = Column(Float, default=0.8)
    latitude = Column(Float)
    longitude = Column(Float)
    polygon = Column(JSON)  # GeoJSON polygon for map rendering
    created_at = Column(DateTime, default=datetime.utcnow)
    venue = relationship("Venue", back_populates="zones")


class Gate(Base):
    __tablename__ = "gates"
    id = Column(String, primary_key=True, default=gen_uuid)
    venue_id = Column(String, ForeignKey("venues.id"), nullable=False)
    name = Column(String(50), nullable=False)
    gate_type = Column(String(30))  # entry, exit, emergency
    zone_id = Column(String, ForeignKey("zones.id"))
    capacity = Column(Integer, default=500)
    is_blocked = Column(Boolean, default=False)
    is_one_way = Column(Boolean, default=False)
    flow_direction = Column(String(20))  # in, out, both
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Route(Base):
    __tablename__ = "routes"
    id = Column(String, primary_key=True, default=gen_uuid)
    venue_id = Column(String, ForeignKey("venues.id"), nullable=False)
    name = Column(String(100))
    from_zone_id = Column(String, ForeignKey("zones.id"))
    to_zone_id = Column(String, ForeignKey("zones.id"))
    distance_m = Column(Float)
    capacity = Column(Integer, default=500)
    current_flow = Column(Integer, default=0)
    is_blocked = Column(Boolean, default=False)
    risk_score = Column(Float, default=0.0)


# --- Camera ---

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, default=gen_uuid)
    venue_id = Column(String, ForeignKey("venues.id"), nullable=False)
    name = Column(String(100), nullable=False)
    source_type = Column(String(30))  # webcam, rtsp, uploaded, simulated
    source_url = Column(String(500))
    zone_id = Column(String, ForeignKey("zones.id"))
    is_active = Column(Boolean, default=True)
    fps = Column(Integer, default=15)
    resolution = Column(String(20), default="1920x1080")
    created_at = Column(DateTime, default=datetime.utcnow)
    venue = relationship("Venue", back_populates="cameras")


# --- Crowd Metrics (time series) ---

class CrowdMetric(Base):
    __tablename__ = "crowd_metrics"
    id = Column(String, primary_key=True, default=gen_uuid)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    camera_id = Column(String, ForeignKey("cameras.id"))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    person_count = Column(Integer, default=0)
    density = Column(Float, default=0.0)
    density_growth_rate = Column(Float, default=0.0)
    avg_velocity = Column(Float, default=0.0)
    velocity_variance = Column(Float, default=0.0)
    flow_direction = Column(Float, default=0.0)  # degrees
    flow_magnitude = Column(Float, default=0.0)
    flow_consistency = Column(Float, default=0.0)
    flow_conflict = Column(Float, default=0.0)
    entry_rate = Column(Float, default=0.0)
    exit_rate = Column(Float, default=0.0)
    bottleneck_score = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)


# --- Risk Predictions ---

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"
    id = Column(String, primary_key=True, default=gen_uuid)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default=RiskLevel.LOW.value)
    prediction_horizon_minutes = Column(Integer, default=5)
    confidence = Column(Float, default=0.0)
    contributing_factors = Column(JSON)  # list of {factor, contribution, value}
    model_version = Column(String(50), default="rule-based-v1")


# --- Alerts ---

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, default=gen_uuid)
    zone_id = Column(String, ForeignKey("zones.id"))
    severity = Column(String(20), nullable=False)  # INFO, WARNING, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text)
    alert_type = Column(String(50))  # density, flow, bottleneck, anomaly
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, ForeignKey("users.id"))
    acknowledged_at = Column(DateTime)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# --- Incidents ---

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=gen_uuid)
    incident_type = Column(String(30), nullable=False)
    venue_id = Column(String, ForeignKey("venues.id"))
    zone_id = Column(String, ForeignKey("zones.id"))
    severity = Column(String(20), default=RiskLevel.MODERATE.value)
    status = Column(String(20), default=IncidentStatus.DETECTED.value)
    title = Column(String(200))
    description = Column(Text)
    ai_summary = Column(Text)
    assigned_team = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)


# --- Recommendations ---

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(String, primary_key=True, default=gen_uuid)
    zone_id = Column(String, ForeignKey("zones.id"))
    alert_id = Column(String, ForeignKey("alerts.id"))
    action_type = Column(String(50), nullable=False)
    priority = Column(String(20), default="MEDIUM")
    title = Column(String(200))
    description = Column(Text)
    expected_effect = Column(Text)
    confidence = Column(Float, default=0.0)
    is_implemented = Column(Boolean, default=False)
    implemented_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- Security Personnel ---

class SecurityPersonnel(Base):
    __tablename__ = "security_personnel"
    id = Column(String, primary_key=True, default=gen_uuid)
    venue_id = Column(String, ForeignKey("venues.id"))
    name = Column(String(100))
    zone_id = Column(String, ForeignKey("zones.id"))
    status = Column(String(20), default="AVAILABLE")  # AVAILABLE, DEPLOYED, OFF_DUTY
    deployed_at = Column(DateTime)


# --- Citizen Reports ---

class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    id = Column(String, primary_key=True, default=gen_uuid)
    anonymous_id = Column(String(100))
    report_type = Column(String(50), nullable=False)
    zone_id = Column(String, ForeignKey("zones.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    photo_url = Column(String(500))
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# --- Simulation Runs ---

class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id = Column(String, primary_key=True, default=gen_uuid)
    venue_id = Column(String, ForeignKey("venues.id"))
    scenario = Column(String(100))
    parameters = Column(JSON)
    status = Column(String(20), default="PENDING")
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    results = Column(JSON)


# --- Audit Log ---

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String(100))
    resource_type = Column(String(50))
    resource_id = Column(String)
    details = Column(JSON)
    ip_address = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)
