import os
import joblib
import numpy as np

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

IDLE_HOURS_ALERT_THRESHOLD = 5.0
LOW_FUEL_ALERT_THRESHOLD = 15.0

MODEL_PATH = os.path.join(os.path.dirname(__file__), "anomaly_model.joblib")
_model = None


def _get_model():
    global _model
    if _model is None and SKLEARN_AVAILABLE:
        if os.path.exists(MODEL_PATH):
            try:
                _model = joblib.load(MODEL_PATH)
            except Exception:
                _model = None

        if _model is None:
            rng = np.random.default_rng(42)
            normal = np.column_stack([
                rng.normal(3, 1.5, 500).clip(0, 12),     # idle hours
                rng.normal(60, 15, 500).clip(5, 100),    # fuel level
                rng.normal(6, 2, 500).clip(0, 16),       # engine hours
                np.ones(500),                             # has_op
                np.ones(500),                             # has_site
                rng.normal(0.3, 0.1, 500).clip(0, 1),    # idle_ratio
            ])
            _model = IsolationForest(contamination=0.10, random_state=42)
            _model.fit(normal)
    return _model


def rule_based_flags(idle_hours: float, fuel_level: float, has_operator: bool = True, has_site: bool = True) -> list[str]:
    flags = []
    if idle_hours > IDLE_HOURS_ALERT_THRESHOLD:
        flags.append("excessive_idle")
    if fuel_level < LOW_FUEL_ALERT_THRESHOLD:
        flags.append("low_fuel")
    if (not has_operator or not has_site) and idle_hours > 2.0:
        flags.append("unassigned_equipment")
    return flags


def anomaly_score(idle_hours: float, fuel_level: float, engine_hours_today: float, has_operator: bool = True, has_site: bool = True) -> float:
    """Returns a 0-1 anomaly score (1 = highly anomalous) using trained IsolationForest or heuristic fallback."""
    model = _get_model()
    if model is None:
        score = 0.0
        if idle_hours > IDLE_HOURS_ALERT_THRESHOLD:
            score += 0.4
        if fuel_level < LOW_FUEL_ALERT_THRESHOLD:
            score += 0.3
        if not has_operator or not has_site:
            score += 0.4
        return min(1.0, score)

    idle_ratio = idle_hours / (engine_hours_today + idle_hours + 1e-3)
    features = [[idle_hours, fuel_level, engine_hours_today, float(has_operator), float(has_site), idle_ratio]]

    try:
        raw = model.decision_function(features)[0]
        return float(max(0.0, min(1.0, 0.5 - raw)))
    except Exception:
        # Fallback if feature shape differs
        raw = model.decision_function([[idle_hours, fuel_level, engine_hours_today]])[0]
        return float(max(0.0, min(1.0, 0.5 - raw)))


def is_anomalous(idle_hours: float, fuel_level: float, engine_hours_today: float, has_operator: bool = True, has_site: bool = True, threshold: float = 0.6) -> bool:
    return anomaly_score(idle_hours, fuel_level, engine_hours_today, has_operator, has_site) >= threshold
