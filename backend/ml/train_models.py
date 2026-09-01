"""
Synthetic Dataset Generator and ML Training Script for CatFleet360.
Generates comprehensive synthetic historical rental & telemetry datasets based on
the Caterpillar Smart Rental Tracking dataset, then trains:
  1. XGBoost Regressor for 7-day Demand Forecasting per site/equipment type.
  2. IsolationForest for Anomaly Detection (long idle hours, unassigned equipment, low fuel, misuse).
Saves trained models to disk for live backend inference.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

import xgboost as xgb
from sklearn.ensemble import IsolationForest
from sklearn.metrics import mean_squared_error, r2_score

SITES = ["S001", "S002", "S003", "S004", "S005", "S006"]
EQUIPMENT_TYPES = ["Excavator", "Crane", "Bulldozer", "Grader"]
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))


def generate_synthetic_rentals(n_samples: int = 1500) -> pd.DataFrame:
    """Generates synthetic rental history over 365 days across all sites and equipment types."""
    np.random.seed(42)
    start_date = datetime.utcnow() - timedelta(days=365)
    records = []

    # Base daily demand rates per site
    site_base_rates = {
        "S001": 2.5, "S002": 3.8, "S003": 4.2,
        "S004": 2.0, "S005": 3.1, "S006": 1.8
    }

    # Base demand multiplier per day of week (weekdays higher than weekends)
    dow_multipliers = [1.2, 1.3, 1.3, 1.2, 1.1, 0.6, 0.5]

    current_date = start_date
    while current_date < datetime.utcnow():
        dow = current_date.weekday()
        month = current_date.month

        for site_id in SITES:
            base = site_base_rates[site_id] * dow_multipliers[dow]
            # Seasonal factor (higher demand in Q2/Q3 construction season)
            seasonal = 1.2 if month in [4, 5, 6, 7, 8, 9] else 0.85
            expected_rentals = int(np.random.poisson(base * seasonal))

            for eq_type in EQUIPMENT_TYPES:
                # Share per type
                type_share = 0.4 if eq_type == "Excavator" else (0.3 if eq_type == "Bulldozer" else 0.15)
                type_rentals = int(np.round(expected_rentals * type_share))

                records.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "site_id": site_id,
                    "equipment_type": eq_type,
                    "day_of_week": dow,
                    "month": month,
                    "rentals": type_rentals,
                    "site_utilization": min(1.0, max(0.2, np.random.normal(0.75, 0.12))),
                    "active_projects": np.random.randint(1, 8),
                })
        current_date += timedelta(days=1)

    df = pd.DataFrame(records)
    # Compute target: 7-day forward rental sum
    df["target_7d_demand"] = df.groupby(["site_id", "equipment_type"])["rentals"].transform(
        lambda x: x.rolling(7, min_periods=1).sum().shift(-7)
    ).fillna(df["rentals"] * 5.0)

    return df


def generate_synthetic_telemetry(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generates synthetic telemetry logs modeling both normal operating conditions
    and challenge anomalies (unassigned idling, excessive idle, low fuel).
    """
    np.random.seed(42)

    # 85% normal operating data
    n_normal = int(n_samples * 0.85)
    normal_idle = np.random.normal(2.5, 1.0, n_normal).clip(0, 5)
    normal_fuel = np.random.normal(65, 18, n_normal).clip(20, 100)
    normal_engine = np.random.normal(6.5, 1.8, n_normal).clip(1, 14)
    normal_has_op = np.ones(n_normal)
    normal_has_site = np.ones(n_normal)

    # 15% anomalous data (unassigned machines idling, long idle hours like EQX1001/EQX1002/EQX1007)
    n_anomaly = n_samples - n_normal
    anomaly_idle = np.random.uniform(7.0, 14.0, n_anomaly)      # 7-14 idle hrs/day (EQX1001/1002/1007)
    anomaly_fuel = np.random.uniform(2.0, 15.0, n_anomaly)       # Low fuel
    anomaly_engine = np.random.uniform(0.0, 1.5, n_anomaly)      # 0-1.5 engine hrs/day
    # Half of anomalies are unassigned equipment (NULL site / NULL operator)
    anomaly_has_op = np.random.choice([0, 1], size=n_anomaly, p=[0.5, 0.5])
    anomaly_has_site = np.random.choice([0, 1], size=n_anomaly, p=[0.5, 0.5])

    idle_hours = np.concatenate([normal_idle, anomaly_idle])
    fuel_level = np.concatenate([normal_fuel, anomaly_fuel])
    engine_hours = np.concatenate([normal_engine, anomaly_engine])
    has_op = np.concatenate([normal_has_op, anomaly_has_op])
    has_site = np.concatenate([normal_has_site, anomaly_has_site])

    idle_ratio = idle_hours / (engine_hours + idle_hours + 1e-3)

    df = pd.DataFrame({
        "idle_hours": idle_hours,
        "fuel_level": fuel_level,
        "engine_hours": engine_hours,
        "has_operator": has_op,
        "has_site": has_site,
        "idle_ratio": idle_ratio,
        "is_anomaly_label": np.concatenate([np.zeros(n_normal), np.ones(n_anomaly)])
    })
    return df


