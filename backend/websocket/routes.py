from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.manager import manager

router = APIRouter()


@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket):
    """
    The React dashboard opens exactly one of these on load.
    Every checkout/checkin/telemetry-tick/alert on the backend calls
    manager.broadcast(...) which pushes straight down this socket —
    that's the "WebSocket / REAL-TIME PUSH" arrow in the architecture diagram.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Dashboard doesn't need to send anything; just keep the socket alive.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
