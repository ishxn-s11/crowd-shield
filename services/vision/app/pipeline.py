"""Vision pipeline orchestrator.

Ties together:
- Frame extraction from video sources
- Person detection (YOLO / fallback)
- Multi-object tracking (ByteTrack)
- Crowd density estimation
- Flow analysis
- Real-time metrics output

Runs as an async background task, broadcasting results via callback.
"""
import asyncio
import time
from dataclasses import dataclass, field
from typing import Callable, Optional

import cv2
import numpy as np

from .detector import PersonDetector, FallbackDetector, FrameDetections, create_detector
from .tracker import ByteTracker, TrackState
from .density import CrowdDensityEstimator, ZoneConfig, ZoneMetrics
from .sources import VideoSource, SimulatedSource, create_source

import structlog

logger = structlog.get_logger()


@dataclass
class PipelineConfig:
    """Configuration for the vision pipeline."""
    source_type: str = "simulated"
    source_url: str = ""
    model_path: str = "yolov8n.pt"
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    track_thresh: float = 0.5
    match_thresh: float = 0.3
    max_time_lost: int = 30
    max_fps: int = 15
    process_width: int = 640
    process_height: int = 640
    zones: list[ZoneConfig] = field(default_factory=list)


@dataclass
class PipelineState:
    """Current state of the vision pipeline."""
    is_running: bool = False
    source_id: str = ""
    fps: float = 0.0
    frame_id: int = 0
    total_frames: int = 0
    inference_time_ms: float = 0.0
    tracker_time_ms: float = 0.0
    total_pipeline_time_ms: float = 0.0
    detections: list = field(default_factory=list)
    tracks: dict = field(default_factory=dict)
    zone_metrics: dict = field(default_factory=dict)
    global_metrics: dict = field(default_factory=dict)


