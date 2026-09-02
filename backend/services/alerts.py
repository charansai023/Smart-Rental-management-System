from sqlalchemy.orm import Session
from models import Alert, Equipment
from ml.anomaly import rule_based_flags, anomaly_score
from services.rental import check_overdue_rentals


def _alert_exists_unacked(db: Session, equipment_id: str, kind: str) -> bool:
    return (
        db.query(Alert)
        .filter(Alert.equipment_id == equipment_id, Alert.kind == kind, Alert.acknowledged.is_(False))
        .first()
        is not None
    )


def raise_alert(db: Session, equipment_id: str, level: str, kind: str, title: str, body: str, anomaly_score: float = None) -> Alert | None:
    if _alert_exists_unacked(db, equipment_id, kind):
        return None  # don't spam duplicate alerts every tick
    alert = Alert(equipment_id=equipment_id, level=level, kind=kind, title=title, body=body)
    db.add(alert)
    db.commit()
    db.refresh(alert)

    if level == "critical":
        eq = db.get(Equipment, equipment_id)
        if eq and eq.current_operator_id:
            from models import Operator
            op = db.get(Operator, eq.current_operator_id)
            if op and op.email:
                from services.email import send_anomaly_email
                send_anomaly_email(
                    recipient_email=op.email,
                    equipment_id=eq.equipment_id,
                    equipment_type=eq.type,
                    site=eq.site_id or "Unknown",
                    operator_name=op.name,
                    alert_level=level,
                    alert_title=title,
                    alert_body=body,
                    anomaly_score=anomaly_score
                )
    return alert


def evaluate_equipment(db: Session, equipment: Equipment) -> list[Alert]:
    """Run rule checks + the anomaly model against one equipment's latest
    telemetry snapshot. Called after every telemetry ingest."""
    new_alerts = []
    has_op = equipment.current_operator_id is not None
    has_site = equipment.site_id is not None

    for flag in rule_based_flags(equipment.idle_hours_today, equipment.fuel_level, has_op, has_site):
        if flag == "excessive_idle":
            a = raise_alert(
                db, equipment.equipment_id, "warning", "idle",
                f"{equipment.equipment_id} excessive idle time",
                f"Idle {equipment.idle_hours_today:.1f} hrs today at site {equipment.site_id}.",
            )
        elif flag == "unassigned_equipment":
            a = raise_alert(
                db, equipment.equipment_id, "critical", "unassigned",
                f"{equipment.equipment_id} unassigned equipment misuse",
                f"Machine {equipment.equipment_id} is active/idling without an assigned site or operator.",
            )
        else:  # low_fuel
            a = raise_alert(
                db, equipment.equipment_id, "warning", "low_fuel",
                f"{equipment.equipment_id} low fuel",
                f"Fuel at {equipment.fuel_level:.0f}% while on active rental.",
            )
        if a:
            new_alerts.append(a)

    score = anomaly_score(equipment.idle_hours_today, equipment.fuel_level, equipment.engine_hours, has_op, has_site)
    if score >= 0.6:
        a = raise_alert(
            db, equipment.equipment_id, "critical", "anomaly",
            f"{equipment.equipment_id} usage anomaly detected",
            f"IsolationForest model detected telemetry anomaly (score {score:.2f}). Possible misuse or unassigned operation.",
            anomaly_score=score
        )
        if a:
            new_alerts.append(a)

    return new_alerts


def evaluate_overdue(db: Session) -> list[Alert]:
    """Run on a schedule (see main.py) rather than per-telemetry-event, since
    overdue status changes with the clock, not with a machine event."""
    new_alerts = []
    for rental in check_overdue_rentals(db):
        a = raise_alert(
            db, rental.equipment_id, "critical", "overdue",
            f"{rental.equipment_id} rental overdue",
            f"Rental {rental.rental_id} was due back {rental.expected_return_time:%d %b %Y} and has not been checked in.",
        )
        if a:
            new_alerts.append(a)
    return new_alerts
