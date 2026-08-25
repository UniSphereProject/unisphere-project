from __future__ import annotations

import asyncio
from collections import defaultdict

from fastapi import WebSocket

from app.utils.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # user_id -> set of open sockets (a user may have multiple tabs)
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        # Event loop of the FastAPI server, captured on first connect so
        # background threads (the scheduler) can push messages safely.
        self._loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[user_id].add(websocket)
        self._loop = asyncio.get_running_loop()
        logger.info("WebSocket connected: user %s (%d sockets)", user_id, len(self._connections[user_id]))

    def disconnect(self, user_id: int, websocket: WebSocket) -> None:
        self._connections[user_id].discard(websocket)
        if not self._connections[user_id]:
            self._connections.pop(user_id, None)
        logger.info("WebSocket disconnected: user %s", user_id)

    async def send_to_user(self, user_id: int, payload: dict) -> None:
        """Send a JSON payload to every open socket of a user (async context)."""
        sockets = list(self._connections.get(user_id, ()))
        for ws in sockets:
            try:
                await ws.send_json(payload)
            except Exception:
                # Socket died without a clean disconnect — drop it.
                self.disconnect(user_id, ws)

    def send_to_user_sync(self, user_id: int, payload: dict) -> None:
        """Thread-safe variant for the scheduler (runs outside the event loop).

        Silently does nothing when the user has no open sockets or the
        server loop is not available — the notification is persisted in
        the DB anyway, so nothing is lost.
        """
        if user_id not in self._connections:
            return
        loop = self._loop
        if loop is None or loop.is_closed():
            return
        try:
            asyncio.run_coroutine_threadsafe(self.send_to_user(user_id, payload), loop)
        except Exception as exc:
            logger.warning("Live push to user %s failed: %s", user_id, exc)


# Singleton used by routes and the notification service
manager = ConnectionManager()
