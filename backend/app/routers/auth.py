"""Authentication routes (register / login) with per-client rate limiting."""

import re
import threading
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import Token, UserCreate
from ..security import create_access_token, hash_password, verify_password

router = APIRouter()

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_MIN_PASSWORD_LENGTH = 8
_MAX_PASSWORD_LENGTH = 72

# Per-client (IP) rate limiting on failed authentication attempts.
_RATE_WINDOW_SECONDS = 15 * 60
_RATE_MAX_FAILURES = 5
_failures: dict[str, list[float]] = defaultdict(list)
_failures_lock = threading.Lock()


def reset_rate_limit_state() -> None:
    """Clear all recorded failures (used by tests)."""
    with _failures_lock:
        _failures.clear()


def _client_ip(request: Request) -> str:
    if request.client is not None:
        return request.client.host
    return "unknown"


def _prune_failures(ip: str, now: float) -> list[float]:
    with _failures_lock:
        times = [t for t in _failures[ip] if now - t <= _RATE_WINDOW_SECONDS]
        _failures[ip] = times
        return list(times)


def _is_rate_limited(ip: str, now: float) -> bool:
    return len(_prune_failures(ip, now)) >= _RATE_MAX_FAILURES


def _record_failure(ip: str, now: float) -> None:
    with _failures_lock:
        _failures[ip] = [t for t in _failures[ip] if now - t <= _RATE_WINDOW_SECONDS]
        _failures[ip].append(now)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _validate_email(email: str) -> None:
    if not email or not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email address")


def _validate_password(password: str) -> None:
    if not password or not (_MIN_PASSWORD_LENGTH <= len(password) <= _MAX_PASSWORD_LENGTH):
        raise HTTPException(
            status_code=400,
            detail=f"Password must be between {_MIN_PASSWORD_LENGTH} and "
            f"{_MAX_PASSWORD_LENGTH} characters",
        )


@router.post("/register", status_code=201, response_model=Token)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)) -> Token:
    email = _normalize_email(payload.email)
    password = payload.password

    _validate_email(email)
    _validate_password(password)

    ip = _client_ip(request)
    if _is_rate_limited(ip, time.monotonic()):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    if db.query(User).filter(User.email == email).first() is not None:
        _record_failure(ip, time.monotonic())
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return Token(access_token=create_access_token(user.id), token_type="bearer")


@router.post("/login", response_model=Token)
def login(payload: UserCreate, request: Request, db: Session = Depends(get_db)) -> Token:
    email = _normalize_email(payload.email)
    password = payload.password

    ip = _client_ip(request)
    if _is_rate_limited(ip, time.monotonic()):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.hashed_password):
        _record_failure(ip, time.monotonic())
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return Token(access_token=create_access_token(user.id), token_type="bearer")
