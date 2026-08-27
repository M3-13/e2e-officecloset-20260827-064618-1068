"""Tests for outfit management endpoints."""

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


def _auth(user_id: int) -> dict:
    return {"Authorization": f"Bearer {_make_token(user_id)}"}


def _create_user(email: str) -> User:
    with SessionLocal() as db:
        user = User(email=email, hashed_password="hash")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def _create_item(owner_id: int, name: str) -> ClothingItem:
    with SessionLocal() as db:
        item = ClothingItem(
            name=name,
            category="Oberteile",
            color="schwarz",
            image_url="http://x/y.png",
            owner_id=owner_id,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item


def _create_outfit(owner_id: int, name: str, item_ids: list[int]) -> Outfit:
    with SessionLocal() as db:
        items = db.query(ClothingItem).filter(ClothingItem.id.in_(item_ids)).all()
        outfit = Outfit(name=name, owner_id=owner_id, items=items)
        db.add(outfit)
        db.commit()
        db.refresh(outfit)
        return outfit


def test_create_outfit_with_item_ids():
    user = _create_user("create@example.com")
    item = _create_item(user.id, "Blazer")

    with TestClient(app) as client:
        resp = client.post(
            "/api/outfits",
            json={"name": "Büro", "item_ids": [item.id]},
            headers=_auth(user.id),
        )

    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Büro"
    assert body["owner_id"] == user.id
    assert [i["id"] for i in body["items"]] == [item.id]


def test_list_outfits_embeds_items():
    user = _create_user("list@example.com")
    item = _create_item(user.id, "Hemd")
    outfit = _create_outfit(user.id, "Leger", [item.id])

    with TestClient(app) as client:
        resp = client.get("/api/outfits", headers=_auth(user.id))

    assert resp.status_code == 200
    body = resp.json()
    ids = [o["id"] for o in body]
    assert outfit.id in ids
    mine = next(o for o in body if o["id"] == outfit.id)
    assert mine["name"] == "Leger"
    assert [i["id"] for i in mine["items"]] == [item.id]


def test_get_outfit():
    user = _create_user("get@example.com")
    item = _create_item(user.id, "Kleid")
    outfit = _create_outfit(user.id, "Abend", [item.id])

    with TestClient(app) as client:
        resp = client.get(f"/api/outfits/{outfit.id}", headers=_auth(user.id))

    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == outfit.id
    assert body["name"] == "Abend"
    assert [i["id"] for i in body["items"]] == [item.id]


def test_delete_outfit():
    user = _create_user("delete-outfit@example.com")
    outfit = _create_outfit(user.id, "Weg", [])

    with TestClient(app) as client:
        resp = client.delete(f"/api/outfits/{outfit.id}", headers=_auth(user.id))

    assert resp.status_code == 204

    with TestClient(app) as client:
        resp = client.get(f"/api/outfits/{outfit.id}", headers=_auth(user.id))
    assert resp.status_code == 404


def test_get_foreign_outfit_returns_404():
    owner = _create_user("owner@example.com")
    other = _create_user("other@example.com")
    outfit = _create_outfit(owner.id, "Geheim", [])

    with TestClient(app) as client:
        resp = client.get(f"/api/outfits/{outfit.id}", headers=_auth(other.id))

    assert resp.status_code == 404


def test_delete_foreign_outfit_returns_404():
    owner = _create_user("owner2@example.com")
    other = _create_user("other2@example.com")
    outfit = _create_outfit(owner.id, "Geheim2", [])

    with TestClient(app) as client:
        resp = client.delete(f"/api/outfits/{outfit.id}", headers=_auth(other.id))

    assert resp.status_code == 404

    with TestClient(app) as client:
        resp = client.get(f"/api/outfits/{outfit.id}", headers=_auth(owner.id))
    assert resp.status_code == 200


def test_create_outfit_with_foreign_item_returns_404():
    owner = _create_user("owner3@example.com")
    other = _create_user("other3@example.com")
    foreign_item = _create_item(owner.id, "Fremdes Teil")

    with TestClient(app) as client:
        resp = client.post(
            "/api/outfits",
            json={"name": "Unrechtmäßig", "item_ids": [foreign_item.id]},
            headers=_auth(other.id),
        )

    assert resp.status_code == 404


def test_list_outfits_only_own():
    owner = _create_user("owner4@example.com")
    other = _create_user("other4@example.com")
    own_outfit = _create_outfit(owner.id, "Mein", [])
    _create_outfit(other.id, "Seins", [])

    with TestClient(app) as client:
        resp = client.get("/api/outfits", headers=_auth(owner.id))

    assert resp.status_code == 200
    ids = [o["id"] for o in resp.json()]
    assert own_outfit.id in ids
    assert all(o["owner_id"] == owner.id for o in resp.json())


def test_outfits_require_auth():
    with TestClient(app) as client:
        assert client.get("/api/outfits").status_code == 401
        assert client.post("/api/outfits", json={"name": "X", "item_ids": []}).status_code == 401
        assert client.get("/api/outfits/1").status_code == 401
        assert client.delete("/api/outfits/1").status_code == 401
