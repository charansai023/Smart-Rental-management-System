from pydantic import BaseModel
from datetime import datetime


class AlertOut(BaseModel):
    id: int
    equipment_id: str
    level: str
    kind: str
    title: str
    body: str
    created_at: datetime
    acknowledged: bool

    class Config:
        from_attributes = True