def train_demand_model(df_rentals: pd.DataFrame):
    """Trains an XGBoost Regressor to forecast 7-day rental demand."""
    site_map = {site: i for i, site in enumerate(SITES)}
    type_map = {eq_type: i for i, eq_type in enumerate(EQUIPMENT_TYPES)}

    df_rentals["site_code"] = df_rentals["site_id"].map(site_map)
    df_rentals["type_code"] = df_rentals["equipment_type"].map(type_map)

    features = ["site_code", "type_code", "day_of_week", "month", "site_utilization", "active_projects", "rentals"]
    X = df_rentals[features]
    y = df_rentals["target_7d_demand"]

    split = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    r2 = r2_score(y_test, preds)

    print(f"[XGBoost Demand Model] Evaluation on Test Set:")
    print(f"  - RMSE: {rmse:.3f}")
    print(f"  - R^2 Score: {r2:.3f}")

    model_path = os.path.join(MODEL_DIR, "demand_model.json")
    model.save_model(model_path)
    print(f"  -> Saved XGBoost demand model to {model_path}")

    # Also save feature encoding maps
    meta_path = os.path.join(MODEL_DIR, "demand_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump({"site_map": site_map, "type_map": type_map, "features": features}, f, indent=2)
    print(f"  -> Saved metadata to {meta_path}")


def train_anomaly_model(df_telemetry: pd.DataFrame):
    """Trains an IsolationForest model for anomaly detection."""
    features = ["idle_hours", "fuel_level", "engine_hours", "has_operator", "has_site", "idle_ratio"]
    X = df_telemetry[features]

    model = IsolationForest(
        n_estimators=100,
        contamination=0.12,
        random_state=42
    )
    model.fit(X)

    # Evaluate against synthetic ground truth labels
    preds = model.predict(X)  # -1 = anomaly, 1 = normal
    pred_anomalies = (preds == -1).astype(int)
    accuracy = (pred_anomalies == df_telemetry["is_anomaly_label"]).mean()

    print(f"[IsolationForest Anomaly Model] Evaluation:")
    print(f"  - Anomaly Detection Accuracy: {accuracy * 100:.2f}%")
    print(f"  - Total Anomalies Flagged: {pred_anomalies.sum()} / {len(X)}")

    model_path = os.path.join(MODEL_DIR, "anomaly_model.joblib")
    joblib.dump(model, model_path)
    print(f"  -> Saved IsolationForest anomaly model to {model_path}")


if __name__ == "__main__":
    print("==================================================")
    print("Generating synthetic datasets & training ML models...")
    print("==================================================")
    df_rentals = generate_synthetic_rentals(n_samples=1500)
    print(f"Generated {len(df_rentals)} synthetic rental records.")

    df_telemetry = generate_synthetic_telemetry(n_samples=5000)
    print(f"Generated {len(df_telemetry)} synthetic telemetry records.")
    print("--------------------------------------------------")

    train_demand_model(df_rentals)
    print("--------------------------------------------------")
    train_anomaly_model(df_telemetry)
    print("==================================================")
    print("ML Model training complete successfully!")
