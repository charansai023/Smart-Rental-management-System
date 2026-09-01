from pydantic import BaseModel


class TelemetryEvent(BaseModel):
    equipment_id: str
    latitude: float
    longitude: float
    fuel_level: float
    engine_hours: float
    idle_hours: float
    status: str   # RUNNING | IDLE | OFF
