from sqlalchemy.orm import Session
from models import Rental, Site, Equipment
from ml.forecast import generate_demand_forecast


def site_demand_forecast(db: Session, days: int = 7) -> dict:
    rentals = db.query(Rental).all()
    site_ids = [s.site_id for s in db.query(Site).all()]
    return generate_demand_forecast(rentals, site_ids, days=days)


def equipment_recommendations(db: Session) -> list[dict]:
    """
    Very deliberately simple: compare each site's forecasted demand against
    how many machines are currently idle/available there, and flag the
    biggest available-vs-needed gap. This is the "pre-position equipment"
    output described in the brief — swap in the trained XGBoost path in
    ml/forecast.py once there's enough real rental history.
    """
    forecast = site_demand_forecast(db)
    equipment = db.query(Equipment).all()

    idle_by_site = {}
    for e in equipment:
        if e.status in ("AVAILABLE", "IDLE") and e.site_id:
            idle_by_site.setdefault(e.site_id, []).append(e.equipment_id)

    if not forecast:
        return []

    busiest_site = max(forecast, key=lambda s: sum(forecast[s]))
    recommendations = []
    for site_id, idle_ids in idle_by_site.items():
        if site_id == busiest_site or not idle_ids:
            continue
        recommendations.append({
            "equipment_id": idle_ids[0],
            "from_site": site_id,
            "to_site": busiest_site,
            "reason": f"{busiest_site} shows the highest projected 7-day demand while {idle_ids[0]} sits idle at {site_id}.",
        })
    return recommendations
