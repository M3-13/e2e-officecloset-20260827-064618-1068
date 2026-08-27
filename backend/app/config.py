"""Application configuration, read lazily from the environment.

Every value has a working default so that a freshly cloned repository starts
without manual setup. The JWT secret is generated once and persisted to a file
when absent, so it survives process restarts rather than ever carrying a literal
value in the repo.
"""

import os
import secrets
from contextlib import suppress
from pathlib import Path

_jwt_secret: str | None = None

_SECRET_FILE = Path(__file__).resolve().parent.parent / ".jwt_secret"


def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "sqlite:///./dev.db")


def get_jwt_secret() -> str:
    global _jwt_secret
    if _jwt_secret is None:
        _jwt_secret = _load_or_create_jwt_secret()
    return _jwt_secret


def _load_or_create_jwt_secret() -> str:
    env_secret = os.environ.get("JWT_SECRET")
    if env_secret:
        return env_secret
    try:
        existing = _SECRET_FILE.read_text(encoding="utf-8").strip()
        if existing:
            return existing
    except (FileNotFoundError, OSError):
        pass
    generated = secrets.token_hex(32)
    with suppress(OSError):
        _SECRET_FILE.write_text(generated, encoding="utf-8")
    return generated


def get_jwt_expires_minutes() -> int:
    raw = os.environ.get("JWT_EXPIRES_MINUTES", "15")
    try:
        return int(raw)
    except ValueError:
        return 15


def get_cors_origin() -> str:
    return os.environ.get("CORS_ORIGIN", "http://localhost:5173")
