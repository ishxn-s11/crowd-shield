"""XGBoost training pipeline for crowd risk prediction.

Trains a model to predict risk scores from crowd features.
Includes:
- Synthetic data generation
- Feature engineering
- Train/test split
- Hyperparameter tuning
- Model evaluation
- Model saving/loading
"""
import json
import os
import time
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

try:
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from .feature_engineering import CrowdFeatureExtractor, FeatureConfig, RiskLabelGenerator
from .synthetic_data import generate_training_dataset, SCENARIO_PRESETS

import structlog

logger = structlog.get_logger()


@dataclass
class TrainingConfig:
    """Training configuration."""
    model_type: str = "xgboost"  # xgboost or random_forest
    n_estimators: int = 200
    max_depth: int = 6
    learning_rate: float = 0.1
    subsample: float = 0.8
    colsample_bytree: float = 0.8
    min_child_weight: int = 3
    gamma: float = 0.1
    reg_alpha: float = 0.1
    reg_lambda: float = 1.0
    test_size: float = 0.2
    random_state: int = 42
    num_samples_per_scenario: int = 50
    total_frames: int = 120
    early_stopping_rounds: int = 20


@dataclass
class TrainingMetrics:
    """Metrics from model training."""
    train_mae: float = 0.0
    train_rmse: float = 0.0
    train_r2: float = 0.0
    test_mae: float = 0.0
    test_rmse: float = 0.0
    test_r2: float = 0.0
    feature_importance: dict = field(default_factory=dict)
    training_time_s: float = 0.0
    num_features: int = 0
    num_train_samples: int = 0
    num_test_samples: int = 0
    best_iteration: int = 0


