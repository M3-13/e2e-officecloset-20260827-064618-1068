"""Authentication routes (register / login).

The real implementation lives in the 'Registrierung und Login (Backend)'
ticket. These stubs declare the contract so every other ticket can build
against the agreed paths, verbs and request/response shapes.
"""

from fastapi import APIRouter, HTTPException

from ..schemas import Token, UserCreate

router = APIRouter()


@router.post("/register", status_code=201, response_model=Token)
def register(payload: UserCreate) -> Token:
    raise HTTPException(status_code=501, detail="auth ticket implements this")


@router.post("/login", response_model=Token)
def login(payload: UserCreate) -> Token:
    raise HTTPException(status_code=501, detail="auth ticket implements this")
