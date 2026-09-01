from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CheckoutRequest(BaseModel):
    qr_code: str                      # decoded QR payload, e.g. "EQUIPMENT:EQX1001"
    operator_id: str
    site_id: str
    rental_days: int = 7              # how long the rental is expected to run


class CheckinRequest(BaseModel):
    qr_code: str


class RentalOut(BaseModel):
    rental_id: str
    equipment_id: str
    operator_id: Optional[str]
    site_id: Optional[str]
    checkout_time: datetime
    expected_return_time: datetime
    checkin_time: Optional[datetime]
    status: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_status(cls, rental):
        return cls(
            rental_id=rental.rental_id,
            equipment_id=rental.equipment_id,
            operator_id=rental.operator_id,
            site_id=rental.site_id,
            checkout_time=rental.checkout_time,
            expected_return_time=rental.expected_return_time,
            checkin_time=rental.checkin_time,
            status=rental.status,
        )
