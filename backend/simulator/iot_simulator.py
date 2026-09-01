"""
Python IoT Simulator — the box at the top of the architecture diagram.
Generates GPS / fuel / engine-hours / idle-hours telemetry for every piece
of equipment and POSTs it to the FastAPI /telemetry endpoint on an interval,
exactly like a real fleet of onboard IoT units would.

Run with the backend already up:
    python simulator/iot_simulator.py
"""
import os
import time
import random
import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
TICK_SECONDS = 5

# In-memory per-equipment simulator state. In production the simulator
# wouldn't need to know about rentals — it just reports raw sensor values —
# but we mirror status here since checkout/checkin happens via the API,
# not the simulator, and only RENTED equipment should actually move.
STATE = {}


def fetch_equipment():
    resp = requests.get(f"{API_BASE_URL}/equipment", timeout=5)
    resp.raise_for_status()
    return resp.json()


def init_state(equipment_list):
    for eq in equipment_list:
        STATE[eq["equipment_id"]] = {
            "lat": eq["latitude"] or 12.97,
            "lng": eq["longitude"] or 77.59,
            "fuel": eq["fuel_level"] or 70.0,
            "engine_hours": eq["engine_hours"] or 0.0,
            "idle_hours": eq["idle_hours_today"] or 0.0,
        }


def tick_equipment(eq):
    eid = eq["equipment_id"]
    s = STATE.setdefault(eid, {"lat": eq["latitude"] or 12.97, "lng": eq["longitude"] or 77.59,
                                "fuel": 70.0, "engine_hours": 0.0, "idle_hours": 0.0})

    is_rented = eq["status"] == "RENTED"
    running = is_rented and random.random() < 0.85

    if running:
        s["lat"] += (random.random() - 0.5) * 0.01
        s["lng"] += (random.random() - 0.5) * 0.01
        s["engine_hours"] += 0.05
        s["fuel"] = max(3.0, s["fuel"] - random.random() * 0.3)
        s["idle_hours"] = max(0.0, s["idle_hours"] - 0.02)
        status = "RUNNING"
    elif is_rented:
        s["idle_hours"] += 0.05
        status = "IDLE"
    else:
        status = "OFF"

    return {
        "equipment_id": eid,
        "latitude": round(s["lat"], 5),
        "longitude": round(s["lng"], 5),
        "fuel_level": round(s["fuel"], 1),
        "engine_hours": round(s["engine_hours"], 2),
        "idle_hours": round(s["idle_hours"], 2),
        "status": status,
    }


def main():
    print(f"CatFleet360 IoT Simulator — posting telemetry to {API_BASE_URL}/telemetry every {TICK_SECONDS}s")
    while True:
        try:
            equipment_list = fetch_equipment()
            for eq in equipment_list:
                event = tick_equipment(eq)
                r = requests.post(f"{API_BASE_URL}/telemetry", json=event, timeout=5)
                if r.status_code != 200:
                    print(f"  ! {eq['equipment_id']} telemetry rejected: {r.text}")
            print(f"  tick: sent telemetry for {len(equipment_list)} units")
        except requests.exceptions.ConnectionError:
            print("  ! backend not reachable, retrying...")
        except Exception as e:
            print(f"  ! simulator error: {e}")
        time.sleep(TICK_SECONDS)


if __name__ == "__main__":
    main()
