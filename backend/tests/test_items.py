"""Tests for wardrobe item management (CRUD, filtering, validation, ownership)."""

import os
import time

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.config import get_jwt_secret
from app.db import Base, SessionLocal, engine
from app.main import app
from app.models import User


@pytest.fixture(scope="module", autouse=True)
def _prepare_db():
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def _make_token(user_id: int, expires_in: int = 600) -> str:
    return jwt.encode(
        {"sub": str(user_id), "exp": int(time.time()) + expires_in},
        get_jwt_secret(),
        algorithm="HS256",
    )


def _auth_headers(user_id: int) -> dict:
    return {"Authorization": f"Bearer {_make_token(user_id)}"}


def _create_user(email: str) -> User:
    with SessionLocal() as db:
        user = User(email=email, hashed_password="hash")
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def _item_payload(**overrides) -> dict:
    payload = {
        "name": "Blazer",
        "category": "Oberteile",
        "color": "schwarz",
        "image_url": "http://example.com/blazer.png",
    }
    payload.update(overrides)
    return payload


def _create_item(client: TestClient, user_id: int, **overrides) -> dict:
    resp = client.post(
        "/api/wardrobe/items",
        json=_item_payload(**overrides),
        headers=_auth_headers(user_id),
    )
    assert resp.status_code == 201
    return resp.json()


def test_create_and_list_own_item(client):
    user = _create_user("create@example.com")
    created = _create_item(client, user.id, name="Blazer")
    assert created["id"] > 0
    assert created["owner_id"] == user.id
    assert created["name"] == "Blazer"

    resp = client.get("/api/wardrobe/items", headers=_auth_headers(user.id))
    assert resp.status_code == 200
    items = resp.json()
    assert any(i["id"] == created["id"] for i in items)


def test_list_returns_only_own_items(client):
    alice = _create_user("alice@example.com")
    bob = _create_user("bob@example.com")
    _create_item(client, alice.id, name="Alice Blazer")
    _create_item(client, bob.id, name="Bob Hemd")

    resp = client.get("/api/wardrobe/items", headers=_auth_headers(alice.id))
    assert resp.status_code == 200
    names = {i["name"] for i in resp.json()}
    assert "Alice Blazer" in names
    assert "Bob Hemd" not in names


def test_category_filter(client):
    user = _create_user("filter@example.com")
    _create_item(client, user.id, name="Hemd", category="Oberteile")
    _create_item(client, user.id, name="Jeans", category="Unterteile")

    resp = client.get(
        "/api/wardrobe/items",
        params={"category": "Unterteile"},
        headers=_auth_headers(user.id),
    )
    assert resp.status_code == 200
    names = {i["name"] for i in resp.json()}
    assert names == {"Jeans"}


def test_update_item(client):
    user = _create_user("update@example.com")
    created = _create_item(client, user.id)

    resp = client.put(
        f"/api/wardrobe/items/{created['id']}",
        json=_item_payload(name="Neuer Blazer", color="blau"),
        headers=_auth_headers(user.id),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Neuer Blazer"
    assert body["color"] == "blau"
    assert body["id"] == created["id"]


def test_delete_item(client):
    user = _create_user("delete-item@example.com")
    created = _create_item(client, user.id)

    resp = client.delete(f"/api/wardrobe/items/{created['id']}", headers=_auth_headers(user.id))
    assert resp.status_code == 204

    resp = client.get("/api/wardrobe/items", headers=_auth_headers(user.id))
    assert resp.status_code == 200
    assert all(i["id"] != created["id"] for i in resp.json())


@pytest.mark.parametrize("image_url", ["javascript:alert(1)", "data:text/html,x", "ftp://x/y.png"])
def test_image_url_protocol_rejected(client, image_url):
    user = _create_user(f"url-{abs(hash(image_url))}@example.com")
    resp = client.post(
        "/api/wardrobe/items",
        json=_item_payload(image_url=image_url),
        headers=_auth_headers(user.id),
    )
    assert resp.status_code == 422


@pytest.mark.parametrize("image_url", ["http://x/y.png", "https://x/y.png"])
def test_image_url_protocol_accepted(client, image_url):
    user = _create_user(f"ok-{abs(hash(image_url))}@example.com")
    resp = client.post(
        "/api/wardrobe/items",
        json=_item_payload(image_url=image_url),
        headers=_auth_headers(user.id),
    )
    assert resp.status_code == 201


def test_create_rejects_blank_fields_and_bad_category(client):
    user = _create_user("blank@example.com")
    for overrides in (
        {"name": "   "},
        {"color": ""},
        {"category": "Muetzen"},
    ):
        resp = client.post(
            "/api/wardrobe/items",
            json=_item_payload(**overrides),
            headers=_auth_headers(user.id),
        )
        assert resp.status_code == 422, overrides


def test_foreign_access_returns_404(client):
    alice = _create_user("alice-f@example.com")
    bob = _create_user("bob-f@example.com")
    created = _create_item(client, alice.id)

    resp = client.put(
        f"/api/wardrobe/items/{created['id']}",
        json=_item_payload(),
        headers=_auth_headers(bob.id),
    )
    assert resp.status_code == 404

    resp = client.delete(f"/api/wardrobe/items/{created['id']}", headers=_auth_headers(bob.id))
    assert resp.status_code == 404


def test_nonexistent_id_returns_404(client):
    user = _create_user("missing@example.com")
    resp = client.put(
        "/api/wardrobe/items/999999",
        json=_item_payload(),
        headers=_auth_headers(user.id),
    )
    assert resp.status_code == 404

    resp = client.delete("/api/wardrobe/items/999999", headers=_auth_headers(user.id))
    assert resp.status_code == 404


def test_unauthenticated_rejected(client):
    resp = client.get("/api/wardrobe/items")
    assert resp.status_code == 401
    resp = client.post("/api/wardrobe/items", json=_item_payload())
    assert resp.status_code == 401
