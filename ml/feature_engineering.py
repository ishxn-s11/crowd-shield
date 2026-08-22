"""Feature engineering for crowd risk prediction.

Extracts temporal and spatial features from time-series crowd metrics
for training and inference with ML models.

Features extracted:
- Current snapshot features (density, speed, flow)
- Temporal derivatives (rates of change)
- Rolling statistics (mean, std, min, max over windows)
- Interaction features (cross-metric relationships)
- Zone topology features (neighbor congestion, route saturation)
"""
import numpy as np
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class FeatureConfig:
    """Configuration for feature extraction."""
    temporal_windows: list[int] = field(default_factory=lambda: [5, 15, 30])
    min_history: int = 5
    include_interactions: bool = True
    include_topology: bool = False


class CrowdFeatureExtractor:
    """Extracts ML-ready features from crowd time-series data.

    Input: sequence of crowd metrics snapshots (dicts)
    Output: flat feature vector for ML model
    """

    FEATURE_NAMES = [
        # Snapshot features (t=0)
        "density_t0",
        "person_count_t0",
        "avg_velocity_t0",
        "velocity_variance_t0",
        "flow_magnitude_t0",
        "flow_consistency_t0",
        "flow_conflict_t0",
        "bottleneck_score_t0",
        "anomaly_score_t0",
        "entry_rate_t0",
        "exit_rate_t0",
        "density_growth_rate_t0",

        # Temporal derivatives
        "density_delta_1",
        "density_delta_5",
        "velocity_delta_1",
        "velocity_delta_5",
        "bottleneck_delta_1",
        "anomaly_delta_1",

        # Rolling means (windows: 5, 15, 30)
        "density_mean_5",
        "density_mean_15",
        "density_mean_30",
        "velocity_mean_5",
        "velocity_mean_15",
        "velocity_mean_30",
        "flow_conflict_mean_5",
        "flow_conflict_mean_15",
        "flow_conflict_mean_30",

        # Rolling stds
        "density_std_5",
        "density_std_15",
        "velocity_std_5",
        "velocity_std_15",

        # Rolling min/max
        "density_max_5",
        "density_max_15",
        "density_min_5",
        "velocity_min_5",

        # Acceleration (2nd derivative)
        "density_accel_3",
        "velocity_accel_3",

        # Interaction features
        "density_x_velocity",
        "density_x_flow_conflict",
        "bottleneck_x_density",
        "anomaly_x_velocity_var",

        # Zone capacity
        "capacity_ratio_t0",
        "capacity_trend_5",
    ]

    def __init__(self, config: FeatureConfig | None = None):
        self.config = config or FeatureConfig()

    @property
    def num_features(self) -> int:
        return len(self.FEATURE_NAMES)

    def extract(
        self,
        history: list[dict],
        zone_config: dict | None = None,
    ) -> Optional[np.ndarray]:
        """Extract features from a time-series of crowd metrics.

        Args:
            history: list of metric snapshots, oldest first.
                Each dict should have keys matching the metric fields.
            zone_config: optional dict with 'area_sqm', 'max_capacity',
                'critical_density' for capacity features.

        Returns:
            numpy array of shape (num_features,) or None if insufficient data.
        """
        if len(history) < self.config.min_history:
            return None

        features = {}

        # Extract arrays from history
        densities = np.array([h.get("density", 0) for h in history])
        velocities = np.array([h.get("avg_velocity", 0) for h in history])
        flow_mags = np.array([h.get("flow_magnitude", 0) for h in history])
        flow_consist = np.array([h.get("flow_consistency", 0) for h in history])
        flow_conflicts = np.array([h.get("flow_conflict", 0) for h in history])
        bottlenecks = np.array([h.get("bottleneck_score", 0) for h in history])
        anomalies = np.array([h.get("anomaly_score", 0) for h in history])
        entry_rates = np.array([h.get("entry_rate", 0) for h in history])
        exit_rates = np.array([h.get("exit_rate", 0) for h in history])
        person_counts = np.array([h.get("person_count", 0) for h in history])
        velocity_variances = np.array([h.get("velocity_variance", 0) for h in history])
        density_growth = np.array([h.get("density_growth_rate", 0) for h in history])

        n = len(history)
        t0 = n - 1  # latest snapshot index

        # ── Snapshot features (t=0) ──
        features["density_t0"] = densities[t0]
        features["person_count_t0"] = person_counts[t0]
        features["avg_velocity_t0"] = velocities[t0]
        features["velocity_variance_t0"] = velocity_variances[t0]
        features["flow_magnitude_t0"] = flow_mags[t0]
        features["flow_consistency_t0"] = flow_consist[t0]
        features["flow_conflict_t0"] = flow_conflicts[t0]
        features["bottleneck_score_t0"] = bottlenecks[t0]
        features["anomaly_score_t0"] = anomalies[t0]
        features["entry_rate_t0"] = entry_rates[t0]
        features["exit_rate_t0"] = exit_rates[t0]
        features["density_growth_rate_t0"] = density_growth[t0]

        # ── Temporal derivatives ──
        features["density_delta_1"] = densities[t0] - densities[max(t0 - 1, 0)]
        features["density_delta_5"] = densities[t0] - densities[max(t0 - 5, 0)]
        features["velocity_delta_1"] = velocities[t0] - velocities[max(t0 - 1, 0)]
        features["velocity_delta_5"] = velocities[t0] - velocities[max(t0 - 5, 0)]
        features["bottleneck_delta_1"] = bottlenecks[t0] - bottlenecks[max(t0 - 1, 0)]
        features["anomaly_delta_1"] = anomalies[t0] - anomalies[max(t0 - 1, 0)]

        # ── Rolling statistics ──
        for w in self.config.temporal_windows:
            start = max(0, t0 - w + 1)
            window_d = densities[start:t0 + 1]
            window_v = velocities[start:t0 + 1]
            window_fc = flow_conflicts[start:t0 + 1]

            features[f"density_mean_{w}"] = float(np.mean(window_d))
            features[f"velocity_mean_{w}"] = float(np.mean(window_v))
            features[f"flow_conflict_mean_{w}"] = float(np.mean(window_fc))

            if len(window_d) >= 3:
                features[f"density_std_{w}"] = float(np.std(window_d))
                features[f"velocity_std_{w}"] = float(np.std(window_v))
            else:
                features[f"density_std_{w}"] = 0.0
                features[f"velocity_std_{w}"] = 0.0

            features[f"density_max_{w}"] = float(np.max(window_d))
            features[f"density_min_{w}"] = float(np.min(window_d))
            features[f"velocity_min_{w}"] = float(np.min(window_v))

        # ── Acceleration (2nd derivative) ──
        if t0 >= 3:
            d1 = densities[t0] - densities[t0 - 1]
            d2 = densities[t0 - 1] - densities[t0 - 2]
            features["density_accel_3"] = d1 - d2

            v1 = velocities[t0] - velocities[t0 - 1]
            v2 = velocities[t0 - 1] - velocities[t0 - 2]
            features["velocity_accel_3"] = v1 - v2
        else:
            features["density_accel_3"] = 0.0
            features["velocity_accel_3"] = 0.0

        # ── Interaction features ──
        if self.config.include_interactions:
            features["density_x_velocity"] = densities[t0] * velocities[t0]
            features["density_x_flow_conflict"] = densities[t0] * flow_conflicts[t0]
            features["bottleneck_x_density"] = bottlenecks[t0] * densities[t0]
            features["anomaly_x_velocity_var"] = anomalies[t0] * velocity_variances[t0]
        else:
            features["density_x_velocity"] = 0.0
            features["density_x_flow_conflict"] = 0.0
            features["bottleneck_x_density"] = 0.0
            features["anomaly_x_velocity_var"] = 0.0

        # ── Zone capacity features ──
        if zone_config:
            area = zone_config.get("area_sqm", 1000)
            max_cap = zone_config.get("max_capacity", 1000)
            crit_d = zone_config.get("critical_density", 2.0)

            current_density = densities[t0]
            features["capacity_ratio_t0"] = current_density / max(crit_d, 0.01)

            # Capacity trend
            recent_counts = person_counts[max(t0 - 5, 0):t0 + 1]
            if len(recent_counts) >= 2:
                trend = (recent_counts[-1] - recent_counts[0]) / max(max_cap, 1)
                features["capacity_trend_5"] = trend
            else:
                features["capacity_trend_5"] = 0.0
        else:
            features["capacity_ratio_t0"] = 0.0
            features["capacity_trend_5"] = 0.0

        # Build feature vector in consistent order
        vec = np.array([features.get(name, 0.0) for name in self.FEATURE_NAMES], dtype=np.float32)

        # Replace NaN/inf
        vec = np.nan_to_num(vec, nan=0.0, posinf=10.0, neginf=-10.0)

        return vec

    def extract_batch(
        self,
        zone_histories: dict[str, list[dict]],
        zone_configs: dict[str, dict] | None = None,
    ) -> tuple[np.ndarray, list[str]]:
        """Extract features for multiple zones.

        Returns:
            features: array of shape (num_zones, num_features)
            zone_ids: list of zone IDs
        """
        features_list = []
        zone_ids = []

        for zid, history in zone_histories.items():
            config = zone_configs.get(zid) if zone_configs else None
            feat = self.extract(history, config)
            if feat is not None:
                features_list.append(feat)
                zone_ids.append(zid)

        if not features_list:
            return np.empty((0, self.num_features)), []

        return np.vstack(features_list), zone_ids


