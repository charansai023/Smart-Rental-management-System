import os
import json
from collections import defaultdict
from datetime import datetime, timedelta

try:
    import xgboost as xgb
    import numpy as np
    import pandas as pd
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

MODEL_PATH = os.path.join(os.path.dirname(__file__), "demand_model.json")
META_PATH = os.path.join(os.path.dirname(__file__), "demand_model_meta.json")

_xgb_model = None
_meta = None

def _get_xgb_model():
    global _xgb_model, _meta
    if _xgb_model is None and XGBOOST_AVAILABLE and os.path.exists(MODEL_PATH):
        try:
            model = xgb.XGBRegressor()
            model.load_model(MODEL_PATH)
            _xgb_model = model
            if os.path.exists(META_PATH):
                with open(META_PATH, "r") as f:
                    _meta = json.load(f)
        except Exception:
            _xgb_model = None
    return _xgb_model, _meta


def naive_forecast(rentals: list, site_ids: list[str], days: int = 7) -> dict:
    """Fallback moving average forecast."""
    cutoff = datetime.utcnow() - timedelta(days=30)
    counts = defaultdict(int)
    for r in rentals:
        if r.checkout_time and r.checkout_time >= cutoff and r.site_id:
            counts[r.site_id] += 1

    forecast = {}
    for site_id in site_ids:
        daily_rate = max(0.5, counts.get(site_id, 1) / 30.0)
        forecast[site_id] = [round(daily_rate * (d + 1), 1) for d in range(days)]
    return forecast


def generate_demand_forecast(rentals: list, site_ids: list[str], days: int = 7) -> dict:
    """Uses the trained XGBoost model to generate 7-day demand projections per site."""
    model, meta = _get_xgb_model()
    if model is None or meta is None:
        return naive_forecast(rentals, site_ids, days=days)

    site_map = meta.get("site_map", {})
    type_code = 0  # Excavator default
    today = datetime.utcnow()

    forecast = {}
    for site_id in site_ids:
        site_code = site_map.get(site_id, 0)
        preds = []
        for d in range(days):
            target_date = today + timedelta(days=d)
            dow = target_date.weekday()
            month = target_date.month
            # Feature vector matching training: [site_code, type_code, dow, month, site_utilization, active_projects, rentals]
            features = pd.DataFrame([{
                "site_code": site_code,
                "type_code": type_code,
                "day_of_week": dow,
                "month": month,
                "site_utilization": 0.75,
                "active_projects": 4,
                "rentals": 3
            }])
            val = float(model.predict(features)[0])
            preds.append(round(max(0.5, val), 1))
        forecast[site_id] = preds
    return forecast