class RiskPredictor:
    """XGBoost-based risk prediction model.

    Predicts risk scores (0-100) from crowd feature vectors.
    """

    def __init__(self, config: TrainingConfig | None = None):
        self.config = config or TrainingConfig()
        self._model = None
        self._feature_extractor = CrowdFeatureExtractor()
        self._label_generator = RiskLabelGenerator()
        self._metrics: Optional[TrainingMetrics] = None
        self._feature_names = CrowdFeatureExtractor.FEATURE_NAMES

    @property
    def is_trained(self) -> bool:
        return self._model is not None

    @property
    def metrics(self) -> Optional[TrainingMetrics]:
        return self._metrics

    def train(
        self,
        features: Optional[list[np.ndarray]] = None,
        labels: Optional[list[float]] = None,
        save_path: Optional[str] = None,
    ) -> TrainingMetrics:
        """Train the risk prediction model.

        If features/labels are not provided, generates synthetic training data.
        """
        if not HAS_XGBOOST:
            raise RuntimeError("xgboost not installed. Install with: pip install xgboost")
        if not HAS_SKLEARN:
            raise RuntimeError("scikit-learn not installed. Install with: pip install scikit-learn")

        t_start = time.time()

        # Generate synthetic data if not provided
        if features is None or labels is None:
            logger.info("generating_synthetic_data", samples_per_scenario=self.config.num_samples_per_scenario)
            features, labels = generate_training_dataset(
                num_samples_per_scenario=self.config.num_samples_per_scenario,
                total_frames=self.config.total_frames,
                seed=self.config.random_state,
            )

        X = np.array(features)
        y = np.array(labels)

        logger.info("training_data_ready", X_shape=X.shape, y_shape=y.shape)

        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.config.test_size, random_state=self.config.random_state
        )

        # Create DMatrix for XGBoost
        dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=self._feature_names)
        dtest = xgb.DMatrix(X_test, label=y_test, feature_names=self._feature_names)

        # XGBoost parameters
        params = {
            "objective": "reg:squarederror",
            "eval_metric": "mae",
            "max_depth": self.config.max_depth,
            "learning_rate": self.config.learning_rate,
            "subsample": self.config.subsample,
            "colsample_bytree": self.config.colsample_bytree,
            "min_child_weight": self.config.min_child_weight,
            "gamma": self.config.gamma,
            "reg_alpha": self.config.reg_alpha,
            "reg_lambda": self.config.reg_lambda,
            "seed": self.config.random_state,
            "verbosity": 0,
        }

        # Train with early stopping
        evals = [(dtrain, "train"), (dtest, "test")]
        self._model = xgb.train(
            params,
            dtrain,
            num_boost_round=self.config.n_estimators,
            evals=evals,
            early_stopping_rounds=self.config.early_stopping_rounds,
            verbose_eval=False,
        )

        training_time = time.time() - t_start

        # Evaluate
        y_train_pred = self._model.predict(dtrain)
        y_test_pred = self._model.predict(dtest)

        # Clip predictions to [0, 100]
        y_train_pred = np.clip(y_train_pred, 0, 100)
        y_test_pred = np.clip(y_test_pred, 0, 100)

        # Feature importance
        importance = self._model.get_score(importance_type="gain")
        total_gain = sum(importance.values()) or 1
        feature_importance = {
            name: round(importance.get(f"f{i}", 0) / total_gain, 4)
            for i, name in enumerate(self._feature_names)
        }
        # Sort by importance
        feature_importance = dict(sorted(feature_importance.items(), key=lambda x: -x[1]))

        self._metrics = TrainingMetrics(
            train_mae=round(float(mean_absolute_error(y_train, y_train_pred)), 3),
            train_rmse=round(float(np.sqrt(mean_squared_error(y_train, y_train_pred))), 3),
            train_r2=round(float(r2_score(y_train, y_train_pred)), 4),
            test_mae=round(float(mean_absolute_error(y_test, y_test_pred)), 3),
            test_rmse=round(float(np.sqrt(mean_squared_error(y_test, y_test_pred))), 3),
            test_r2=round(float(r2_score(y_test, y_test_pred)), 4),
            feature_importance=feature_importance,
            training_time_s=round(training_time, 2),
            num_features=X.shape[1],
            num_train_samples=len(X_train),
            num_test_samples=len(X_test),
            best_iteration=self._model.best_iteration if hasattr(self._model, 'best_iteration') else self.config.n_estimators,
        )

        logger.info(
            "training_complete",
            test_mae=self._metrics.test_mae,
            test_rmse=self._metrics.test_rmse,
            test_r2=self._metrics.test_r2,
            time_s=self._metrics.training_time_s,
        )

        # Save model
        if save_path:
            self.save(save_path)

        return self._metrics

    def predict(self, features: np.ndarray) -> float:
        """Predict risk score from a single feature vector."""
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call train() first.")

        if features.ndim == 1:
            features = features.reshape(1, -1)

        dmatrix = xgb.DMatrix(features, feature_names=self._feature_names)
        score = self._model.predict(dmatrix)[0]
        return float(np.clip(score, 0, 100))

    def predict_from_history(
        self,
        history: list[dict],
        zone_config: dict | None = None,
    ) -> Optional[dict]:
        """Predict risk from a time-series of crowd metrics.

        Returns:
            dict with 'risk_score', 'confidence', 'features_used'
        """
        features = self._feature_extractor.extract(history, zone_config)
        if features is None:
            return None

        score = self.predict(features)

        # Estimate confidence based on consistency of recent predictions
        confidence = min(0.95, 0.6 + len(history) * 0.02)

        # Risk level
        if score >= 75:
            level = "CRITICAL"
        elif score >= 50:
            level = "HIGH"
        elif score >= 25:
            level = "MODERATE"
        else:
            level = "LOW"

        return {
            "risk_score": round(score, 1),
            "risk_level": level,
            "confidence": round(confidence, 2),
            "model_version": "xgboost-v1",
            "features_used": len(self._feature_names),
        }

    def predict_batch(
        self,
        zone_histories: dict[str, list[dict]],
        zone_configs: dict[str, dict] | None = None,
    ) -> dict[str, dict]:
        """Predict risk for multiple zones."""
        results = {}
        for zid, history in zone_histories.items():
            config = zone_configs.get(zid) if zone_configs else None
            pred = self.predict_from_history(history, config)
            if pred:
                results[zid] = pred
        return results

    def save(self, path: str):
        """Save model to file."""
        if not self.is_trained:
            return

        os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
        self._model.save_model(path)

        # Save metadata
        meta_path = path + ".meta.json"
        meta = {
            "feature_names": self._feature_names,
            "config": {
                "n_estimators": self.config.n_estimators,
                "max_depth": self.config.max_depth,
                "learning_rate": self.config.learning_rate,
            },
            "metrics": {
                "test_mae": self._metrics.test_mae if self._metrics else None,
                "test_r2": self._metrics.test_r2 if self._metrics else None,
            },
        }
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

        logger.info("model_saved", path=path)

    def load(self, path: str):
        """Load model from file."""
        if not HAS_XGBOOST:
            raise RuntimeError("xgboost not installed")

        self._model = xgb.Booster()
        self._model.load_model(path)
        logger.info("model_loaded", path=path)

    def get_feature_importance(self, top_n: int = 10) -> list[dict]:
        """Get top feature importances."""
        if not self._metrics or not self._metrics.feature_importance:
            return []

        return [
            {"feature": name, "importance": imp}
            for name, imp in list(self._metrics.feature_importance.items())[:top_n]
        ]


def train_and_save(
    save_path: str = "ml/models/risk_model.json",
    config: TrainingConfig | None = None,
) -> TrainingMetrics:
    """Convenience function to train and save a model."""
    predictor = RiskPredictor(config)
    metrics = predictor.train(save_path=save_path)
    return metrics


if __name__ == "__main__":
    import sys

    print("=" * 50)
    print("CrowdShield ML Risk Model Training")
    print("=" * 50)

    config = TrainingConfig(
        num_samples_per_scenario=30,
        total_frames=120,
        n_estimators=150,
        max_depth=6,
    )

    predictor = RiskPredictor(config)
    metrics = predictor.train(save_path="ml/models/risk_model.json")

    print(f"\nTraining Results:")
    print(f"  Train MAE: {metrics.train_mae:.3f}")
    print(f"  Test MAE:  {metrics.test_mae:.3f}")
    print(f"  Test R²:   {metrics.test_r2:.4f}")
    print(f"  Time:      {metrics.training_time_s:.1f}s")
    print(f"  Features:  {metrics.num_features}")
    print(f"  Samples:   {metrics.num_train_samples} train, {metrics.num_test_samples} test")

    print(f"\nTop 10 Features:")
    for feat in predictor.get_feature_importance(10):
        print(f"  {feat['feature']:30s} {feat['importance']:.4f}")

    print(f"\nModel saved to ml/models/risk_model.json")
