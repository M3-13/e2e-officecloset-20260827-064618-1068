"""Outfit routes.

A user can create named outfits from their own clothing items, list them,
fetch a single one and delete it. Every operation resolves the current user
through `get_current_user` and only ever touches outfits owned by that user;
any foreign or non-existent outfit id answers 404.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..db import get_db
from ..deps import get_current_user
from ..models import ClothingItem, Outfit, User
from ..schemas import OutfitCreate, OutfitOut

router = APIRouter()


def _get_own_outfit(outfit_id: int, user: User, db: Session) -> Outfit:
    outfit = db.get(Outfit, outfit_id)
    if outfit is None or outfit.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return outfit


@router.get("", response_model=list[OutfitOut])
def list_outfits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Outfit]:
    return list(
        db.execute(
            select(Outfit)
            .options(selectinload(Outfit.items))
            .where(Outfit.owner_id == current_user.id)
        ).scalars()
    )


@router.post("", status_code=201, response_model=OutfitOut)
def create_outfit(
    payload: OutfitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Outfit:
    item_ids = list(dict.fromkeys(payload.item_ids))

    items = (
        db.execute(
            select(ClothingItem)
            .where(ClothingItem.id.in_(item_ids))
            .where(ClothingItem.owner_id == current_user.id)
        )
        .scalars()
        .all()
    )
    found_ids = {item.id for item in items}
    for item_id in item_ids:
        if item_id not in found_ids:
            raise HTTPException(status_code=404, detail=f"Item {item_id} not found")

    outfit = Outfit(name=payload.name, owner_id=current_user.id)
    outfit.items = items
    db.add(outfit)
    db.commit()

    return db.execute(
        select(Outfit).options(selectinload(Outfit.items)).where(Outfit.id == outfit.id)
    ).scalar_one()


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Outfit:
    return _get_own_outfit(outfit_id, current_user, db)


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    outfit = _get_own_outfit(outfit_id, current_user, db)
    db.delete(outfit)
    db.commit()
