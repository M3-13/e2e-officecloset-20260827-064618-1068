"""Tests for account deletion (DELETE /api/users/me)."""

import os
import time

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.config import get_jwt_secret
from app.db import Base, SessionLocal, engine
from app.main import app
from app.models import ClothingItem, Outfit, User


@pytest.fixture(autouse=True)
def _prepare_db():
    Base.metadata.create_all(bind=engine)
    yield


def _make_token(user_id: int) -> str:
    return jwt.encode(
        {"sub": str(user_id), "exp": int(time.time()) + 600},
        get_jwt_secret(),
        algorithm="HS256",
    )


def _create_user_with_data() -> int:
    with SessionLocal() as db:
        user = User(email="delete@example.com", hashed_password="hash")
        db.add(user)
        db.flush()

        item = ClothingItem(
            name="Blazer",
            category="Oberteile",
            color="schwarz",
            image_url="http://x/y.png",
            owner_id=user.id,
        )
        db.add(item)
        db.flush()

        outfit = Outfit(name="Red Carpet", owner_id=user.id)
        outfit.items = [item]
        db.add(outfit)
        db.commit()

        return user.id


def test_delete_me_returns_204():
    user_id = _create_user_with_data()
    token = _make_token(user_id)

    with TestClient(app) as client:
        resp = client.delete("/api/users/me", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 204


def test_delete_me_removes_user_items_and_outfits_permanently():
    user_id = _create_user_with_data()
    token = _make_token(user_id)

    with TestClient(app) as client:
        resp = client.delete("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 204

    with SessionLocal() as db:
        assert db.get(User, user_id) is None
        assert db.query(ClothingItem).filter_by(owner_id=user_id).count() == 0
        assert db.query(Outfit).filter_by(owner_id=user_id).count() == 0


def test_login_fails_after_deletion():
    user_id = _create_user_with_data()
    token = _make_token(user_id)

    with TestClient(app) as client:
        assert (
            client.delete("/api/users/me", headers={"Authorization": f"Bearer {token}"}).status_code
            == 204
        )
        resp = client.delete("/api/users/me", headers={"Authorization": f"Bearer {token}"})

    assert resp.status_code == 401


def test_delete_me_requires_authentication():
    with TestClient(app) as client:
        resp = client.delete("/api/users/me")

    assert resp.status_code == 401
