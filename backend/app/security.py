"""Password hashing (bcrypt) and JWT token creation (HS256)."""

from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt

from .config import get_jwt_expires_minutes, get_jwt_secret

# AC-11: tokens must never outlive 15 minutes, whatever JWT_EXPIRES_MINUTES says.
_MAX_TOKEN_MINUTES = 15


def hash_password(password: str) -> str:
    """Hash a plaintext password with bcrypt and return the hash as a string."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Return True if ``password`` matches the stored bcrypt ``hashed_password``."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str | int, expires_minutes: int | None = None) -> str:
    """Create a signed HS256 JWT with a ``sub`` and ``exp`` claim.

    The lifetime defaults to ``JWT_EXPIRES_MINUTES`` and is always capped at
    ``_MAX_TOKEN_MINUTES`` so no token outlives 15 minutes.
    """
    if expires_minutes is None:
        expires_minutes = get_jwt_expires_minutes()
    minutes = min(int(expires_minutes), _MAX_TOKEN_MINUTES)
    expire = datetime.now(UTC) + timedelta(minutes=minutes)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")
