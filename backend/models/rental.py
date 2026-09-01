from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Rental(Base):
    """
    Never overwritten and never updated in place for history — a new rental row
    is created on every checkout, and checkin_time is filled in on checkin.
    This preserves full rental history per machine, as required.
    """
    __tablename__ = "rentals"

    rental_id = Column(String, primary_key=True)             # e.g. RN-8930
    equipment_id = Column(String, ForeignKey("equipment.equipment_id"), nullable=False)
    operator_id = Column(String, ForeignKey("operators.operator_id"), nullable=True)
    site_id = Column(String, ForeignKey("sites.site_id"), nullable=True)

    checkout_time = Column(DateTime, nullable=False)
    expected_return_time = Column(DateTime, nullable=False)
    checkin_time = Column(DateTime, nullable=True)

    equipment = relationship("Equipment", back_populates="rentals")
    operator = relationship("Operator")
    site = relationship("Site")

    @property
    def status(self) -> str:
        """Computed, not stored — status is a function of time, so it can never drift out of sync."""
        from datetime import datetime
        if self.checkin_time:
            return "COMPLETED"
        now = datetime.utcnow()
        hours_left = (self.expected_return_time - now).total_seconds() / 3600
        if hours_left < 0:
            return "OVERDUE"
        if hours_left <= 48:
            return "ENDING_SOON"
        return "ACTIVE"
