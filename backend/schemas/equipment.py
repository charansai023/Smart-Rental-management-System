from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EquipmentOut(BaseModel):
    equipment_id: str
    type: str
    site_id: Optional[str]
    status: str
    qr_code: str
    current_operator_id: Optional[str]
    engine_hours: float
    idle_hours_today: float
    fuel_level: float
    health_score: float
    latitude: Optional[float]
    longitude: Optional[float]
    updated_at: datetime

    class Config:
        from_attributes = True
