"""ML model inference for crowd risk prediction.

Provides:
- Model loading and caching
- Real-time inference from crowd metrics
- Hybrid rule-based + ML prediction
- Model versioning and hot-swapping
"""
import os
import time
from typing import Optional

import numpy as np

from .feature_engineering import CrowdFeatureExtractor, FeatureConfig, RiskLabelGenerator
from .training import RiskPredictor, TrainingConfig

import structlog

logger = structlog.get_logger()

# Default model path
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "risk_model.json")


class MLRiskEngine:
    """Hybrid risk engine combining rule-based and ML predictions.

    The engine:
    1. Extracts features from time-series crowd metrics
    2. Runs both rule-based and ML prediction
    3. Combines predictions with configurable weights
    4. Applies temporal smoothing and hysteresis

    If ML model is not available, falls back to rule-based only.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        ml_weight: float = 0.6,
        rule_weight: float = 0.4,
        confirmation_frames: int = 3,
        hysteresis_recovery: int = 15,
    ):
        self.ml_weight = ml_weight
        self.rule_weight = rule_weight
        self.confirmation_frames = confirmation_frames
        self.hysteresis_recovery = hysteresis_recovery

        self._feature_extractor = CrowdFeatureExtractor()
        self._rule_generator = RiskLabelGenerator()
        self._ml_predictor: Optional[RiskPredictor] = None

        # State tracking
        self._zone_history: dict[str, list[dict]] = {}
        self._zone_predictions: dict[str, list[dict]] = {}
        self._prev_risk: dict[str, float] = {}
        self._critical_count: dict[str, int] = {}
        self._high_count: dict[str, int] = {}

        # Try to load ML model
        if model_path is None:
            model_path = DEFAULT_MODEL_PATH

        self._load_model(model_path)

    def _load_model(self, path: str):
        """Load ML model if available."""
        if os.path.exists(path):
            try:
                self._ml_predictor = RiskPredictor()
                self._ml_predictor.load(path)
                logger.info("ml_model_loaded", path=path)
            except Exception as e:
                logger.warning("ml_model_load_failed", path=path, error=str(e))
                self._ml_predictor = None
        else:
            logger.info("ml_model_not_found", path=path, msg="Using rule-based only")

    def update_zone(self, zone_id: str, metrics: dict) -> dict:
        """Update a zone with new metrics and return risk prediction.

        Args:
            zone_id: Zone identifier
            metrics: Current crowd metrics dict

        Returns:
            Risk prediction dict with score, level, confidence, factors
        """
        # Append to history
        if zone_id not in self._zone_history:
            self._zone_history[zone_id] = []
        self._zone_history[zone_id].append(metrics)

        # Keep history bounded
        if len(self._zone_history[zone_id]) > 120:
            self._zone_history[zone_id] = self._zone_history[zone_id][-120:]

        history = self._zone_history[zone_id]

        # ── Rule-based prediction ──
        rule_score = self._rule_generator.generate_label(metrics)

        # ── ML prediction ──
        ml_score = None
        if self._ml_predictor and self._ml_predictor.is_trained:
            zone_config = {
                "area_sqm": metrics.get("area_sqm", 1000),
                "max_capacity": metrics.get("max_capacity", 1000),
                "critical_density": metrics.get("critical_density", 2.0),
            }
            ml_result = self._ml_predictor.predict_from_history(history, zone_config)
            if ml_result:
                ml_score = ml_result["risk_score"]

        # ── Combine predictions ──
        if ml_score is not None:
            raw_score = rule_score * self.rule_weight + ml_score * self.ml_weight
            model_used = "hybrid"
            confidence = 0.85
        else:
            raw_score = rule_score
            model_used = "rule-based"
            confidence = 0.7

        # ── Temporal smoothing ──
        prev = self._prev_risk.get(zone_id, 0)
        smoothed = prev * 0.3 + raw_score * 0.7

        # ── Hysteresis ──
        if prev >= 75:  # CRITICAL
            smoothed = max(smoothed, prev - self.hysteresis_recovery)
        elif prev >= 50:  # HIGH
            smoothed = max(smoothed, prev - self.hysteresis_recovery * 0.7)

        # ── Confirmation frames ──
        if smoothed >= 75:
            self._critical_count[zone_id] = self._critical_count.get(zone_id, 0) + 1
            if self._critical_count[zone_id] < self.confirmation_frames:
                smoothed = min(smoothed, 74)
        else:
            self._critical_count[zone_id] = 0

        if smoothed >= 50:
            self._high_count[zone_id] = self._high_count.get(zone_id, 0) + 1
            if self._high_count[zone_id] < self.confirmation_frames:
                smoothed = min(smoothed, 49)
        else:
            self._high_count[zone_id] = 0

        self._prev_risk[zone_id] = smoothed

        # ── Risk level ──
        if smoothed >= 75:
            risk_level = "CRITICAL"
        elif smoothed >= 50:
            risk_level = "HIGH"
        elif smoothed >= 25:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        # ── Contributing factors ──
        factors = self._compute_factors(metrics)

        # ── Prediction horizon ──
        rate_of_change = smoothed - prev if prev > 0 else 0
        if rate_of_change > 5:
            horizon = max(1, min(15, int((100 - smoothed) / max(rate_of_change, 0.1))))
        elif rate_of_change > 0:
            horizon = max(5, min(30, int((100 - smoothed) / max(rate_of_change, 0.01))))
        else:
            horizon = 30

        result = {
            "risk_score": round(smoothed, 1),
            "raw_score": round(raw_score, 1),
            "rule_score": round(rule_score, 1),
            "ml_score": round(ml_score, 1) if ml_score else None,
            "risk_level": risk_level,
            "model_used": model_used,
            "confidence": round(confidence, 2),
            "prediction_horizon_minutes": min(horizon, 30),
            "contributing_factors": factors,
            "zone_id": zone_id,
            "history_length": len(history),
        }

        # Store prediction
        if zone_id not in self._zone_predictions:
            self._zone_predictions[zone_id] = []
        self._zone_predictions[zone_id].append(result)
        if len(self._zone_predictions[zone_id]) > 100:
            self._zone_predictions[zone_id] = self._zone_predictions[zone_id][-100:]

        return result

    def _compute_factors(self, metrics: dict) -> list[dict]:
        """Compute contributing factor breakdown."""
        factors = []

        density = metrics.get("density", 0)
        critical_d = metrics.get("critical_density", 2.0)
        density_ratio = density / max(critical_d, 0.01)

        # Density (0-30)
        if density_ratio > 1.0:
            d_score = 30
        elif density_ratio > 0.6:
            d_score = 22
        elif density_ratio > 0.4:
            d_score = 12
        else:
            d_score = density_ratio * 10
        factors.append({"factor": "Crowd Density", "contribution": round(d_score, 1), "value": f"{density:.2f} p/m²"})

        # Speed (0-20)
        speed = metrics.get("avg_velocity", 1.0)
        if speed < 0.3:
            s_score = 20
        elif speed < 0.6:
            s_score = 15
        elif speed < 0.9:
            s_score = 8
        else:
            s_score = 2
        factors.append({"factor": "Speed Reduction", "contribution": round(s_score, 1), "value": f"{speed:.2f} m/s"})

        # Flow conflict (0-15)
        fc = metrics.get("flow_conflict", 0)
        fc_score = fc * 15
        factors.append({"factor": "Flow Conflict", "contribution": round(fc_score, 1), "value": f"{fc:.2f}"})

        # Bottleneck (0-15)
        bn = metrics.get("bottleneck_score", 0)
        bn_score = bn * 15
        factors.append({"factor": "Bottleneck", "contribution": round(bn_score, 1), "value": f"{bn:.2f}"})

        # Anomaly (0-10)
        an = metrics.get("anomaly_score", 0)
        an_score = an * 10
        factors.append({"factor": "Behavior Anomaly", "contribution": round(an_score, 1), "value": f"{an:.2f}"})

        # Growth (0-10)
        growth = metrics.get("density_growth_rate", 0)
        if growth > 0.5:
            g_score = 10
        elif growth > 0.3:
            g_score = 7
        elif growth > 0.1:
            g_score = 4
        else:
            g_score = max(0, growth * 10)
        factors.append({"factor": "Density Growth", "contribution": round(g_score, 1), "value": f"+{growth*100:.1f}%"})

        return factors

    def get_zone_history(self, zone_id: str) -> list[dict]:
        return self._zone_history.get(zone_id, [])

    def get_zone_predictions(self, zone_id: str) -> list[dict]:
        return self._zone_predictions.get(zone_id, [])

    def get_all_predictions(self) -> dict[str, dict]:
        """Get latest prediction for all zones."""
        result = {}
        for zid, preds in self._zone_predictions.items():
            if preds:
                result[zid] = preds[-1]
        return result

    def reset(self):
        """Reset all state."""
        self._zone_history.clear()
        self._zone_predictions.clear()
        self._prev_risk.clear()
        self._critical_count.clear()
        self._high_count.clear()


# ── Singleton for API integration ──
ml_risk_engine = MLRiskEngine()
