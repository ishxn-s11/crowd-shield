"""Multi-object tracking with ByteTrack algorithm.

Tracks persons across frames, maintaining persistent IDs.
Handles occlusion and re-identification.
"""
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from scipy.optimize import linear_sum_assignment

import structlog

logger = structlog.get_logger()


@dataclass
class TrackState:
    """State of a single tracked person."""
    track_id: int
    bbox: tuple[float, float, float, float]
    center: tuple[float, float]
    confidence: float
    velocity: tuple[float, float] = (0.0, 0.0)
    speed: float = 0.0
    age: int = 0  # frames since first seen
    hits: int = 0  # total detections
    time_since_update: int = 0
    zone_id: str = ""
    is_occluded: bool = False
    trajectory: list[tuple[float, float]] = field(default_factory=list)
    max_trajectory_length: int = 60

    def __post_init__(self):
        if len(self.trajectory) < self.max_trajectory_length:
            self.trajectory.append(self.center)


class ByteTracker:
    """Simplified ByteTrack implementation.

    Two-stage matching:
    1. Match high-confidence detections to existing tracks (IoU matching)
    2. Match remaining low-confidence detections to unmatched tracks

    Args:
        track_thresh: High confidence threshold for first-stage matching
        match_thresh: IoU threshold for matching
        max_time_lost: Max frames a track can survive without detection
        max_tracks: Maximum number of active tracks
    """

    def __init__(
        self,
        track_thresh: float = 0.5,
        match_thresh: float = 0.3,
        max_time_lost: int = 30,
        max_tracks: int = 500,
    ):
        self.track_thresh = track_thresh
        self.match_thresh = match_thresh
        self.max_time_lost = max_time_lost
        self.max_tracks = max_tracks

        self._track_id_counter = 0
        self._active_tracks: dict[int, TrackState] = {}
        self._lost_tracks: dict[int, TrackState] = {}
        self._frame_id = 0

    def _new_track_id(self) -> int:
        self._track_id_counter += 1
        return self._track_id_counter

    def _compute_iou(self, bbox1: tuple, bbox2: tuple) -> float:
        """Compute IoU between two bounding boxes."""
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])

        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = max(1, (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1]))
        area2 = max(1, (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1]))
        union = area1 + area2 - inter

        return inter / union if union > 0 else 0.0

    def _compute_cost_matrix(
        self, tracks: dict[int, TrackState], detections: list
    ) -> np.ndarray:
        """Compute IoU cost matrix for Hungarian matching."""
        track_ids = list(tracks.keys())
        n_tracks = len(track_ids)
        n_det = len(detections)

        if n_tracks == 0 or n_det == 0:
            return np.zeros((max(n_tracks, 1), max(n_det, 1)))

        cost = np.zeros((n_tracks, n_det))
        for i, tid in enumerate(track_ids):
            for j, det in enumerate(detections):
                cost[i, j] = 1.0 - self._compute_iou(tracks[tid].bbox, det.bbox)

        return cost

    def _match(
        self, tracks: dict[int, TrackState], detections: list, thresh: float
    ) -> tuple[list[tuple[int, int]], list[int], list[int]]:
        """Hungarian matching with IoU threshold.

        Returns:
            matched: list of (track_idx, det_idx) pairs
            unmatched_tracks: list of track indices
            unmatched_dets: list of detection indices
        """
        if not tracks or not detections:
            return [], list(range(len(tracks))), list(range(len(detections)))

        cost = self._compute_cost_matrix(tracks, detections)
        track_ids = list(tracks.keys())

        row_indices, col_indices = linear_sum_assignment(cost)

        matched = []
        matched_tracks = set()
        matched_dets = set()

        for r, c in zip(row_indices, col_indices):
            if cost[r, c] < (1.0 - thresh):  # IoU > thresh means cost < 1-thresh
                matched.append((track_ids[r], c))
                matched_tracks.add(track_ids[r])
                matched_dets.add(c)

        unmatched_tracks = [tid for tid in track_ids if tid not in matched_tracks]
        unmatched_dets = [j for j in range(len(detections)) if j not in matched_dets]

        return matched, unmatched_tracks, unmatched_dets

    def update(self, detections: list) -> list[TrackState]:
        """Update tracker with new detections.

        Args:
            detections: list of Detection objects from detector

        Returns:
            List of active TrackState objects
        """
        self._frame_id += 1

        # Split detections by confidence
        high_conf = [d for d in detections if d.confidence >= self.track_thresh]
        low_conf = [d for d in detections if d.confidence < self.track_thresh]

        # ── Stage 1: Match high-confidence detections ──
        matched, unmatched_tracks, unmatched_dets = self._match(
            self._active_tracks, high_conf, self.match_thresh
        )

        # Update matched tracks
        for track_id, det_idx in matched:
            det = high_conf[det_idx]
            track = self._active_tracks[track_id]

            # Compute velocity
            old_center = track.center
            new_center = det.center
            dt = 1.0 / 30.0  # assume 30fps
            vx = (new_center[0] - old_center[0]) * dt
            vy = (new_center[1] - old_center[1]) * dt

            # Smooth velocity with exponential moving average
            alpha = 0.3
            vx_smooth = alpha * vx + (1 - alpha) * track.velocity[0]
            vy_smooth = alpha * vy + (1 - alpha) * track.velocity[1]

            track.bbox = det.bbox
            track.center = new_center
            track.confidence = det.confidence
            track.velocity = (vx_smooth, vy_smooth)
            track.speed = float(np.sqrt(vx_smooth**2 + vy_smooth**2))
            track.hits += 1
            track.time_since_update = 0
            track.age += 1
            track.trajectory.append(new_center)
            if len(track.trajectory) > track.max_trajectory_length:
                track.trajectory.pop(0)

        # Mark unmatched active tracks
        for track_id in unmatched_tracks:
            track = self._active_tracks[track_id]
            track.time_since_update += 1
            track.is_occluded = True

            # Move to lost if not seen for too long
            if track.time_since_update > self.max_time_lost:
                self._lost_tracks[track_id] = track
                del self._active_tracks[track_id]

        # Create new tracks for unmatched high-confidence detections
        for det_idx in unmatched_dets:
            if len(self._active_tracks) >= self.max_tracks:
                break
            det = high_conf[det_idx]
            tid = self._new_track_id()
            self._active_tracks[tid] = TrackState(
                track_id=tid,
                bbox=det.bbox,
                center=det.center,
                confidence=det.confidence,
                hits=1,
                age=1,
            )

        # ── Stage 2: Match low-confidence detections to lost tracks ──
        if low_conf and self._lost_tracks:
            matched2, unmatched_lost, _ = self._match(
                self._lost_tracks, low_conf, self.match_thresh
            )

            for track_id, det_idx in matched2:
                det = low_conf[det_idx]
                track = self._lost_tracks.pop(track_id)
                track.bbox = det.bbox
                track.center = det.center
                track.confidence = det.confidence
                track.hits += 1
                track.time_since_update = 0
                track.is_occluded = False
                track.trajectory.append(det.center)
                if len(track.trajectory) > track.max_trajectory_length:
                    track.trajectory.pop(0)
                self._active_tracks[track_id] = track

        return list(self._active_tracks.values())

    @property
    def active_count(self) -> int:
        return len(self._active_tracks)

    @property
    def total_ids(self) -> int:
        return self._track_id_counter

    def get_tracks(self) -> dict[int, TrackState]:
        return dict(self._active_tracks)

    def reset(self):
        """Reset all tracks."""
        self._track_id_counter = 0
        self._active_tracks.clear()
        self._lost_tracks.clear()
        self._frame_id = 0
