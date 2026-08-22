"""Synthetic training data generator for crowd risk models.

Generates realistic crowd time-series data with labeled risk events.
Uses physics-inspired crowd dynamics simulation.
"""
import numpy as np
from typing import Optional
from dataclasses import dataclass


@dataclass
class ScenarioConfig:
    """Configuration for a synthetic scenario."""
    name: str
    base_density: float = 0.5
    density_peak: float = 2.5
    base_speed: float = 1.2
    min_speed: float = 0.2
    base_conflict: float = 0.1
    peak_conflict: float = 0.8
    base_bottleneck: float = 0.1
    peak_bottleneck: float = 0.9
    rise_time: int = 30  # frames to peak
    plateau_time: int = 10
    fall_time: int = 30
    noise_level: float = 0.05
    area_sqm: float = 1000.0


SCENARIO_PRESETS = {
    "normal_flow": ScenarioConfig(
        name="normal_flow", base_density=0.4, density_peak=0.6,
        base_speed=1.2, min_speed=0.9, rise_time=20, plateau_time=40, fall_time=20,
    ),
    "rising_density": ScenarioConfig(
        name="rising_density", base_density=0.3, density_peak=1.5,
        base_speed=1.2, min_speed=0.5, rise_time=40, plateau_time=20, fall_time=40,
    ),
    "crowd_surge": ScenarioConfig(
        name="crowd_surge", base_density=0.5, density_peak=2.8,
        base_speed=1.2, min_speed=0.15, base_conflict=0.1, peak_conflict=0.85,
        base_bottleneck=0.1, peak_bottleneck=0.95,
        rise_time=20, plateau_time=10, fall_time=40,
    ),
    "gate_block": ScenarioConfig(
        name="gate_block", base_density=0.6, density_peak=2.0,
        base_speed=1.0, min_speed=0.3, base_conflict=0.2, peak_conflict=0.7,
        rise_time=25, plateau_time=15, fall_time=35,
    ),
    "reverse_flow": ScenarioConfig(
        name="reverse_flow", base_density=0.8, density_peak=2.2,
        base_speed=1.0, min_speed=0.2, base_conflict=0.3, peak_conflict=0.9,
        rise_time=15, plateau_time=10, fall_time=30,
    ),
    "bottleneck_formation": ScenarioConfig(
        name="bottleneck_formation", base_density=0.5, density_peak=1.8,
        base_speed=1.2, min_speed=0.25, base_conflict=0.1, peak_conflict=0.6,
        base_bottleneck=0.15, peak_bottleneck=0.95,
        rise_time=35, plateau_time=20, fall_time=30,
    ),
    "recovery": ScenarioConfig(
        name="recovery", base_density=2.0, density_peak=2.0,
        base_speed=0.3, min_speed=0.3, base_conflict=0.6, peak_conflict=0.6,
        rise_time=5, plateau_time=5, fall_time=50,
        noise_level=0.03,
    ),
}


def _envelope(t: int, rise: int, plateau: int, fall: int) -> float:
    """Generate a smooth envelope curve: rise -> plateau -> fall."""
    total = rise + plateau + fall
    if t < 0:
        return 0.0
    if t < rise:
        # Smooth rise (cosine)
        return 0.5 * (1 - np.cos(np.pi * t / rise))
    if t < rise + plateau:
        return 1.0
    if t < total:
        # Smooth fall (cosine)
        return 0.5 * (1 + np.cos(np.pi * (t - rise - plateau) / fall))
    return 0.0


def generate_scenario_sequence(
    config: ScenarioConfig,
    total_frames: int = 120,
    noise_level: Optional[float] = None,
) -> list[dict]:
    """Generate a time-series of crowd metrics for one scenario.

    Args:
        config: Scenario configuration
        total_frames: Total frames to generate
        noise_level: Override noise level

    Returns:
        List of metric dicts, one per frame
    """
    noise = noise_level if noise_level is not None else config.noise_level
    history = []

    for t in range(total_frames):
        env = _envelope(t, config.rise_time, config.plateau_time, config.fall_time)

        # Density: rises, plateaus, falls
        density = config.base_density + env * (config.density_peak - config.base_density)
        density += np.random.normal(0, noise * 0.5)
        density = max(0, density)

        # Person count from density and area
        person_count = int(density * config.area_sqm)
        person_count = max(0, person_count)

        # Speed: inversely correlated with density
        density_ratio = min(density / config.density_peak, 1.0) if config.density_peak > 0 else 0
        speed_range = config.base_speed - config.min_speed
        speed = config.base_speed - density_ratio * speed_range
        speed += np.random.normal(0, noise * 0.3)
        speed = max(0.05, speed)

        # Velocity variance: higher when crowded
        velocity_variance = 0.1 + density_ratio * 0.8
        velocity_variance += np.random.normal(0, noise * 0.2)
        velocity_variance = max(0.01, velocity_variance)

        # Flow magnitude: correlated with speed
        flow_magnitude = speed * 0.8 + np.random.normal(0, noise * 0.2)
        flow_magnitude = max(0, flow_magnitude)

        # Flow consistency: decreases with density
        flow_consistency = max(0, 0.9 - density_ratio * 0.7 + np.random.normal(0, noise * 0.1))

        # Flow conflict: increases during surges
        flow_conflict = config.base_conflict + env * (config.peak_conflict - config.base_conflict)
        flow_conflict += np.random.normal(0, noise * 0.3)
        flow_conflict = max(0, min(1, flow_conflict))

        # Bottleneck: high density + low speed
        bottleneck = config.base_bottleneck + env * (config.peak_bottleneck - config.base_bottleneck)
        bottleneck += np.random.normal(0, noise * 0.2)
        bottleneck = max(0, min(1, bottleneck))

        # Anomaly score: triggered by rapid changes
        anomaly = 0.0
        if len(history) >= 3:
            d_rate = (density - history[-1]["density"]) / max(history[-1]["density"], 0.01)
            if d_rate > 0.3:
                anomaly += 0.3
            if speed < 0.4 and density > 1.0:
                anomaly += 0.3
            if flow_conflict > 0.6:
                anomaly += 0.25
            if bottleneck > 0.7:
                anomaly += 0.15
        anomaly = min(1.0, anomaly + np.random.normal(0, noise * 0.1))
        anomaly = max(0, anomaly)

        # Entry/exit rates
        entry_rate = max(0, 5 + env * 20 + np.random.normal(0, noise * 2))
        exit_rate = max(0, 4 + (1 - env) * 15 + np.random.normal(0, noise * 2))

        # Density growth rate
        if history:
            prev_d = history[-1]["density"]
            density_growth_rate = (density - prev_d) / max(prev_d, 0.01)
        else:
            density_growth_rate = 0.0

        history.append({
            "density": round(density, 4),
            "person_count": person_count,
            "avg_velocity": round(speed, 4),
            "velocity_variance": round(velocity_variance, 4),
            "flow_magnitude": round(flow_magnitude, 4),
            "flow_consistency": round(flow_consistency, 4),
            "flow_conflict": round(flow_conflict, 4),
            "bottleneck_score": round(bottleneck, 4),
            "anomaly_score": round(anomaly, 4),
            "entry_rate": round(entry_rate, 2),
            "exit_rate": round(exit_rate, 2),
            "density_growth_rate": round(density_growth_rate, 4),
            "area_sqm": config.area_sqm,
            "max_capacity": int(config.area_sqm * config.density_peak * 1.2),
            "critical_density": config.density_peak * 0.8,
        })

    return history


