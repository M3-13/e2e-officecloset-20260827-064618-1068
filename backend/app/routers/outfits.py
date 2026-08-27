"""Outfit routes: create, list, fetch and delete the current user's outfits."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..deps import get_current_user
from ..models import ClothingItem, Outfit, User
from ..schemas import OutfitCreate, OutfitOut

router = APIRouter()


def _get_own_outfit(db: Session, outfit_id: int, user_id: int) -> Outfit:
    outfit = (
        db.query(Outfit)
        .options(selectinload(Outfit.items))
        .filter(Outfit.id == outfit_id, Outfit.owner_id == user_id)
        .first()
    )
    if outfit is None:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return outfit


@router.get("", response_model=list[OutfitOut])
def list_outfits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OutfitOut]:
    return (
        db.query(Outfit)
        .options(selectinload(Outfit.items))
        .filter(Outfit.owner_id == current_user.id)
        .all()
    )


@router.post("", status_code=201, response_model=OutfitOut)
def create_outfit(
    payload: OutfitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OutfitOut:
    unique_ids = set(payload.item_ids)
    owned_items = (
        db.query(ClothingItem)
        .filter(
            ClothingItem.id.in_(unique_ids),
            ClothingItem.owner_id == current_user.id,
        )
        .all()
    )
    if len(owned_items) != len(unique_ids):
        raise HTTPException(status_code=404, detail="One or more items not found")

    outfit = Outfit(name=payload.name, owner_id=current_user.id, items=owned_items)
    db.add(outfit)
    db.commit()
    db.refresh(outfit)

    return _get_own_outfit(db, outfit.id, current_user.id)


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OutfitOut:
    return _get_own_outfit(db, outfit_id, current_user.id)


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    outfit = _get_own_outfit(db, outfit_id, current_user.id)
    db.delete(outfit)
    db.commit()
