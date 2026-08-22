"""Crowd density estimation and flow analysis.

Computes per-zone metrics from tracked person data:
- Density (persons/m²)
- Velocity (mean, variance)
- Flow direction and magnitude
- Flow consistency and conflict
- Bottleneck score
- Anomaly score
- Entry/exit rates
"""
import math
import time
from collections import defaultdict
from dataclasses import dataclass, field

import numpy as np

from .tracker import TrackState

import structlog

logger = structlog.get_logger()


@dataclass
class ZoneMetrics:
    """Computed metrics for a single zone."""
    zone_id: str
    timestamp: float = 0.0
    person_count: int = 0
    density: float = 0.0
    density_growth_rate: float = 0.0
    avg_velocity: float = 0.0
    velocity_variance: float = 0.0
    flow_direction: float = 0.0  # degrees (0=right, 90=down)
    flow_magnitude: float = 0.0
    flow_consistency: float = 0.0
    flow_conflict: float = 0.0
    bottleneck_score: float = 0.0
    anomaly_score: float = 0.0
    entry_rate: float = 0.0
    exit_rate: float = 0.0
    avg_confidence: float = 0.0
    track_ids: list[int] = field(default_factory=list)


@dataclass
class ZoneConfig:
    """Configuration for a monitored zone."""
    zone_id: str
    name: str
    area_sqm: float
    max_capacity: int = 1000
    critical_density: float = 2.0  # persons/m²
    high_density: float = 1.2
    moderate_density: float = 0.8
    polygon: list[tuple[float, float]] = field(default_factory=list)  # optional


