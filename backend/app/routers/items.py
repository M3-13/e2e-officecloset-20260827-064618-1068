"""Wardrobe item routes.

Implements CRUD for a user's clothing items. Every operation authenticates via
``get_current_user`` and enforces ownership: an item that does not exist or
belongs to another user is answered with 404.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import ClothingItem, User
from ..schemas import KATEGORIEN, ClothingItemCreate, ClothingItemOut

router = APIRouter()

_IMAGE_URL_PREFIXES = ("http://", "https://")


def _validate_payload(payload: ClothingItemCreate) -> None:
    name = payload.name.strip()
    category = payload.category.strip()
    color = payload.color.strip()
    image_url = payload.image_url.strip()

    if not name:
        raise HTTPException(status_code=422, detail="name must not be empty")
    if not category:
        raise HTTPException(status_code=422, detail="category must not be empty")
    if category not in KATEGORIEN:
        raise HTTPException(status_code=422, detail="category must be one of KATEGORIEN")
    if not color:
        raise HTTPException(status_code=422, detail="color must not be empty")
    if not image_url.lower().startswith(_IMAGE_URL_PREFIXES):
        raise HTTPException(status_code=422, detail="image_url must start with http:// or https://")


def _get_owned_item(db: Session, item_id: int, current_user: User) -> ClothingItem:
    item = db.get(ClothingItem, item_id)
    if item is None or item.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/items", response_model=list[ClothingItemOut])
def list_items(
    category: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ClothingItemOut]:
    stmt = select(ClothingItem).where(ClothingItem.owner_id == current_user.id)
    if category is not None:
        stmt = stmt.where(ClothingItem.category == category)
    return list(db.scalars(stmt).all())


@router.post("/items", status_code=201, response_model=ClothingItemOut)
def create_item(
    payload: ClothingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItemOut:
    _validate_payload(payload)
    item = ClothingItem(
        name=payload.name.strip(),
        category=payload.category.strip(),
        color=payload.color.strip(),
        image_url=payload.image_url.strip(),
        owner_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=ClothingItemOut)
def update_item(
    item_id: int,
    payload: ClothingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ClothingItemOut:
    item = _get_owned_item(db, item_id, current_user)
    _validate_payload(payload)
    item.name = payload.name.strip()
    item.category = payload.category.strip()
    item.color = payload.color.strip()
    item.image_url = payload.image_url.strip()
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    item = _get_owned_item(db, item_id, current_user)
    db.delete(item)
    db.commit()
    return None
