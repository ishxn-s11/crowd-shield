"""YOLO-based person detection module.

Supports:
- YOLOv8 models (nano, small, medium, large)
- Configurable confidence thresholds
- GPU/CPU auto-detection
- Model hot-swapping
"""
import time
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

import structlog

logger = structlog.get_logger()

# Person class COCO class id
PERSON_CLASS_ID = 0


@dataclass
class Detection:
    """Single person detection."""
    bbox: tuple[float, float, float, float]  # x1, y1, x2, y2
    confidence: float
    class_id: int = 0
    center: tuple[float, float] = (0.0, 0.0)
    width: float = 0.0
    height: float = 0.0

    def __post_init__(self):
        x1, y1, x2, y2 = self.bbox
        self.center = ((x1 + x2) / 2, (y1 + y2) / 2)
        self.width = x2 - x1
        self.height = y2 - y1


@dataclass
class FrameDetections:
    """All detections from a single frame."""
    frame_id: int
    timestamp: float
    detections: list[Detection] = field(default_factory=list)
    inference_time_ms: float = 0.0
    frame_shape: tuple[int, int, int] = (0, 0, 0)

    @property
    def person_count(self) -> int:
        return len(self.detections)

    @property
    def avg_confidence(self) -> float:
        if not self.detections:
            return 0.0
        return sum(d.confidence for d in self.detections) / len(self.detections)


class PersonDetector:
    """YOLO-based person detector with model hot-swapping.

    Usage:
        detector = PersonDetector(model_path="yolov8n.pt")
        detections = detector.detect(frame)
    """

    MODEL_MAP = {
        "yolov8n": "yolov8n.pt",
        "yolov8s": "yolov8s.pt",
        "yolov8m": "yolov8m.pt",
        "yolov8l": "yolov8l.pt",
        "yolov8x": "yolov8x.pt",
    }

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45,
        device: Optional[str] = None,
        max_detections: int = 500,
        person_only: bool = True,
    ):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        self.device = device
        self.max_detections = max_detections
        self.person_only = person_only
        self._model: Optional[YOLO] = None
        self._frame_counter = 0
        self._load_model()

    def _load_model(self):
        """Load or reload the YOLO model."""
        if not HAS_YOLO:
            logger.warning("ultralytics_not_available", msg="Running in fallback mode (no YOLO)")
            self._model = None
            return

        try:
            # Resolve model name to path
            model_path = self.MODEL_MAP.get(self.model_path, self.model_path)
            self._model = YOLO(model_path)

            # Auto-detect device
            if self.device:
                self._model.to(self.device)

            logger.info(
                "model_loaded",
                model=model_path,
                device=str(self._model.device),
                conf=self.confidence_threshold,
            )
        except Exception as e:
            logger.error("model_load_failed", error=str(e))
            self._model = None

    def swap_model(self, model_path: str):
        """Hot-swap the detection model."""
        self.model_path = model_path
        self._load_model()

    def detect(self, frame: np.ndarray) -> FrameDetections:
        """Run person detection on a single frame.

        Args:
            frame: BGR image as numpy array (H, W, 3)

        Returns:
            FrameDetections with all person detections
        """
        self._frame_counter += 1
        timestamp = time.time()
        h, w = frame.shape[:2] if frame is not None else (0, 0, 0)

        if self._model is None or frame is None:
            return FrameDetections(
                frame_id=self._frame_counter,
                timestamp=timestamp,
                frame_shape=(h, w, 3) if frame is not None else (0, 0, 0),
            )

        t0 = time.time()

        # Run inference
        results = self._model(
            frame,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            max_det=self.max_detections,
            verbose=False,
        )

        inference_ms = (time.time() - t0) * 1000

        detections = []
        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes

            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0])

                    # Filter for persons only
                    if self.person_only and cls_id != PERSON_CLASS_ID:
                        continue

                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                    detections.append(Detection(
                        bbox=(float(x1), float(y1), float(x2), float(y2)),
                        confidence=conf,
                        class_id=cls_id,
                    ))

        frame_det = FrameDetections(
            frame_id=self._frame_counter,
            timestamp=timestamp,
            detections=detections,
            inference_time_ms=inference_ms,
            frame_shape=(h, w, 3),
        )

        logger.debug(
            "detection_complete",
            frame_id=self._frame_counter,
            persons=frame_det.person_count,
            avg_conf=round(frame_det.avg_confidence, 3),
            inference_ms=round(inference_ms, 1),
        )

        return frame_det


class FallbackDetector:
    """Fallback detector using background subtraction when YOLO is not available.

    Provides approximate person detection for environments without GPU.
    Uses motion-based detection with contour analysis.
    """

    def __init__(
        self,
        min_area: int = 500,
        max_area: int = 50000,
        confidence_threshold: float = 0.3,
    ):
        self.min_area = min_area
        self.max_area = max_area
        self.confidence_threshold = confidence_threshold
        self._bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500, varThreshold=50, detectShadows=True
        )
        self._frame_counter = 0

    def detect(self, frame: np.ndarray) -> FrameDetections:
        """Detect moving objects using background subtraction."""
        self._frame_counter += 1
        timestamp = time.time()
        h, w = frame.shape[:2] if frame is not None else (0, 0, 0)

        if frame is None:
            return FrameDetections(
                frame_id=self._frame_counter,
                timestamp=timestamp,
                frame_shape=(0, 0, 0),
            )

        t0 = time.time()

        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(frame, (5, 5), 0)

        # Background subtraction
        fg_mask = self._bg_subtractor.apply(blurred)

        # Remove shadows (shadow pixels are gray = 127 in MOG2)
        fg_mask = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)[1]

        # Morphological operations to clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel, iterations=1)

        # Find contours
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        for contour in contours:
            area = cv2.contourArea(contour)

            if area < self.min_area or area > self.max_area:
                continue

            x, y, bw, bh = cv2.boundingRect(contour)

            # Estimate confidence from area (larger = more likely a person)
            # Typical person: 100-300px wide, 150-400px tall in 1080p
            expected_person_area = 8000  # rough estimate
            conf = min(1.0, area / expected_person_area) * 0.8

            if conf < self.confidence_threshold:
                continue

            detections.append(Detection(
                bbox=(float(x), float(y), float(x + bw), float(y + bh)),
                confidence=conf,
                class_id=PERSON_CLASS_ID,
            ))

        inference_ms = (time.time() - t0) * 1000

        return FrameDetections(
            frame_id=self._frame_counter,
            timestamp=timestamp,
            detections=detections,
            inference_time_ms=inference_ms,
            frame_shape=(h, w, 3),
        )


def create_detector(
    model_path: str = "yolov8n.pt",
    confidence_threshold: float = 0.5,
    device: Optional[str] = None,
    fallback: bool = True,
) -> PersonDetector | FallbackDetector:
    """Factory: create the best available detector.

    Tries YOLO first; falls back to background subtraction if unavailable.
    """
    if HAS_YOLO:
        try:
            det = PersonDetector(
                model_path=model_path,
                confidence_threshold=confidence_threshold,
                device=device,
            )
            if det._model is not None:
                return det
        except Exception as e:
            logger.warning("yolo_init_failed", error=str(e))

    if fallback:
        logger.info("using_fallback_detector", reason="YOLO not available")
        return FallbackDetector(confidence_threshold=confidence_threshold)

    raise RuntimeError("No detector available and fallback disabled")
