# CatFleet360 — Full Stack

Real-time industrial fleet / rental tracking app: FastAPI + PostgreSQL +
Redis + WebSocket backend, paired with a React frontend that replicates the
"Industrial Precision" (Cat-branded) Stitch design and talks to the backend
live.

```
catfleet360_fullstack/
├── backend/    FastAPI + Postgres + Redis + WebSocket API (as provided)
└── frontend/   React + Vite + Tailwind UI, wired to the backend above
```

## Run both together

**1. Backend** (from `backend/`):

```bash
cd backend
docker-compose up --build
```

This starts Postgres, Redis, and the API (auto-seeded) on
`http://localhost:8000`. In a second terminal, start the telemetry
simulator so equipment actually moves and alerts fire:

```bash
cd backend
pip install -r requirements.txt
python simulator/iot_simulator.py
```

No Docker? See the "no Docker" quick start in `backend/README.md`
(Postgres + Redis installed locally, then `python seed_data.py` and
`uvicorn main:app --reload`).

**2. Frontend** (from `frontend/`, in a third terminal):

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` and talks to the backend at
`http://localhost:8000` by default (`frontend/.env` →
`VITE_API_BASE_URL`). CORS is already open on the backend
(`allow_origins=["*"]`), so no extra config is needed for local dev.

## What's wired up live

- Every page pulls real data from the FastAPI REST endpoints on load.
- A single WebSocket connection to `/ws/dashboard` pushes telemetry ticks,
  new alerts, and checkout/check-in events into the UI as they happen —
  watch the Dashboard, Live Map, and Fleet pages update in real time while
  the simulator runs.
- QR checkout/check-in is real: the Fleet, Rental Management, and Asset
  Detail pages call `POST /rentals/checkout` and `POST /rentals/checkin`
  against the actual backend, flipping equipment status and creating rental
  rows exactly as the FastAPI app does.
- Alert acknowledgement (`POST /alerts/{id}/ack`) is real and used on the
  Live Map banner and the Maintenance page.

See `frontend/README.md` for the page-by-page data mapping and the couple
of places where the backend doesn't model something the design calls for
(site/operator names, "utilization", and maintenance schedules) and how the
frontend adapts to that honestly rather than faking a value.
