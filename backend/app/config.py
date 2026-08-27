"""Application configuration, read lazily from the environment.

Every value has a working default so that a freshly cloned repository starts
without manual setup. Secrets are generated per-process when absent rather than
ever carrying a literal value in the repo.
"""

import os
import secrets

_jwt_secret: str | None = None


def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "sqlite:///./dev.db")


def get_jwt_secret() -> str:
    global _jwt_secret
    if _jwt_secret is None:
        _jwt_secret = os.environ.get("JWT_SECRET") or secrets.token_hex(32)
    return _jwt_secret


def get_jwt_expires_minutes() -> int:
    raw = os.environ.get("JWT_EXPIRES_MINUTES", "15")
    try:
        return int(raw)
    except ValueError:
        return 15


def get_cors_origin() -> str:
    return os.environ.get("CORS_ORIGIN", "http://localhost:5173")
