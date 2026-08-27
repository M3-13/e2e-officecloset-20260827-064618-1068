"""Tests for outfit routes: create, list, fetch, delete and ownership checks."""

import os
import time

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.config import get_jwt_secret
from app.db import Base, SessionLocal, engine
from app.main import app
from app.models import ClothingItem, User


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


def _create_user(email: str) -> int:
    with SessionLocal() as db:
        user = User(email=email, hashed_password="hash")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user.id


def _create_item(owner_id: int, name: str) -> int:
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
        return item.id


@pytest.fixture()
def two_users():
    owner = _create_user(f"owner_{os.urandom(4).hex()}@example.com")
    other = _create_user(f"other_{os.urandom(4).hex()}@example.com")
    return owner, other


def test_create_outfit_with_items(two_users):
    owner, _ = two_users
    item_a = _create_item(owner, "Blazer")
    item_b = _create_item(owner, "Hose")

    with TestClient(app) as client:
        resp = client.post(
            "/api/outfits",
            json={"name": "Red Carpet", "item_ids": [item_a, item_b]},
            headers=_auth(owner),
        )

    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Red Carpet"
    assert body["owner_id"] == owner
    assert {item["id"] for item in body["items"]} == {item_a, item_b}


def test_create_outfit_with_foreign_item_returns_404(two_users):
    owner, other = two_users
    foreign_item = _create_item(other, "Fremder Schuh")

    with TestClient(app) as client:
        resp = client.post(
            "/api/outfits",
            json={"name": "Gestohlen", "item_ids": [foreign_item]},
            headers=_auth(owner),
        )

    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


def test_create_outfit_with_missing_item_returns_404(two_users):
    owner, _ = two_users

    with TestClient(app) as client:
        resp = client.post(
            "/api/outfits",
            json={"name": "Geist", "item_ids": [999999]},
            headers=_auth(owner),
        )

    assert resp.status_code == 404


def test_list_outfits_returns_own_with_embedded_items(two_users):
    owner, _ = two_users
    item_a = _create_item(owner, "Blazer")
    item_b = _create_item(owner, "Hose")

    with TestClient(app) as client:
        client.post(
            "/api/outfits",
            json={"name": "Business", "item_ids": [item_a, item_b]},
            headers=_auth(owner),
        )
        resp = client.get("/api/outfits", headers=_auth(owner))

    assert resp.status_code == 200
    outfits = resp.json()
    assert len(outfits) == 1
    assert outfits[0]["name"] == "Business"
    assert {item["id"] for item in outfits[0]["items"]} == {item_a, item_b}


def test_list_outfits_excludes_other_users_outfits(two_users):
    owner, other = two_users
    other_item = _create_item(other, "Fremder Schuh")

    with TestClient(app) as client:
        client.post(
            "/api/outfits",
            json={"name": "Fremd", "item_ids": [other_item]},
            headers=_auth(other),
        )
        resp = client.get("/api/outfits", headers=_auth(owner))

    assert resp.status_code == 200
    assert resp.json() == []


def test_get_outfit_returns_own(two_users):
    owner, _ = two_users
    item = _create_item(owner, "Blazer")

    with TestClient(app) as client:
        created = client.post(
            "/api/outfits",
            json={"name": "Solo", "item_ids": [item]},
            headers=_auth(owner),
        )
        outfit_id = created.json()["id"]
        resp = client.get(f"/api/outfits/{outfit_id}", headers=_auth(owner))

    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == outfit_id
    assert body["name"] == "Solo"
    assert [i["id"] for i in body["items"]] == [item]


def test_get_foreign_outfit_returns_404(two_users):
    owner, other = two_users
    item = _create_item(owner, "Blazer")

    with TestClient(app) as client:
        created = client.post(
            "/api/outfits",
            json={"name": "Privat", "item_ids": [item]},
            headers=_auth(owner),
        )
        outfit_id = created.json()["id"]
        resp = client.get(f"/api/outfits/{outfit_id}", headers=_auth(other))

    assert resp.status_code == 404


def test_get_missing_outfit_returns_404(two_users):
    owner, _ = two_users

    with TestClient(app) as client:
        resp = client.get("/api/outfits/999999", headers=_auth(owner))

    assert resp.status_code == 404


def test_delete_outfit(two_users):
    owner, _ = two_users
    item = _create_item(owner, "Blazer")

    with TestClient(app) as client:
        created = client.post(
            "/api/outfits",
            json={"name": "Weg", "item_ids": [item]},
            headers=_auth(owner),
        )
        outfit_id = created.json()["id"]
        resp = client.delete(f"/api/outfits/{outfit_id}", headers=_auth(owner))

    assert resp.status_code == 204

    with TestClient(app) as client:
        assert client.get(f"/api/outfits/{outfit_id}", headers=_auth(owner)).status_code == 404


def test_delete_foreign_outfit_returns_404(two_users):
    owner, other = two_users
    item = _create_item(owner, "Blazer")

    with TestClient(app) as client:
        created = client.post(
            "/api/outfits",
            json={"name": "Privat", "item_ids": [item]},
            headers=_auth(owner),
        )
        outfit_id = created.json()["id"]
        resp = client.delete(f"/api/outfits/{outfit_id}", headers=_auth(other))

    assert resp.status_code == 404


def test_delete_missing_outfit_returns_404(two_users):
    owner, _ = two_users

    with TestClient(app) as client:
        resp = client.delete("/api/outfits/999999", headers=_auth(owner))

    assert resp.status_code == 404


def test_routes_reject_unauthenticated():
    with TestClient(app) as client:
        assert client.get("/api/outfits").status_code == 401
        assert client.post("/api/outfits", json={"name": "X", "item_ids": []}).status_code == 401
        assert client.get("/api/outfits/1").status_code == 401
        assert client.delete("/api/outfits/1").status_code == 401
