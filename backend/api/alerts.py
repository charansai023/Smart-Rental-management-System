from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Alert
from schemas.alert import AlertOut
from services.forecasting import site_demand_forecast, equipment_recommendations

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(acknowledged: bool | None = None, db: Session = Depends(get_db)):
    q = db.query(Alert).order_by(Alert.created_at.desc())
    if acknowledged is not None:
        q = q.filter(Alert.acknowledged == acknowledged)
    return q.all()


@router.post("/alerts/{alert_id}/ack", response_model=AlertOut)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found.")
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/forecast")
def get_forecast(db: Session = Depends(get_db)):
    return {
        "forecast_by_site": site_demand_forecast(db),
        "recommendations": equipment_recommendations(db),
    }