def generate_training_dataset(
    num_samples_per_scenario: int = 50,
    total_frames: int = 120,
    seed: int = 42,
) -> tuple[list[dict], list[float]]:
    """Generate a full training dataset.

    Returns:
        features: list of feature dicts
        labels: list of risk scores (0-100)
    """
    from .feature_engineering import CrowdFeatureExtractor, RiskLabelGenerator

    np.random.seed(seed)
    extractor = CrowdFeatureExtractor()
    label_gen = RiskLabelGenerator()

    all_features = []
    all_labels = []

    for scenario_name, config in SCENARIO_PRESETS.items():
        for _ in range(num_samples_per_scenario):
            # Add random variation to config
            varied_config = ScenarioConfig(
                name=config.name,
                base_density=config.base_density * np.random.uniform(0.8, 1.2),
                density_peak=config.density_peak * np.random.uniform(0.8, 1.2),
                base_speed=config.base_speed * np.random.uniform(0.9, 1.1),
                min_speed=config.min_speed * np.random.uniform(0.8, 1.2),
                base_conflict=config.base_conflict,
                peak_conflict=config.peak_conflict * np.random.uniform(0.8, 1.2),
                base_bottleneck=config.base_bottleneck,
                peak_bottleneck=config.peak_bottleneck * np.random.uniform(0.8, 1.2),
                rise_time=config.rise_time + np.random.randint(-5, 6),
                plateau_time=config.plateau_time + np.random.randint(-3, 4),
                fall_time=config.fall_time + np.random.randint(-5, 6),
                noise_level=config.noise_level,
                area_sqm=config.area_sqm * np.random.uniform(0.7, 1.3),
            )

            # Generate time series
            history = generate_scenario_sequence(varied_config, total_frames)

            # Extract features for each window
            window_size = 15
            for i in range(window_size, len(history)):
                window = history[max(0, i - window_size):i + 1]
                feat = extractor.extract(window, {
                    "area_sqm": varied_config.area_sqm,
                    "max_capacity": int(varied_config.area_sqm * varied_config.density_peak * 1.2),
                    "critical_density": varied_config.density_peak * 0.8,
                })
                if feat is not None:
                    all_features.append(feat)
                    # Label is the risk at this time step
                    label = label_gen.generate_label(history[i])
                    all_labels.append(label)

    return all_features, all_labels


def generate_time_series_for_scenario(
    scenario: str = "crowd_surge",
    total_frames: int = 120,
    num_zones: int = 1,
) -> dict[str, list[dict]]:
    """Generate time series data for a scenario, organized by zone.

    Used for training data generation and simulation replay.
    """
    config = SCENARIO_PRESETS.get(scenario, SCENARIO_PRESETS["crowd_surge"])

    zone_histories = {}
    for z in range(num_zones):
        zone_config = ScenarioConfig(
            name=f"zone_{z}",
            base_density=config.base_density * np.random.uniform(0.7, 1.3),
            density_peak=config.density_peak * np.random.uniform(0.7, 1.3),
            base_speed=config.base_speed,
            min_speed=config.min_speed,
            base_conflict=config.base_conflict,
            peak_conflict=config.peak_conflict,
            base_bottleneck=config.base_bottleneck,
            peak_bottleneck=config.peak_bottleneck,
            rise_time=config.rise_time + z * 3,
            plateau_time=config.plateau_time,
            fall_time=config.fall_time,
            noise_level=config.noise_level,
            area_sqm=config.area_sqm * np.random.uniform(0.5, 2.0),
        )
        zone_histories[f"Z{z + 1}"] = generate_scenario_sequence(zone_config, total_frames)

    return zone_histories
