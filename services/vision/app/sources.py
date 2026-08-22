"""Video source handlers.

Supports multiple input types:
- Webcam (local USB camera)
- RTSP stream (IP cameras / CCTV)
- Video file upload
- Simulated feed (generates synthetic crowd frames)
"""
import asyncio
import math
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

import cv2
import numpy as np

import structlog

logger = structlog.get_logger()


@dataclass
class Frame:
    """A video frame with metadata."""
    image: np.ndarray
    frame_id: int
    timestamp: float
    source_id: str


class VideoSource(ABC):
    """Abstract base for video sources."""

    def __init__(self, source_id: str):
        self.source_id = source_id
        self.is_open = False

    @abstractmethod
    def open(self) -> bool:
        pass

    @abstractmethod
    def read(self) -> Optional[Frame]:
        pass

    @abstractmethod
    def close(self):
        pass

    @property
    @abstractmethod
    def resolution(self) -> tuple[int, int]:
        pass


class WebcamSource(VideoSource):
    """Local USB webcam capture.

    Args:
        device_index: Camera device index (0, 1, 2...)
        width: Desired frame width
        height: Desired frame height
        fps: Desired frame rate
    """

    def __init__(
        self,
        source_id: str = "webcam-0",
        device_index: int = 0,
        width: int = 1280,
        height: int = 720,
        fps: int = 30,
    ):
        super().__init__(source_id)
        self.device_index = device_index
        self.width = width
        self.height = height
        self.fps = fps
        self._cap: Optional[cv2.VideoCapture] = None
        self._frame_id = 0

    def open(self) -> bool:
        try:
            self._cap = cv2.VideoCapture(self.device_index)
            if not self._cap.isOpened():
                logger.error("webcam_open_failed", device=self.device_index)
                return False

            self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self._cap.set(cv2.CAP_PROP_FPS, self.fps)

            self.is_open = True
            logger.info("webcam_opened", device=self.device_index, res=f"{self.width}x{self.height}")
            return True
        except Exception as e:
            logger.error("webcam_error", error=str(e))
            return False

    def read(self) -> Optional[Frame]:
        if not self._cap or not self._cap.isOpened():
            return None

        ret, frame = self._cap.read()
        if not ret or frame is None:
            return None

        self._frame_id += 1
        return Frame(
            image=frame,
            frame_id=self._frame_id,
            timestamp=time.time(),
            source_id=self.source_id,
        )

    def close(self):
        if self._cap:
            self._cap.release()
            self.is_open = False

    @property
    def resolution(self) -> tuple[int, int]:
        return (self.width, self.height)


class RTSPSource(VideoSource):
    """RTSP stream source for IP cameras / CCTV.

    Supports reconnection on failure.

    Args:
        url: RTSP URL (rtsp://user:pass@ip:port/stream)
        reconnect_delay: Seconds before reconnection attempt
    """

    def __init__(
        self,
        source_id: str = "rtsp-0",
        url: str = "rtsp://192.168.1.100:554/stream1",
        reconnect_delay: float = 3.0,
    ):
        super().__init__(source_id)
        self.url = url
        self.reconnect_delay = reconnect_delay
        self._cap: Optional[cv2.VideoCapture] = None
        self._frame_id = 0
        self._width = 1920
        self._height = 1080

    def open(self) -> bool:
        return self._connect()

    def _connect(self) -> bool:
        try:
            # OpenCV RTSP with TCP for reliability
            self._cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
            if not self._cap.isOpened():
                logger.error("rtsp_open_failed", url=self.url)
                return False

            self._width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
            self._height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080
            self.is_open = True
            logger.info("rtsp_connected", url=self.url, res=f"{self._width}x{self._height}")
            return True
        except Exception as e:
            logger.error("rtsp_connection_error", url=self.url, error=str(e))
            return False

    def read(self) -> Optional[Frame]:
        if not self._cap or not self._cap.isOpened():
            # Try reconnecting
            if not self._connect():
                return None

        ret, frame = self._cap.read()
        if not ret or frame is None:
            logger.warning("rtsp_frame_lost", source=self.source_id)
            self.close()
            time.sleep(self.reconnect_delay)
            self._connect()
            return None

        self._frame_id += 1
        return Frame(
            image=frame,
            frame_id=self._frame_id,
            timestamp=time.time(),
            source_id=self.source_id,
        )

    def close(self):
        if self._cap:
            self._cap.release()
            self.is_open = False

    @property
    def resolution(self) -> tuple[int, int]:
        return (self._width, self._height)


class VideoFileSource(VideoSource):
    """Video file source (MP4, AVI, etc.)."""

    def __init__(
        self,
        source_id: str = "video-0",
        file_path: str = "",
        loop: bool = False,
    ):
        super().__init__(source_id)
        self.file_path = file_path
        self.loop = loop
        self._cap: Optional[cv2.VideoCapture] = None
        self._frame_id = 0

    def open(self) -> bool:
        try:
            self._cap = cv2.VideoCapture(self.file_path)
            if not self._cap.isOpened():
                logger.error("video_file_open_failed", path=self.file_path)
                return False
            self.is_open = True
            logger.info("video_file_opened", path=self.file_path)
            return True
        except Exception as e:
            logger.error("video_file_error", error=str(e))
            return False

    def read(self) -> Optional[Frame]:
        if not self._cap or not self._cap.isOpened():
            return None

        ret, frame = self._cap.read()
        if not ret or frame is None:
            if self.loop:
                self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self._cap.read()
                if not ret:
                    return None
            else:
                return None

        self._frame_id += 1
        return Frame(
            image=frame,
            frame_id=self._frame_id,
            timestamp=time.time(),
            source_id=self.source_id,
        )

    def close(self):
        if self._cap:
            self._cap.release()
            self.is_open = False

    @property
    def resolution(self) -> tuple[int, int]:
        if self._cap:
            w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            return (w, h)
        return (0, 0)


