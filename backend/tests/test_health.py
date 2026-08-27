"""Tests for the backend skeleton: health, stub wiring, auth decoding."""

import os
import time

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient
from jose import jwt

from app.config import get_jwt_secret
from app.db import Base, SessionLocal, engine
from app.deps import get_current_user
from app.main import app
from app.models import User
from app.schemas import KATEGORIEN


@pytest.fixture(scope="module", autouse=True)
def _prepare_db():
    Base.metadata.create_all(bind=engine)
    yield


def _make_token(user_id: int, expires_in: int = 600) -> str:
    return jwt.encode(
        {"sub": str(user_id), "exp": int(time.time()) + expires_in},
        get_jwt_secret(),
        algorithm="HS256",
    )


def test_health_returns_ok():
    with TestClient(app) as client:
        resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_kategorien_constant():
    assert KATEGORIEN == ["Oberteile", "Unterteile", "Kleider", "Schuhe", "Accessoires"]


def test_stub_routes_are_registered():
    cases = [
        ("POST", "/api/auth/register", {"email": "a@b.c", "password": "secret"}),
        ("POST", "/api/auth/login", {"email": "a@b.c", "password": "secret"}),
        ("GET", "/api/wardrobe/items", None),
        (
            "POST",
            "/api/wardrobe/items",
            {
                "name": "Blazer",
                "category": "Oberteile",
                "color": "schwarz",
                "image_url": "http://x/y.png",
            },
        ),
        (
            "PUT",
            "/api/wardrobe/items/1",
            {
                "name": "Blazer",
                "category": "Oberteile",
                "color": "schwarz",
                "image_url": "http://x/y.png",
            },
        ),
        ("DELETE", "/api/wardrobe/items/1", None),
        ("GET", "/api/outfits", None),
        ("POST", "/api/outfits", {"name": "Red Carpet", "item_ids": []}),
        ("GET", "/api/outfits/1", None),
        ("DELETE", "/api/outfits/1", None),
        ("DELETE", "/api/users/me", None),
    ]
    with TestClient(app) as client:
        for method, path, body in cases:
            resp = client.request(method, path, json=body)
            assert resp.status_code != 404, f"{method} {path} must be registered"


def test_protected_routes_reject_unauthenticated():
    protected = [
        ("GET", "/api/wardrobe/items"),
        ("GET", "/api/outfits"),
        ("DELETE", "/api/users/me"),
    ]
    with TestClient(app) as client:
        for method, path in protected:
            resp = client.request(method, path)
            assert resp.status_code == 401, f"{method} {path} should require auth"


def test_get_current_user_decodes_valid_token():
    with SessionLocal() as db:
        user = User(email="valid@example.com", hashed_password="hash")
        db.add(user)
        db.commit()
        db.refresh(user)

        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=_make_token(user.id))
        current = get_current_user(credentials=creds, db=db)
        assert current.id == user.id
        assert current.email == "valid@example.com"


def test_get_current_user_rejects_missing_credentials():
    with SessionLocal() as db:
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=None, db=db)
        assert exc.value.status_code == 401


def test_get_current_user_rejects_invalid_token():
    with SessionLocal() as db:
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="not.a.jwt")
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=creds, db=db)
        assert exc.value.status_code == 401


def test_get_current_user_rejects_expired_token():
    with SessionLocal() as db:
        user = User(email="expired@example.com", hashed_password="hash")
        db.add(user)
        db.commit()
        db.refresh(user)

        creds = HTTPAuthorizationCredentials(
            scheme="Bearer", credentials=_make_token(user.id, expires_in=-60)
        )
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=creds, db=db)
        assert exc.value.status_code == 401


def test_get_current_user_rejects_unknown_user():
    with SessionLocal() as db:
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=_make_token(999999))
        with pytest.raises(HTTPException) as exc:
            get_current_user(credentials=creds, db=db)
        assert exc.value.status_code == 401
