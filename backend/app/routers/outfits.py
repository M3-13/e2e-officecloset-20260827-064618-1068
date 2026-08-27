"""Outfit routes.

The real implementation lives in the 'Outfit-Verwaltung (Backend)' ticket.
These stubs declare the contract so every other ticket can build against the
agreed paths, verbs and request/response shapes.
"""

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_current_user
from ..models import User
from ..schemas import OutfitCreate, OutfitOut

router = APIRouter()


@router.get("", response_model=list[OutfitOut])
def list_outfits(current_user: User = Depends(get_current_user)) -> list[OutfitOut]:
    raise HTTPException(status_code=501, detail="outfits ticket implements this")


@router.post("", status_code=201, response_model=OutfitOut)
def create_outfit(
    payload: OutfitCreate,
    current_user: User = Depends(get_current_user),
) -> OutfitOut:
    raise HTTPException(status_code=501, detail="outfits ticket implements this")


@router.get("/{outfit_id}", response_model=OutfitOut)
def get_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
) -> OutfitOut:
    raise HTTPException(status_code=501, detail="outfits ticket implements this")


@router.delete("/{outfit_id}", status_code=204)
def delete_outfit(
    outfit_id: int,
    current_user: User = Depends(get_current_user),
) -> None:
    raise HTTPException(status_code=501, detail="outfits ticket implements this")
