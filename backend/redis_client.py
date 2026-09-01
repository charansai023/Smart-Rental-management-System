import os
import json
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
EQUIPMENT_STATE_PREFIX = "equipment:state:"

_in_memory_redis = {}
_r_client = None

try:
    _r_client = redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=1.0)
    _r_client.ping()
except Exception:
    _r_client = None


def set_equipment_state(equipment_id: str, state: dict):
    """Redis holds the 'right now' view: location, status, fuel — the fast path for the map/dashboard."""
    key = EQUIPMENT_STATE_PREFIX + equipment_id
    val = json.dumps(state)
    _in_memory_redis[key] = val
    if _r_client:
        try:
            _r_client.set(key, val)
        except Exception:
            pass


def get_equipment_state(equipment_id: str) -> dict | None:
    key = EQUIPMENT_STATE_PREFIX + equipment_id
    if _r_client:
        try:
            raw = _r_client.get(key)
            if raw:
                return json.loads(raw)
        except Exception:
            pass
    raw = _in_memory_redis.get(key)
    return json.loads(raw) if raw else None


def get_all_equipment_states() -> dict:
    if _r_client:
        try:
            keys = _r_client.keys(EQUIPMENT_STATE_PREFIX + "*")
            if keys:
                values = _r_client.mget(keys)
                return {
                    k.replace(EQUIPMENT_STATE_PREFIX, ""): json.loads(v)
                    for k, v in zip(keys, values) if v
                }
        except Exception:
            pass
    keys = [k for k in _in_memory_redis.keys() if k.startswith(EQUIPMENT_STATE_PREFIX)]
    return {
        k.replace(EQUIPMENT_STATE_PREFIX, ""): json.loads(_in_memory_redis[k])
        for k in keys if _in_memory_redis.get(k)
    }
