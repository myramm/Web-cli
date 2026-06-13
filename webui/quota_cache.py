"""Per-user quota snapshot cache (storage-backed)."""
import json
import time

from webui.storage.backend import USER_QUOTA_CACHE


def _storage():
    from webui.storage import get_storage
    return get_storage()


def load_cache(username: str) -> dict:
    raw = _storage().get_blob(username, USER_QUOTA_CACHE)
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def save_cache(username: str, data: dict) -> None:
    _storage().put_blob(username, USER_QUOTA_CACHE, json.dumps(data, indent=2))


def update_account_cache(username: str, msisdn: int, balance: dict | None, quotas: list | None) -> None:
    cache = load_cache(username)
    cache[str(msisdn)] = {
        "updated_at": int(time.time()),
        "balance": balance,
        "quotas": quotas,
    }
    save_cache(username, cache)