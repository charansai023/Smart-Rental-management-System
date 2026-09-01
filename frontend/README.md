# CatFleet360 — Frontend

A React (Vite + Tailwind) implementation of the Stitch "Industrial Precision"
design system, wired live to the FastAPI backend in `../backend`.

## Pages

| Route | Page | Backend data used |
|---|---|---|
| `/` | Dashboard | `GET /equipment`, `GET /alerts`, `GET /forecast` |
| `/fleet` | Fleet Management | `GET /equipment`, `POST /rentals/checkout`, `POST /rentals/checkin` |
| `/fleet/:id` | Asset Detail | `GET /equipment/:id` (via list), `GET /telemetry/:id/history`, alerts |
| `/rentals` | Rental Management | `GET /rentals`, checkout/checkin |
| `/map` | Live Map | equipment lat/lng, `GET /alerts` |
| `/maintenance` | Maintenance | `GET /alerts`, equipment with `status=MAINTENANCE` |

All pages also subscribe to `/ws/dashboard` and update live as telemetry,
alerts, and checkouts/checkins are pushed from the backend.

## Notes on data not modeled by the backend

The backend has no `GET /sites` / `GET /operators` list endpoints and no
maintenance-schedule entity, so:
- Site/operator names are looked up from `src/lib/referenceData.js`, which
  mirrors `backend/seed_data.py`. Update both together if you reseed with
  different sites/operators.
- "Utilization %" is a derived proxy (`src/lib/format.js`,
  `deriveUtilization`) based on today's idle hours, since the backend doesn't
  track utilization directly.
- The Maintenance page is built from real alert data (`idle` / `low_fuel` /
  `anomaly` / `overdue` rules) and equipment in `MAINTENANCE` status, rather
  than a fabricated schedule table, since the backend doesn't model
  maintenance schedules, technicians, or due dates.
- The Live Map uses a small dependency-free lat/lng scatter renderer
  (`src/components/MiniMap.jsx`) rather than a paid map provider, so it runs
  with zero API keys.

## Run it

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend if not localhost:8000
npm run dev
```

Make sure the backend (see `../backend/README.md`) is running first —
`docker-compose up --build` from `../backend`, then the frontend at
`npm run dev` (default: http://localhost:5173).

## Build

```bash
npm run build   # outputs to dist/
npm run preview
```
