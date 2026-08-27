"""User account routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..deps import get_current_user
from ..models import User

router = APIRouter()


@router.delete("/me", status_code=204)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(current_user)
    db.commit()
