"""User account routes.

The real implementation lives in the 'Konto-Löschung (Backend)' ticket. This
stub declares the contract so every other ticket can build against the agreed
path, verb and response shape.
"""

from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_current_user
from ..models import User

router = APIRouter()


@router.delete("/me", status_code=204)
def delete_me(current_user: User = Depends(get_current_user)) -> None:
    raise HTTPException(status_code=501, detail="users ticket implements this")
