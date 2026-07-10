"""
Shared DB connection/session setup (SQLite for V1).
Per docs/technical-setup-guide.md Section 3.

This is the ONE place that:
  - declares the SQLAlchemy `Base` every module's models.py inherits from
    (fixes the "separate Base problem" — see PR discussion)
  - creates the engine ONCE at import time, not per-request inside a router
  - exposes `get_db()` as the single dependency every router imports

No module should ever call `declarative_base()` itself, and no router
should ever call `create_engine()` itself.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

connect_args = (
    {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
