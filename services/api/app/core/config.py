"""Core configuration for CrowdShield API."""
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "CrowdShield API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./crowdshield.db"
    DATABASE_SYNC_URL: str = "sqlite:///./crowdshield.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT
    SECRET_KEY: str = "crowdshield-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    
    # Risk Engine
    RISK_CRITICAL_THRESHOLD: int = 75
    RISK_HIGH_THRESHOLD: int = 50
    RISK_MODERATE_THRESHOLD: int = 25
    RISK_CONFIRMATION_FRAMES: int = 3
    RISK_HYSTERESIS_RECOVERY: int = 15
    
    # CV Pipeline
    YOLO_MODEL: str = "yolov8n.pt"
    DETECTION_CONFIDENCE: float = 0.5
    TRACKING_IOU_THRESHOLD: float = 0.3
    
    # Simulation
    SIMULATION_TICK_RATE: float = 1.0
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
