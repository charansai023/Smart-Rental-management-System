from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
from database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"), nullable=False)
    level = Column(String, nullable=False)      # "warning" | "critical"
    kind = Column(String, nullable=False)       # "overdue" | "idle" | "low_fuel" | "anomaly"
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged = Column(Boolean, default=False)
