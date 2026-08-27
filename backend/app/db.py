"""Database engine, session factory and declarative base."""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import get_database_url

_database_url = get_database_url()

_engine_options: dict = {}
if _database_url.startswith("sqlite"):
    _engine_options["connect_args"] = {"check_same_thread": False}
    if ":memory:" in _database_url:
        # A single in-memory SQLite database shared across all connections.
        _engine_options["poolclass"] = StaticPool

engine = create_engine(_database_url, **_engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
