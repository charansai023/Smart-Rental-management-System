from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class TelemetryLog(Base):
    """
    Append-only history of every telemetry event ingested from the simulator.
    Note: at real-world volume this table is the first candidate to move to
    TimescaleDB / a hypertable — Postgres is fine for demo/competition volume.
    """
    __tablename__ = "telemetry_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    latitude = Column(Float)
    longitude = Column(Float)
    fuel_level = Column(Float)
    engine_hours = Column(Float)
    idle_hours = Column(Float)
    status = Column(String)  # RUNNING | IDLE | OFF

    equipment = relationship("Equipment", back_populates="telemetry")