class SimulatedSource(VideoSource):
    """Generates synthetic crowd frames for demonstration.

    Renders a top-down view with moving dots representing people.
    Useful for testing the pipeline without real cameras.
    """

    def __init__(
        self,
        source_id: str = "sim-0",
        width: int = 1280,
        height: int = 720,
        num_people: int = 50,
        fps: int = 15,
    ):
        super().__init__(source_id)
        self.width = width
        self.height = height
        self.num_people = num_people
        self.fps = fps
        self._frame_id = 0
        self._people: list[dict] = []
        self._init_people()

    def _init_people(self):
        """Initialize synthetic people with random positions and velocities."""
        self._people = []
        for i in range(self.num_people):
            self._people.append({
                "x": np.random.uniform(50, self.width - 50),
                "y": np.random.uniform(50, self.height - 50),
                "vx": np.random.uniform(-2, 2),
                "vy": np.random.uniform(-2, 2),
                "radius": np.random.randint(4, 8),
                "color": (
                    np.random.randint(100, 255),
                    np.random.randint(100, 255),
                    np.random.randint(100, 255),
                ),
            })

    def open(self) -> bool:
        self.is_open = True
        logger.info("sim_source_opened", people=self.num_people, res=f"{self.width}x{self.height}")
        return True

    def read(self) -> Optional[Frame]:
        # Create dark background
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        frame[:] = (20, 20, 30)  # dark blue-gray

        # Draw grid
        for x in range(0, self.width, 100):
            cv2.line(frame, (x, 0), (x, self.height), (40, 40, 50), 1)
        for y in range(0, self.height, 100):
            cv2.line(frame, (0, y), (self.width, y), (40, 40, 50), 1)

        # Draw and update people
        t = self._frame_id * 0.1
        for p in self._people:
            # Add sinusoidal movement for realistic crowd flow
            p["x"] += p["vx"] + math.sin(t + p["y"] * 0.01) * 0.5
            p["y"] += p["vy"] + math.cos(t + p["x"] * 0.01) * 0.3

            # Bounce off walls
            if p["x"] < 10 or p["x"] > self.width - 10:
                p["vx"] *= -1
                p["x"] = np.clip(p["x"], 10, self.width - 10)
            if p["y"] < 10 or p["y"] > self.height - 10:
                p["vy"] *= -1
                p["y"] = np.clip(p["y"], 10, self.height - 10)

            # Draw person as a colored dot
            center = (int(p["x"]), int(p["y"]))
            cv2.circle(frame, center, p["radius"], p["color"], -1)
            cv2.circle(frame, center, p["radius"], (255, 255, 255), 1)

        # Draw zone labels
        zones = [
            ("Zone A", 100, 50), ("Zone B", 500, 50), ("Zone C", 900, 50),
            ("Zone D", 300, 300), ("Zone E", 700, 300),
        ]
        for name, x, y in zones:
            cv2.putText(frame, name, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 150, 200), 1)
            cv2.rectangle(frame, (x - 20, y - 30), (x + 100, y + 80), (60, 60, 70), 1)

        # Draw info
        cv2.putText(frame, f"SIMULATED FEED | People: {len(self._people)}",
                    (10, self.height - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 200, 100), 1)

        self._frame_id += 1
        return Frame(
            image=frame,
            frame_id=self._frame_id,
            timestamp=time.time(),
            source_id=self.source_id,
        )

    def close(self):
        self.is_open = False

    @property
    def resolution(self) -> tuple[int, int]:
        return (self.width, self.height)

    def set_crowd_size(self, n: int):
        """Dynamically change the number of simulated people."""
        while len(self._people) < n:
            self._people.append({
                "x": np.random.uniform(50, self.width - 50),
                "y": np.random.uniform(50, self.height - 50),
                "vx": np.random.uniform(-3, 3),
                "vy": np.random.uniform(-3, 3),
                "radius": np.random.randint(4, 8),
                "color": (
                    np.random.randint(100, 255),
                    np.random.randint(100, 255),
                    np.random.randint(100, 255),
                ),
            })
        while len(self._people) > n:
            self._people.pop()


def create_source(
    source_type: str = "simulated",
    source_url: str = "",
    source_id: str = "cam-0",
    **kwargs,
) -> VideoSource:
    """Factory to create video source by type."""
    if source_type == "webcam":
        device_idx = int(source_url) if source_url.isdigit() else 0
        return WebcamSource(source_id=source_id, device_index=device_idx, **kwargs)
    elif source_type == "rtsp":
        return RTSPSource(source_id=source_id, url=source_url, **kwargs)
    elif source_type in ("video", "uploaded", "file"):
        return VideoFileSource(source_id=source_id, file_path=source_url, **kwargs)
    else:
        return SimulatedSource(source_id=source_id, **kwargs)
