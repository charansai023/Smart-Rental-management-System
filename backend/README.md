# CatFleet360 — Backend

Real FastAPI + PostgreSQL + Redis + WebSocket backend implementing the Smart
Rental Tracking System architecture: QR check-in/out, simulated IoT
telemetry, real-time dashboard push, rule + ML-based alerts, and demand
forecasting. Pairs with the `catfleet360.html` front-end demo (or wire it
into a real React app hitting these same endpoints).

## Architecture

```
Python IoT Simulator ──POST /telemetry──▶ FastAPI ──┬─▶ PostgreSQL (history)
                                                      └─▶ Redis (current state)
                                                            │
                                          WebSocket /ws/dashboard
                                                            │
                                                            ▼
                                                   React / HTML Dashboard
```

- **PostgreSQL** — equipment, rentals (full history, never overwritten),
  sites, operators, telemetry log, alerts.
- **Redis** — "right now" cache: current lat/lng/status/fuel per machine,
  for fast map/dashboard reads without hitting Postgres.
- **WebSocket** — pushes checkout/checkin/telemetry/alert events to every
  connected dashboard the moment they happen.
- **ml/anomaly.py** — rule-based checks (idle hours, low fuel) plus an
  IsolationForest anomaly score.
- **ml/forecast.py** — naive moving-average forecast by default; an
  XGBoost path is stubbed in for when you have enough real rental history.

This follows the **modular monolith** layout from the design doc
(`api/`, `services/`, `models/`, `schemas/`, `ml/`, `websocket/`) rather than
separate microservices — same architecture story, one deployable unit.

## Quick start (Docker — recommended)

```bash
docker-compose up --build
```

This starts Postgres, Redis, and the API (seeded automatically) on
`http://localhost:8000`. Then in a second terminal, start the simulator:

```bash
pip install -r requirements.txt
python simulator/iot_simulator.py
```

## Quick start (no Docker)

1. Install Postgres and Redis locally (or point `.env` at hosted ones).
2. `cp .env.example .env` and edit `DATABASE_URL` / `REDIS_URL` if needed.
3. `pip install -r requirements.txt`
4. `python seed_data.py` — loads sites, operators, and the 7 equipment
   records + rental history from the challenge dataset.
5. `uvicorn main:app --reload` — API on `http://localhost:8000`.
6. In another terminal: `python simulator/iot_simulator.py`.

Interactive API docs: `http://localhost:8000/docs`.

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/equipment` | List all equipment + live status |
| GET | `/equipment/{id}/qr` | PNG QR code for one machine (print this) |
| POST | `/rentals/checkout` | QR scan → validate → create rental → equipment RENTED |
| POST | `/rentals/checkin` | QR scan → close rental → equipment AVAILABLE |
| GET | `/rentals` | Full rental history + live computed status |
| POST | `/telemetry` | Simulator posts GPS/fuel/engine/idle here |
| GET | `/alerts` | Active + past alerts |
| POST | `/alerts/{id}/ack` | Dismiss an alert |
| GET | `/forecast` | 7-day demand by site + reallocation recommendations |
| WS | `/ws/dashboard` | Live event stream for the dashboard |

## QR flow

Each equipment row has `qr_code = "EQUIPMENT:EQX1001"`. `GET
/equipment/EQX1001/qr` returns a scannable PNG. A phone camera (or the
front-end's `html5-qrcode` scanner) decodes that string and calls
`/rentals/checkout` or `/rentals/checkin` with it — the same validation
chain from the design doc runs every time: equipment exists → is
available → operator valid → site valid → rental created.

## Notes on the "3-hour build" tradeoffs

- **Kafka** was intentionally left out — WebSocket + direct service calls
  cover the demo's real-time needs without standing up a broker. The
  `services/` layer is structured so a Kafka producer/consumer could slot
  in between `api/telemetry.py` and `services/tracking.py` later without
  touching anything else.
- **TimescaleDB** — not used; `telemetry_log` is a plain Postgres table, as
  planned. It's the first table to move to Timescale if data volume grows.
- **XGBoost** — wired up but falls back to a naive moving average until
  there's enough rental history to train on meaningfully.
