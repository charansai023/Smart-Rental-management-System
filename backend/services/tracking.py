from sqlalchemy.orm import Session
from models import Equipment, TelemetryLog
from schemas.telemetry import TelemetryEvent
from redis_client import set_equipment_state


def ingest_telemetry(db: Session, event: TelemetryEvent) -> Equipment | None:
    """
    This is the "Tracking Service" box in the architecture diagram:
    telemetry in -> Postgres (history) + Redis (current state) out.
    Postgres answers "what happened over the last 30 days";
    Redis answers "where is it right now" for the map/dashboard.
    """
    equipment = db.get(Equipment, event.equipment_id)
    if not equipment:
        return None

    log = TelemetryLog(
        equipment_id=event.equipment_id,
        latitude=event.latitude,
        longitude=event.longitude,
        fuel_level=event.fuel_level,
        engine_hours=event.engine_hours,
        idle_hours=event.idle_hours,
        status=event.status,
    )
    db.add(log)

    equipment.latitude = event.latitude
    equipment.longitude = event.longitude
    equipment.fuel_level = event.fuel_level
    equipment.engine_hours = event.engine_hours
    equipment.idle_hours_today = event.idle_hours

    # Only telemetry-driven "RUNNING/IDLE" nuance for already-rented equipment;
    # checkout/checkin remain the sole authority over AVAILABLE/RENTED/MAINTENANCE.
    if equipment.status == "RENTED" and event.status == "IDLE" and event.idle_hours > 2:
        pass  # surfaced as an alert, not a status change — see services/alerts.py

    db.commit()
    db.refresh(equipment)

    set_equipment_state(event.equipment_id, {
        "status": equipment.status,
        "latitude": equipment.latitude,
        "longitude": equipment.longitude,
        "fuel_level": equipment.fuel_level,
        "idle_hours_today": equipment.idle_hours_today,
        "health_score": equipment.health_score,
    })

    return equipment
