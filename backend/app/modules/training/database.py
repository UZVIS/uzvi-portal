import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# M6 Training Module:
# Uses the project DATABASE_URL when provided and falls back to
# the same local SQLite database used by the current project setup.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///uzvi_portal.db")


engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    } if "sqlite" in DATABASE_URL else {},
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """
    Provide a database session to M6 API routes and close it
    automatically after the request is completed.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()