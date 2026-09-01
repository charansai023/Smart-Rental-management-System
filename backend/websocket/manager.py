import json
from fastapi import WebSocket
from typing import List


class ConnectionManager:
    """
    Holds every connected dashboard's WebSocket.
    Kafka/event flow is for backend-to-backend streaming; this is the last hop
    that actually pushes a JSON event to the React dashboard in the browser.
    Don't confuse the two — this class only ever talks to browsers.
    """

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, payload: dict):
        message = json.dumps({"type": event_type, "data": payload}, default=str)
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)


manager = ConnectionManager()
