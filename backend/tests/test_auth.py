"""Tests for registration and login (auth)."""

import os
import time

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from jose import JWTError, jwt

from app.config import get_jwt_secret
from app.db import Base, SessionLocal, engine
from app.main import app
from app.models import User
from app.routers import auth as auth_router
from app.security import create_access_token


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    auth_router.reset_rate_limit_state()
    yield


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def test_register_returns_token(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "reg@example.com", "password": "password123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_token_decodes_to_user_id(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "decode@example.com", "password": "password123"},
    )
    token = resp.json()["access_token"]
    payload = jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "decode@example.com").first()
        assert payload["sub"] == str(user.id)


def test_register_stores_hashed_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "hash@example.com", "password": "password123"},
    )
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "hash@example.com").first()
        assert user is not None
        assert user.hashed_password != "password123"
        assert user.hashed_password.startswith("$2")


def test_register_duplicate_email_conflict(client):
    payload = {"email": "dup@example.com", "password": "password123"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_register_invalid_email(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "not-an-email", "password": "password123"},
    )
    assert resp.status_code == 400


def test_register_short_password(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "short@example.com", "password": "short"},
    )
    assert resp.status_code == 400


def test_login_success(client):
    client.post(
        "/api/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "wrong@example.com", "password": "password123"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_login_unknown_email(client):
    resp = client.post(
        "/api/auth/login",
        json={"email": "ghost@example.com", "password": "password123"},
    )
    assert resp.status_code == 401


def test_rate_limit_after_five_failures(client):
    client.post(
        "/api/auth/register",
        json={"email": "locked@example.com", "password": "password123"},
    )
    for _ in range(5):
        resp = client.post(
            "/api/auth/login",
            json={"email": "locked@example.com", "password": "wrong"},
        )
        assert resp.status_code == 401
    resp = client.post(
        "/api/auth/login",
        json={"email": "locked@example.com", "password": "wrong"},
    )
    assert resp.status_code == 429


def test_successful_login_does_not_count_toward_limit(client):
    client.post(
        "/api/auth/register",
        json={"email": "ok@example.com", "password": "password123"},
    )
    for _ in range(5):
        assert (
            client.post(
                "/api/auth/login",
                json={"email": "ok@example.com", "password": "password123"},
            ).status_code
            == 200
        )
    resp = client.post(
        "/api/auth/login",
        json={"email": "ok@example.com", "password": "password123"},
    )
    assert resp.status_code == 200


def test_token_lifetime_capped_at_15_minutes():
    token = create_access_token(1, expires_minutes=100)
    payload = jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    assert payload["sub"] == "1"
    assert payload["exp"] <= time.time() + 15 * 60 + 5


def test_expired_token_is_rejected():
    token = create_access_token(1, expires_minutes=-1)
    with pytest.raises(JWTError):
        jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
