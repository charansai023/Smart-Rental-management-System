from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Rental
from schemas.rental import CheckoutRequest, CheckinRequest, RentalOut
from services import rental as rental_service
from websocket.manager import manager

router = APIRouter(prefix="/rentals", tags=["rentals"])


@router.get("", response_model=list[RentalOut])
def list_rentals(db: Session = Depends(get_db)):
    rows = db.query(Rental).order_by(Rental.checkout_time.desc()).all()
    return [RentalOut.from_orm_with_status(r) for r in rows]


@router.post("/checkout", response_model=RentalOut)
async def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    """
    QR Scan -> POST here -> validate equipment/operator/site -> create rental
    -> equipment flips to RENTED -> broadcast to every connected dashboard.
    """
    try:
        rental = rental_service.checkout(db, req)
    except rental_service.RentalError as e:
        raise HTTPException(400, str(e))

    await manager.broadcast("rental_checkout", RentalOut.from_orm_with_status(rental).model_dump())
    return RentalOut.from_orm_with_status(rental)


@router.post("/checkin", response_model=RentalOut)
async def checkin(req: CheckinRequest, db: Session = Depends(get_db)):
    try:
        rental = rental_service.checkin(db, req)
    except rental_service.RentalError as e:
        raise HTTPException(400, str(e))

    await manager.broadcast("rental_checkin", RentalOut.from_orm_with_status(rental).model_dump())
    return RentalOut.from_orm_with_status(rental)
