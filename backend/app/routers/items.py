"""Wardrobe item routes.

The real implementation lives in the 'Kleidungsstück-Verwaltung (Backend)'
ticket. These stubs declare the contract so every other ticket can build
against the agreed paths, verbs and request/response shapes.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from ..deps import get_current_user
from ..models import User
from ..schemas import ClothingItemCreate, ClothingItemOut

router = APIRouter()


@router.get("/items", response_model=list[ClothingItemOut])
def list_items(
    category: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
) -> list[ClothingItemOut]:
    raise HTTPException(status_code=501, detail="items ticket implements this")


@router.post("/items", status_code=201, response_model=ClothingItemOut)
def create_item(
    payload: ClothingItemCreate,
    current_user: User = Depends(get_current_user),
) -> ClothingItemOut:
    raise HTTPException(status_code=501, detail="items ticket implements this")


@router.put("/items/{item_id}", response_model=ClothingItemOut)
def update_item(
    item_id: int,
    payload: ClothingItemCreate,
    current_user: User = Depends(get_current_user),
) -> ClothingItemOut:
    raise HTTPException(status_code=501, detail="items ticket implements this")


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
) -> None:
    raise HTTPException(status_code=501, detail="items ticket implements this")
