from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Equipment(Base):
    """
    Postgres holds the source of truth / history for equipment.
    The *current* fast-changing fields (lat/lng/fuel/status) are mirrored into
    Redis by services.tracking on every telemetry tick, so the dashboard/map
    reads from Redis and only falls back to Postgres if the cache is cold.
    """
    __tablename__ = "equipment"

    equipment_id = Column(String, primary_key=True)         # e.g. EQX1001
    type = Column(String, nullable=False)                    # Excavator / Crane / Bulldozer / Grader
    site_id = Column(String, ForeignKey("sites.site_id"), nullable=True)
    status = Column(String, nullable=False, default="AVAILABLE")  # AVAILABLE | RENTED | IDLE | MAINTENANCE
    qr_code = Column(String, unique=True, nullable=False)    # payload encoded in the printed QR
    current_operator_id = Column(String, ForeignKey("operators.operator_id"), nullable=True)

    engine_hours = Column(Float, default=0.0)
    idle_hours_today = Column(Float, default=0.0)
    fuel_level = Column(Float, default=100.0)
    health_score = Column(Float, default=100.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    site = relationship("Site")
    operator = relationship("Operator")
    rentals = relationship("Rental", back_populates="equipment")
    telemetry = relationship("TelemetryLog", back_populates="equipment")