class RiskLabelGenerator:
    """Generates risk labels from crowd metrics for training.

    Creates ground truth labels based on configurable rules.
    """

    def __init__(
        self,
        critical_density: float = 2.0,
        high_density: float = 1.2,
        moderate_density: float = 0.8,
        low_speed_threshold: float = 0.5,
        high_flow_conflict: float = 0.5,
        high_bottleneck: float = 0.7,
    ):
        self.critical_density = critical_density
        self.high_density = high_density
        self.moderate_density = moderate_density
        self.low_speed_threshold = low_speed_threshold
        self.high_flow_conflict = high_flow_conflict
        self.high_bottleneck = high_bottleneck

    def generate_label(self, metrics: dict) -> float:
        """Generate a risk score (0-100) from crowd metrics.

        This is the rule-based baseline. The ML model will learn to
        approximate and improve upon this.
        """
        score = 0.0

        # Density contribution (0-30)
        density = metrics.get("density", 0)
        if density > self.critical_density:
            score += 30
        elif density > self.high_density:
            score += 22
        elif density > self.moderate_density:
            score += 12
        else:
            score += (density / max(self.moderate_density, 0.01)) * 10

        # Speed contribution (0-20)
        speed = metrics.get("avg_velocity", 1.0)
        if speed < 0.3:
            score += 20
        elif speed < 0.5:
            score += 15
        elif speed < 0.8:
            score += 8
        else:
            score += 2

        # Flow conflict (0-15)
        conflict = metrics.get("flow_conflict", 0)
        score += conflict * 15

        # Bottleneck (0-15)
        bottleneck = metrics.get("bottleneck_score", 0)
        score += bottleneck * 15

        # Anomaly (0-10)
        anomaly = metrics.get("anomaly_score", 0)
        score += anomaly * 10

        # Density growth (0-10)
        growth = metrics.get("density_growth_rate", 0)
        if growth > 0.5:
            score += 10
        elif growth > 0.3:
            score += 7
        elif growth > 0.1:
            score += 4
        else:
            score += max(0, growth * 10)

        return min(100.0, score)

    def generate_labels(self, history: list[dict]) -> list[float]:
        """Generate risk labels for a time series."""
        return [self.generate_label(h) for h in history]
