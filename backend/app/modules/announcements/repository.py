from datetime import date
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import desc

from .models import Announcement, AnnouncementAck
from .exceptions import (
    AnnouncementNotFoundException,
    AlreadyAcknowledgedException
)


class AnnouncementRepository:

    def __init__(self, db: Session):
        self.db = db

    # -------------------------
    # Create
    # -------------------------

    def create(self, announcement):

        db_obj = Announcement(**announcement.dict())

        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)

        return db_obj

    # -------------------------
    # Update
    # -------------------------

    def update(self, announcement_id: int, data):

        obj = self.get_by_id(announcement_id)

        update_data = data.dict(exclude_unset=True)

        for key, value in update_data.items():
            setattr(obj, key, value)

        self.db.commit()
        self.db.refresh(obj)

        return obj

    # -------------------------
    # Archive
    # -------------------------

    def archive(self, announcement_id: int):

        obj = self.get_by_id(announcement_id)

        obj.archived = True

        self.db.commit()
        self.db.refresh(obj)

        return obj

    # -------------------------
    # Delete (optional)
    # -------------------------

    def delete(self, announcement_id: int):

        obj = self.get_by_id(announcement_id)

        self.db.delete(obj)

        self.db.commit()

    # -------------------------
    # Get by ID
    # -------------------------

    def get_by_id(self, announcement_id: int):

        obj = (
            self.db.query(Announcement)
            .filter(
                Announcement.announcement_id == announcement_id
            )
            .first()
        )

        if not obj:
            raise AnnouncementNotFoundException()

        return obj

    # -------------------------
    # List
    # -------------------------

    def list_all(
        self,
        page: int = 1,
        size: int = 20
    ):

        query = (
            self.db.query(Announcement)
            .order_by(desc(Announcement.created_at))
        )

        total = query.count()

        items = (
            query.offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return {
            "page": page,
            "size": size,
            "total": total,
            "items": items
        }

    # -------------------------
    # Active Announcements
    # -------------------------

    def active_announcements(
        self,
        page=1,
        size=20
    ):

        today = date.today()

        query = (
            self.db.query(Announcement)
            .filter(
                Announcement.archived == False
            )
        )

        query = query.filter(
            (
                Announcement.expiry_date == None
            ) |
            (
                Announcement.expiry_date >= today
            )
        )

        query = query.order_by(
            desc(Announcement.created_at)
        )

        total = query.count()

        items = (
            query.offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return {
            "page": page,
            "size": size,
            "total": total,
            "items": items
        }

    # -------------------------
    # Filter
    # -------------------------

    def filter_announcements(

        self,

        team: Optional[str] = None,

        role: Optional[str] = None,

        page: int = 1,

        size: int = 20

    ):

        query = (
            self.db.query(Announcement)
            .filter(
                Announcement.archived == False
            )
        )

        if team:

            query = query.filter(
                (
                    Announcement.target_type == "company"
                )
                |
                (
                    (Announcement.target_type == "team")
                    &
                    (Announcement.target_value == team)
                )
            )

        if role:

            query = query.filter(
                (
                    Announcement.target_type == "company"
                )
                |
                (
                    (Announcement.target_type == "role")
                    &
                    (Announcement.target_value == role)
                )
            )

        query = query.order_by(
            desc(Announcement.created_at)
        )

        total = query.count()

        items = (
            query.offset((page - 1) * size)
            .limit(size)
            .all()
        )

        return {
            "page": page,
            "size": size,
            "total": total,
            "items": items
        }

    # -------------------------
    # Acknowledge
    # -------------------------

    def acknowledge(

        self,

        announcement_id: int,

        employee_id: str

    ):

        self.get_by_id(announcement_id)

        existing = (
            self.db.query(AnnouncementAck)
            .filter(
                AnnouncementAck.announcement_id == announcement_id,
                AnnouncementAck.employee_id == employee_id
            )
            .first()
        )

        if existing:
            raise AlreadyAcknowledgedException()

        ack = AnnouncementAck(

            announcement_id=announcement_id,

            employee_id=employee_id

        )

        self.db.add(ack)

        self.db.commit()

        self.db.refresh(ack)

        return ack

    # -------------------------
    # Get Acknowledgements
    # -------------------------

    def acknowledgements(
        self,
        announcement_id: int
    ):

        self.get_by_id(announcement_id)

        return (
            self.db.query(AnnouncementAck)
            .filter(
                AnnouncementAck.announcement_id == announcement_id
            )
            .order_by(
                AnnouncementAck.acknowledged_at.desc()
            )
            .all()
        )

    # -------------------------
    # Employee Pending
    # -------------------------

    def employee_pending(
        self,
        employee_id: str
    ):

        acknowledged = (
            self.db.query(
                AnnouncementAck.announcement_id
            )
            .filter(
                AnnouncementAck.employee_id == employee_id
            )
            .subquery()
        )

        return (
            self.db.query(Announcement)
            .filter(
                Announcement.requires_acknowledgement == True
            )
            .filter(
                Announcement.archived == False
            )
            .filter(
                ~Announcement.announcement_id.in_(acknowledged)
            )
            .order_by(
                desc(Announcement.created_at)
            )
            .all()
        )