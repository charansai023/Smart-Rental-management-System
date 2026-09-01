import io
import qrcode
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Equipment
from schemas.equipment import EquipmentOut

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("", response_model=list[EquipmentOut])
def list_equipment(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Equipment)
    if status:
        q = q.filter(Equipment.status == status.upper())
    return q.all()


@router.get("/{equipment_id}", response_model=EquipmentOut)
def get_equipment(equipment_id: str, db: Session = Depends(get_db)):
    eq = db.get(Equipment, equipment_id)
    if not eq:
        raise HTTPException(404, f"Equipment '{equipment_id}' not found.")
    return eq


@router.get("/{equipment_id}/qr")
def get_equipment_qr(equipment_id: str, db: Session = Depends(get_db)):
    """Returns a PNG QR code encoding this equipment's QR payload — print it
    and stick it on the machine, or display it for the scanner demo."""
    eq = db.get(Equipment, equipment_id)
    if not eq:
        raise HTTPException(404, f"Equipment '{equipment_id}' not found.")

    img = qrcode.make(eq.qr_code)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
