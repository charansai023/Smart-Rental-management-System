import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
from api import equipment, rental, telemetry, alerts as alerts_api
from websocket.routes import router as ws_router
from websocket.manager import manager
from services.alerts import evaluate_overdue

OVERDUE_CHECK_INTERVAL_SECONDS = int(os.getenv("OVERDUE_CHECK_INTERVAL_SECONDS", "60"))


async def overdue_checker_loop():
    """Background task: since 'overdue' is a function of the clock rather
    than a machine event, it can't be caught by the telemetry-triggered
    alert path — it has to be polled on a timer."""
    while True:
        await asyncio.sleep(OVERDUE_CHECK_INTERVAL_SECONDS)
        db = SessionLocal()
        try:
            new_alerts = evaluate_overdue(db)
            for alert in new_alerts:
                await manager.broadcast("new_alert", {
                    "id": alert.id, "equipment_id": alert.equipment_id,
                    "level": alert.level, "title": alert.title, "body": alert.body,
                })
        finally:
            db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    task = asyncio.create_task(overdue_checker_loop())
    yield
    task.cancel()


app = FastAPI(title="CatFleet360 API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(equipment.router)
app.include_router(rental.router)
app.include_router(telemetry.router)
app.include_router(alerts_api.router)
app.include_router(ws_router)


@app.get("/")
def root():
    return {"service": "CatFleet360 API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
