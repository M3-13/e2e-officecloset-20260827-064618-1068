"""Pydantic schemas for requests and responses."""

from pydantic import BaseModel, ConfigDict

KATEGORIEN = ["Oberteile", "Unterteile", "Kleider", "Schuhe", "Accessoires"]


class UserCreate(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ClothingItemCreate(BaseModel):
    name: str
    category: str
    color: str
    image_url: str


class ClothingItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    color: str
    image_url: str
    owner_id: int


class OutfitCreate(BaseModel):
    name: str
    item_ids: list[int]


class OutfitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    items: list[ClothingItemOut]
    owner_id: int
