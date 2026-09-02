from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import TelemetryLog
from schemas.telemetry import TelemetryEvent
from services.tracking import ingest_telemetry
from services.alerts import evaluate_equipment
from websocket.manager import manager

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("")
async def post_telemetry(event: TelemetryEvent, db: Session = Depends(get_db)):
    """The Python IoT simulator POSTs here on an interval — this is the
    'Telemetry' arrow at the top of the architecture diagram."""
    equipment = ingest_telemetry(db, event)
    if not equipment:
        raise HTTPException(404, f"Equipment '{event.equipment_id}' not found.")

    new_alerts = evaluate_equipment(db, equipment)

    await manager.broadcast("telemetry_update", {
        "equipment_id": equipment.equipment_id,
        "latitude": equipment.latitude,
        "longitude": equipment.longitude,
        "fuel_level": equipment.fuel_level,
        "status": equipment.status,
    })
    for alert in new_alerts:
        await manager.broadcast("new_alert", {
            "id": alert.id, "equipment_id": alert.equipment_id,
            "level": alert.level, "kind": alert.kind, "title": alert.title, "body": alert.body,
        })

    return {"ok": True}


@router.get("/{equipment_id}/history")
def telemetry_history(equipment_id: str, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(TelemetryLog)
        .filter(TelemetryLog.equipment_id == equipment_id)
        .order_by(TelemetryLog.timestamp.desc())
        .limit(limit)
        .all()
    )
