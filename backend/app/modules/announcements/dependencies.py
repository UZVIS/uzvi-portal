from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from .service import AnnouncementService


def get_announcement_service(
    db: Session = Depends(get_db)
) -> AnnouncementService:

    return AnnouncementService(db)