class VisionPipeline:
    """End-to-end vision pipeline for crowd monitoring.

    Usage:
        config = PipelineConfig(source_type="simulated")
        pipeline = VisionPipeline(config)
        pipeline.on_update(callback)  # register update listener
        await pipeline.start()  # runs until stopped
    """

    def __init__(self, config: PipelineConfig):
        self.config = config
        self.state = PipelineState()
        self._source: Optional[VideoSource] = None
        self._detector = None
        self._tracker = ByteTracker(
            track_thresh=config.track_thresh,
            match_thresh=config.match_thresh,
            max_time_lost=config.max_time_lost,
        )
        self._density_estimator = CrowdDensityEstimator(config.zones)
        self._listeners: list[Callable] = []
        self._running = False
        self._task: Optional[asyncio.Task] = None

        # Performance tracking
        self._fps_counter = 0
        self._fps_timer = time.time()
        self._current_fps = 0.0

    def on_update(self, callback: Callable):
        """Register a callback for pipeline updates."""
        self._listeners.append(callback)

    def _create_source(self) -> VideoSource:
        """Create the video source."""
        return create_source(
            source_type=self.config.source_type,
            source_url=self.config.source_url,
            source_id=f"cam-{self.config.source_type}",
        )

    def _create_detector(self):
        """Create the person detector."""
        return create_detector(
            model_path=self.config.model_path,
            confidence_threshold=self.config.confidence_threshold,
        )

    def _preprocess_frame(self, frame: np.ndarray) -> np.ndarray:
        """Resize frame for model inference while keeping original for display."""
        h, w = frame.shape[:2]
        target_w = self.config.process_width
        target_h = self.config.process_height

        # Maintain aspect ratio
        scale = min(target_w / w, target_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)

        return cv2.resize(frame, (new_w, new_h))

    async def start(self):
        """Start the pipeline."""
        if self._running:
            return

        self._running = True
        self.state.is_running = True

        # Initialize components
        self._source = self._create_source()
        self._detector = self._create_detector()

        if not self._source.open():
            logger.error("source_open_failed")
            self._running = False
            self.state.is_running = False
            return

        self.state.source_id = self._source.source_id
        logger.info("pipeline_started", source=self.state.source_id)

        self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        """Stop the pipeline."""
        self._running = False
        self.state.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._source:
            self._source.close()
        logger.info("pipeline_stopped")

    async def _run_loop(self):
        """Main processing loop."""
        frame_interval = 1.0 / self.config.max_fps

        while self._running:
            t_start = time.time()

            # Read frame
            frame_data = self._source.read()
            if frame_data is None:
                await asyncio.sleep(0.1)
                continue

            frame = frame_data.image
            self.state.total_frames += 1
            self.state.frame_id = frame_data.frame_id

            # Detect persons
            t_det = time.time()
            detections = self._detector.detect(frame)
            self.state.inference_time_ms = (time.time() - t_det) * 1000

            # Track persons
            t_track = time.time()
            tracks_list = self._tracker.update(detections.detections)
            self.state.tracker_time_ms = (time.time() - t_track) * 1000

            # Build tracks dict
            tracks_dict = {t.track_id: t for t in tracks_list}

            # Compute density and flow metrics
            zone_metrics = self._density_estimator.compute_metrics(
                tracks_dict, frame.shape
            )
            global_metrics = self._density_estimator.get_global_metrics(zone_metrics)

            # Update state
            self.state.detections = detections.detections
            self.state.tracks = tracks_dict
            self.state.zone_metrics = {zid: m.__dict__ for zid, m in zone_metrics.items()}
            self.state.global_metrics = global_metrics

            # FPS tracking
            self._fps_counter += 1
            elapsed = time.time() - self._fps_timer
            if elapsed >= 1.0:
                self._current_fps = self._fps_counter / elapsed
                self.state.fps = round(self._current_fps, 1)
                self._fps_counter = 0
                self._fps_timer = time.time()

            self.state.total_pipeline_time_ms = (time.time() - t_start) * 1000

            # Notify listeners
            await self._notify_listeners()

            # Rate limiting
            processing_time = time.time() - t_start
            sleep_time = max(0, frame_interval - processing_time)
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

    async def _notify_listeners(self):
        """Send state update to all listeners."""
        data = self.get_state_dict()
        for cb in self._listeners:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(data)
                else:
                    cb(data)
            except Exception as e:
                logger.warning("listener_error", error=str(e))

    def get_state_dict(self) -> dict:
        """Get pipeline state as a serializable dict."""
        return {
            "timestamp": time.time(),
            "is_running": self.state.is_running,
            "source_id": self.state.source_id,
            "fps": self.state.fps,
            "frame_id": self.state.frame_id,
            "total_frames": self.state.total_frames,
            "person_count": len(self.state.tracks),
            "inference_time_ms": round(self.state.inference_time_ms, 1),
            "tracker_time_ms": round(self.state.tracker_time_ms, 1),
            "pipeline_time_ms": round(self.state.total_pipeline_time_ms, 1),
            "zone_metrics": self.state.zone_metrics,
            "global_metrics": self.state.global_metrics,
            "tracks": {
                tid: {
                    "track_id": t.track_id,
                    "bbox": list(t.bbox),
                    "center": list(t.center),
                    "confidence": round(t.confidence, 3),
                    "velocity": list(t.velocity),
                    "speed": round(t.speed, 2),
                    "age": t.age,
                    "zone_id": t.zone_id,
                }
                for tid, t in self.state.tracks.items()
            },
        }


class MultiCameraManager:
    """Manages multiple vision pipelines for multi-camera setups."""

    def __init__(self):
        self.pipelines: dict[str, VisionPipeline] = {}
        self._listeners: list[Callable] = []

    def on_update(self, callback: Callable):
        self._listeners.append(callback)

    async def add_camera(
        self,
        camera_id: str,
        source_type: str = "simulated",
        source_url: str = "",
        zones: list[ZoneConfig] | None = None,
    ) -> bool:
        """Add a new camera pipeline."""
        if camera_id in self.pipelines:
            return False

        config = PipelineConfig(
            source_type=source_type,
            source_url=source_url,
            zones=zones or [],
        )

        pipeline = VisionPipeline(config)
        pipeline.on_update(lambda data, cam=camera_id: self._on_camera_update(cam, data))

        self.pipelines[camera_id] = pipeline
        await pipeline.start()
        return True

    async def remove_camera(self, camera_id: str):
        if camera_id in self.pipelines:
            await self.pipelines[camera_id].stop()
            del self.pipelines[camera_id]

    def _on_camera_update(self, camera_id: str, data: dict):
        data["camera_id"] = camera_id
        for cb in self._listeners:
            try:
                cb(data)
            except Exception:
                pass

    async def start_all(self):
        for pipeline in self.pipelines.values():
            await pipeline.start()

    async def stop_all(self):
        for pipeline in self.pipelines.values():
            await pipeline.stop()

    def get_all_state(self) -> dict:
        return {
            cam_id: p.get_state_dict()
            for cam_id, p in self.pipelines.items()
        }
