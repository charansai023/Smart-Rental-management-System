"""
Seeds the database with the reference data from the Caterpillar challenge
sheet: 6 sites, operators, all 7 equipment IDs, and their historical rentals.
Run once with: python seed_data.py
Safe to re-run — it skips rows that already exist.
"""
from datetime import datetime, timedelta

from database import Base, engine, SessionLocal
from models import Site, Operator, Equipment, Rental

Base.metadata.create_all(bind=engine)

SITES = [
    ("S001", "Bengaluru Yard", 12.9716, 77.5946),
    ("S002", "Chennai Site", 13.0827, 80.2707),
    ("S003", "Hyderabad Site", 17.3850, 78.4867),
    ("S004", "Pune Site", 18.5204, 73.8567),
    ("S005", "Mumbai Site", 19.0760, 72.8777),
    ("S006", "Nagpur Site", 21.1458, 79.0882),
]

OPERATORS = [
    ("OP101", "Ramesh Kumar"),
    ("OP106", "Arjun Rao"),
    ("OP114", "Vikram Singh"),
    ("OP203", "Suresh Nair"),
    ("OP301", "Manoj Patil"),
    ("OP401", "Divya Menon"),
    ("OP402", "Karthik Iyer"),
]

# From the challenge dataset sheet:
# Equipment ID, Type, Site ID, Check-Out, Check-In, Engine Hrs/Day, Idle Hrs/Day, Operating Days, Last Operator
EQUIPMENT_HISTORY = [
    ("EQX1001", "Excavator", "S003", "2025-04-01", "2025-04-16", 1.5, 10, 15, "OP101"),
    ("EQX1002", "Crane", None, "2025-03-10", "2025-03-30", 0, 11, 20, None),
    ("EQX1003", "Bulldozer", "S002", "2025-02-15", "2025-03-11", 7.5, 0.5, 25, "OP203"),
    ("EQX1004", "Excavator", "S004", "2025-05-05", "2025-05-15", 2, 9, 10, "OP106"),
    ("EQX1005", "Bulldozer", "S006", "2025-01-01", "2025-01-31", 8, 0, 30, "OP301"),
    ("EQX1006", "Grader", "S001", "2025-04-05", "2025-04-23", 3, 6, 18, "OP114"),
    ("EQX1007", "Excavator", None, "2025-03-20", "2025-04-01", 0, 12, 12, None),
]


def seed():
    db = SessionLocal()
    try:
        for site_id, name, lat, lng in SITES:
            if not db.get(Site, site_id):
                db.add(Site(site_id=site_id, name=name, latitude=lat, longitude=lng))

        for op_id, name in OPERATORS:
            if not db.get(Operator, op_id):
                db.add(Operator(operator_id=op_id, name=name))
        db.commit()

        for eq_id, eq_type, site_id, checkout, checkin, engine_hrs, idle_hrs, days, operator in EQUIPMENT_HISTORY:
            if not db.get(Equipment, eq_id):
                site = SITES[0]  # default fallback coordinates for unassigned equipment
                lat, lng = next(((s[2], s[3]) for s in SITES if s[0] == site_id), (12.90, 77.55))
                db.add(Equipment(
                    equipment_id=eq_id,
                    type=eq_type,
                    site_id=site_id,
                    status="AVAILABLE",
                    qr_code=f"EQUIPMENT:{eq_id}",
                    current_operator_id=None,
                    engine_hours=engine_hrs * days,
                    idle_hours_today=0.0,
                    fuel_level=70.0,
                    health_score=90.0,
                    latitude=lat,
                    longitude=lng,
                ))
        db.commit()

        for eq_id, eq_type, site_id, checkout, checkin, engine_hrs, idle_hrs, days, operator in EQUIPMENT_HISTORY:
            rental_id = f"RN-HIST-{eq_id}"
            if not db.get(Rental, rental_id):
                db.add(Rental(
                    rental_id=rental_id,
                    equipment_id=eq_id,
                    operator_id=operator,
                    site_id=site_id,
                    checkout_time=datetime.strptime(checkout, "%Y-%m-%d"),
                    expected_return_time=datetime.strptime(checkin, "%Y-%m-%d"),
                    checkin_time=datetime.strptime(checkin, "%Y-%m-%d"),
                ))
        db.commit()
        print(f"Seeded {len(SITES)} sites, {len(OPERATORS)} operators, "
              f"{len(EQUIPMENT_HISTORY)} equipment records and their rental history.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
