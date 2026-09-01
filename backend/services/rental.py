import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models import Equipment, Rental, Operator, Site
from schemas.rental import CheckoutRequest, CheckinRequest


class RentalError(Exception):
    """Raised for any business-rule violation — the API layer turns this into a 400."""


def _parse_equipment_id(qr_code: str) -> str:
    # QR payload is "EQUIPMENT:EQX1001" (or a full URL in production, e.g.
    # https://app.catfleet360.com/equipment/EQX1001) — this handles either.
    if ":" in qr_code:
        return qr_code.split(":")[-1]
    return qr_code.rstrip("/").split("/")[-1]


def checkout(db: Session, req: CheckoutRequest) -> Rental:
    equipment_id = _parse_equipment_id(req.qr_code)

    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise RentalError(f"Equipment '{equipment_id}' does not exist.")

    if equipment.status != "AVAILABLE":
        raise RentalError(
            f"Cannot checkout — {equipment_id} is currently {equipment.status}."
        )

    if not db.get(Operator, req.operator_id):
        raise RentalError(f"Operator '{req.operator_id}' is not valid.")

    if not db.get(Site, req.site_id):
        raise RentalError(f"Site '{req.site_id}' is not valid.")

    now = datetime.utcnow()
    rental = Rental(
        rental_id="RN-" + uuid.uuid4().hex[:8].upper(),
        equipment_id=equipment_id,
        operator_id=req.operator_id,
        site_id=req.site_id,
        checkout_time=now,
        expected_return_time=now + timedelta(days=req.rental_days),
        checkin_time=None,
    )
    db.add(rental)

    equipment.status = "RENTED"
    equipment.current_operator_id = req.operator_id
    equipment.site_id = req.site_id
    equipment.idle_hours_today = 0.0

    db.commit()
    db.refresh(rental)
    return rental


def checkin(db: Session, req: CheckinRequest) -> Rental:
    equipment_id = _parse_equipment_id(req.qr_code)

    equipment = db.get(Equipment, equipment_id)
    if not equipment:
        raise RentalError(f"Equipment '{equipment_id}' does not exist.")

    rental = (
        db.query(Rental)
        .filter(Rental.equipment_id == equipment_id, Rental.checkin_time.is_(None))
        .order_by(Rental.checkout_time.desc())
        .first()
    )
    if not rental:
        raise RentalError(f"{equipment_id} is not currently checked out.")

    rental.checkin_time = datetime.utcnow()
    equipment.status = "AVAILABLE"
    equipment.current_operator_id = None
    equipment.idle_hours_today = 0.0

    db.commit()
    db.refresh(rental)
    return rental


def check_overdue_rentals(db: Session) -> list[Rental]:
    """Called on a schedule (see main.py startup task) to find rentals that
    just crossed their expected_return_time, so alerts.py can raise alerts."""
    now = datetime.utcnow()
    return (
        db.query(Rental)
        .filter(Rental.checkin_time.is_(None), Rental.expected_return_time < now)
        .all()
    )