class CrowdDensityEstimator:
    """Estimates crowd density and flow metrics from tracked persons.

    The estimator:
    1. Assigns each tracked person to a zone
    2. Computes zone-level density and flow metrics
    3. Detects bottlenecks and anomalies
    4. Tracks entry/exit rates
    """

    def __init__(self, zones: list[ZoneConfig] | None = None):
        self.zones: dict[str, ZoneConfig] = {}
        self._previous_counts: dict[str, int] = {}
        self._previous_track_positions: dict[str, dict[int, tuple[float, float]]] = {}
        self._velocity_history: dict[str, list[float]] = defaultdict(list)
        self._density_history: dict[str, list[float]] = defaultdict(list)
        self._anomaly_history: dict[str, list[float]] = defaultdict(list)
        self._max_history = 60  # frames

        if zones:
            for z in zones:
                self.zones[z.zone_id] = z

    def add_zone(self, zone: ZoneConfig):
        self.zones[zone.zone_id] = zone

    def _point_in_zone(self, point: tuple[float, float], zone: ZoneConfig) -> bool:
        """Check if a point is inside a zone polygon using ray casting."""
        if not zone.polygon:
            return True  # If no polygon, all points are in the zone

        x, y = point
        n = len(zone.polygon)
        inside = False

        j = n - 1
        for i in range(n):
            xi, yi = zone.polygon[i]
            xj, yj = zone.polygon[j]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i

        return inside

    def assign_to_zones(self, tracks: dict[int, TrackState]) -> dict[str, list[TrackState]]:
        """Assign tracked persons to zones based on position."""
        zone_tracks: dict[str, list[TrackState]] = {zid: [] for zid in self.zones}

        for tid, track in tracks.items():
            center = track.center
            assigned = False

            for zid, zone in self.zones.items():
                if self._point_in_zone(center, zone):
                    zone_tracks[zid].append(track)
                    track.zone_id = zid
                    assigned = True
                    break

        return zone_tracks

    def compute_metrics(
        self,
        tracks: dict[int, TrackState],
        frame_shape: tuple[int, int, int] = (1080, 1920, 3),
    ) -> dict[str, ZoneMetrics]:
        """Compute crowd metrics for all zones.

        Args:
            tracks: dict of track_id -> TrackState
            frame_shape: (height, width, channels) of the video frame

        Returns:
            dict of zone_id -> ZoneMetrics
        """
        timestamp = time.time()
        zone_tracks = self.assign_to_zones(tracks)
        results = {}

        for zid, zone_cfg in self.zones.items():
            zt = zone_tracks.get(zid, [])
            metrics = ZoneMetrics(zone_id=zid, timestamp=timestamp)

            # ── Person count and density ──
            metrics.person_count = len(zt)
            metrics.density = metrics.person_count / zone_cfg.area_sqm if zone_cfg.area_sqm > 0 else 0
            metrics.track_ids = [t.track_id for t in zt]

            # ── Density growth rate ──
            prev_count = self._previous_counts.get(zid, metrics.person_count)
            if prev_count > 0:
                metrics.density_growth_rate = (metrics.person_count - prev_count) / prev_count
            self._previous_counts[zid] = metrics.person_count

            # Store density history
            self._density_history[zid].append(metrics.density)
            if len(self._density_history[zid]) > self._max_history:
                self._density_history[zid].pop(0)

            # ── Velocity metrics ──
            velocities = []
            speeds = []
            for t in zt:
                speed = t.speed
                speeds.append(speed)
                velocities.append(t.velocity)

            if velocities:
                metrics.avg_velocity = float(np.mean(speeds))
                metrics.velocity_variance = float(np.var(speeds))
            else:
                metrics.avg_velocity = 0.0
                metrics.velocity_variance = 0.0

            # ── Flow analysis ──
            if len(velocities) >= 2:
                vx_arr = np.array([v[0] for v in velocities])
                vy_arr = np.array([v[1] for v in velocities])

                # Mean flow direction
                mean_vx = float(np.mean(vx_arr))
                mean_vy = float(np.mean(vy_arr))
                metrics.flow_magnitude = float(np.sqrt(mean_vx**2 + mean_vy**2))

                # Direction in degrees (0=right, 90=down)
                metrics.flow_direction = math.degrees(math.atan2(mean_vy, mean_vx)) % 360

                # Flow consistency: how aligned are individual velocities with mean
                if metrics.flow_magnitude > 0.01:
                    dot_products = vx_arr * mean_vx + vy_arr * mean_vy
                    norms = np.sqrt(vx_arr**2 + vy_arr**2) * metrics.flow_magnitude
                    norms = np.maximum(norms, 0.001)
                    cos_sim = dot_products / norms
                    metrics.flow_consistency = float(np.mean(np.clip(cos_sim, 0, 1)))
                else:
                    metrics.flow_consistency = 0.0

                # Flow conflict: proportion of velocity pairs moving in opposite directions
                conflict_pairs = 0
                total_pairs = 0
                for i in range(len(velocities)):
                    for j in range(i + 1, len(velocities)):
                        dot = velocities[i][0] * velocities[j][0] + velocities[i][1] * velocities[j][1]
                        mag = (math.sqrt(velocities[i][0]**2 + velocities[i][1]**2) *
                               math.sqrt(velocities[j][0]**2 + velocities[j][1]**2))
                        if mag > 0.01:
                            cos_angle = dot / mag
                            if cos_angle < -0.3:  # roughly opposite
                                conflict_pairs += 1
                            total_pairs += 1

                metrics.flow_conflict = conflict_pairs / max(total_pairs, 1)
            else:
                metrics.flow_consistency = 0.0
                metrics.flow_conflict = 0.0

            # ── Bottleneck score ──
            density_ratio = metrics.density / max(zone_cfg.critical_density, 0.01)
            speed_factor = max(0, 1.0 - metrics.avg_velocity / 1.5)
            conflict_factor = metrics.flow_conflict
            metrics.bottleneck_score = min(1.0, density_ratio * 0.4 + speed_factor * 0.3 + conflict_factor * 0.3)

            # ── Anomaly score ──
            anomaly_signals = []

            # Sudden density spike
            dh = self._density_history[zid]
            if len(dh) >= 3:
                recent_rates = [dh[-i] - dh[-i - 1] for i in range(1, min(3, len(dh)))]
                if any(r > 0.3 for r in recent_rates):
                    anomaly_signals.append(0.3)

            # Very low speed in dense crowd
            if metrics.avg_velocity < 0.3 and metrics.density > zone_cfg.moderate_density:
                anomaly_signals.append(0.3)

            # High flow conflict
            if metrics.flow_conflict > 0.5:
                anomaly_signals.append(0.25)

            # High bottleneck
            if metrics.bottleneck_score > 0.7:
                anomaly_signals.append(0.15)

            metrics.anomaly_score = min(1.0, sum(anomaly_signals))
            self._anomaly_history[zid].append(metrics.anomaly_score)
            if len(self._anomaly_history[zid]) > self._max_history:
                self._anomaly_history[zid].pop(0)

            # ── Entry/exit rates ──
            prev_positions = self._previous_track_positions.get(zid, {})
            current_ids = set(metrics.track_ids)
            prev_ids = set(prev_positions.keys())

            new_entries = current_ids - prev_ids
            exits = prev_ids - current_ids

            metrics.entry_rate = len(new_entries) / 1.0  # per second (approx)
            metrics.exit_rate = len(exits) / 1.0

            self._previous_track_positions[zid] = {t.track_id: t.center for t in zt}

            # ── Average confidence ──
            if zt:
                metrics.avg_confidence = sum(t.confidence for t in zt) / len(zt)

            results[zid] = metrics

        return results

    def get_global_metrics(self, zone_metrics: dict[str, ZoneMetrics]) -> dict:
        """Aggregate zone metrics into global summary."""
        total_persons = sum(m.person_count for m in zone_metrics.values())
        total_area = sum(self.zones[zid].area_sqm for zid in zone_metrics if zid in self.zones)
        total_density = total_persons / max(total_area, 1)

        velocities = [m.avg_velocity for m in zone_metrics.values() if m.person_count > 0]
        avg_velocity = float(np.mean(velocities)) if velocities else 0.0

        max_anomaly = max((m.anomaly_score for m in zone_metrics.values()), default=0.0)
        max_bottleneck = max((m.bottleneck_score for m in zone_metrics.values()), default=0.0)
        max_flow_conflict = max((m.flow_conflict for m in zone_metrics.values()), default=0.0)

        # Find most congested zone
        most_congested = max(zone_metrics.values(), key=lambda m: m.density, default=None)

        return {
            "total_persons": total_persons,
            "total_area_sqm": total_area,
            "global_density": round(total_density, 3),
            "avg_velocity": round(avg_velocity, 2),
            "max_anomaly_score": round(max_anomaly, 3),
            "max_bottleneck_score": round(max_bottleneck, 3),
            "max_flow_conflict": round(max_flow_conflict, 3),
            "most_congested_zone": most_congested.zone_id if most_congested else None,
            "most_congested_density": round(most_congested.density, 3) if most_congested else 0,
            "zones_active": sum(1 for m in zone_metrics.values() if m.person_count > 0),
        }
