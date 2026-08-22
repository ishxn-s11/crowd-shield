"""WebSocket connection manager for real-time updates."""
import asyncio
import json
import time
from typing import Any
from fastapi import WebSocket
import structlog

logger = structlog.get_logger()


class ConnectionManager:
    """Manages WebSocket connections for real-time dashboard updates."""
    
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self._heartbeat_task: asyncio.Task | None = None
    
    async def connect(self, websocket: WebSocket, channel: str = "default"):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info("ws_connected", channel=channel, total=len(self.active_connections[channel]))
    
    def disconnect(self, websocket: WebSocket, channel: str = "default"):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
                if not self.active_connections[channel]:
                    del self.active_connections[channel]
    
    async def broadcast(self, channel: str, data: dict[str, Any]):
        if channel not in self.active_connections:
            return
        dead = []
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(data)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.active_connections[channel].remove(conn)
    
    async def broadcast_all(self, data: dict[str, Any]):
        for channel in list(self.active_connections.keys()):
            await self.broadcast(channel, data)
    
    def get_connection_count(self, channel: str = None) -> int:
        if channel:
            return len(self.active_connections.get(channel, []))
        return sum(len(conns) for conns in self.active_connections.values())


ws_manager = ConnectionManager()
