from datetime import date
from sqlalchemy.orm import Session

from .repository import AnnouncementRepository
from .constants import VALID_TARGETS
from .exceptions import (
    InvalidTargetException,
    AnnouncementExpiredException
)
from .schemas import (
    AnnouncementCreate,
    AnnouncementUpdate
)


class AnnouncementService:

    def __init__(self, db: Session):
        self.repository = AnnouncementRepository(db)

    # ----------------------------------
    # Validation
    # ----------------------------------

    def _validate_target(self, target_type: str):

        if target_type not in VALID_TARGETS:
            raise InvalidTargetException()

    def _validate_expiry(self, expiry_date):

        if expiry_date is None:
            return

        if expiry_date < date.today():
            raise AnnouncementExpiredException()

    # ----------------------------------
    # Create Announcement
    # ----------------------------------

    def create_announcement(
        self,
        announcement: AnnouncementCreate
    ):

        self._validate_target(
            announcement.target_type
        )

        self._validate_expiry(
            announcement.expiry_date
        )

        return self.repository.create(
            announcement
        )

    # ----------------------------------
    # Update Announcement
    # ----------------------------------

    def update_announcement(
        self,
        announcement_id: int,
        data: AnnouncementUpdate
    ):

        if data.target_type is not None:
            self._validate_target(
                data.target_type
            )

        if data.expiry_date is not None:
            self._validate_expiry(
                data.expiry_date
            )

        return self.repository.update(
            announcement_id,
            data
        )

    # ----------------------------------
    # Archive
    # ----------------------------------

    def archive_announcement(
        self,
        announcement_id: int
    ):

        return self.repository.archive(
            announcement_id
        )

    # ----------------------------------
    # Delete
    # ----------------------------------

    def delete_announcement(
        self,
        announcement_id: int
    ):

        return self.repository.delete(
            announcement_id
        )

    # ----------------------------------
    # Get Single
    # ----------------------------------

    def get_announcement(
        self,
        announcement_id: int
    ):

        return self.repository.get_by_id(
            announcement_id
        )

    # ----------------------------------
    # List
    # ----------------------------------

    def list_announcements(
        self,
        page=1,
        size=20
    ):

        return self.repository.list_all(
            page,
            size
        )

    # ----------------------------------
    # Active
    # ----------------------------------

    def active_announcements(
        self,
        page=1,
        size=20
    ):

        return self.repository.active_announcements(
            page,
            size
        )

    # ----------------------------------
    # Filter
    # ----------------------------------

    def filter_announcements(
        self,
        team=None,
        role=None,
        page=1,
        size=20
    ):

        return self.repository.filter_announcements(
            team=team,
            role=role,
            page=page,
            size=size
        )

    # ----------------------------------
    # Acknowledge
    # ----------------------------------

    def acknowledge(
        self,
        announcement_id: int,
        employee_id: str
    ):

        announcement = self.repository.get_by_id(
            announcement_id
        )

        if announcement.expiry_date:

            if announcement.expiry_date < date.today():
                raise AnnouncementExpiredException()

        return self.repository.acknowledge(
            announcement_id,
            employee_id
        )

    # ----------------------------------
    # Acknowledgement List
    # ----------------------------------

    def acknowledgement_list(
        self,
        announcement_id: int
    ):

        return self.repository.acknowledgements(
            announcement_id
        )

    # ----------------------------------
    # Pending Acknowledgements
    # ----------------------------------

    def pending_announcements(
        self,
        employee_id: str
    ):

        return self.repository.employee_pending(
            employee_id
        )

    # ----------------------------------
    # Auto Archive Expired
    # ----------------------------------

    def archive_expired(self):

        announcements = self.repository.list_all(
            page=1,
            size=100000
        )["items"]

        archived = []

        today = date.today()

        for announcement in announcements:

            if announcement.archived:
                continue

            if announcement.expiry_date is None:
                continue

            if announcement.expiry_date < today:

                announcement.archived = True

                self.repository.db.commit()

                archived.append(
                    announcement
                )

        return archived

    # ----------------------------------
    # Dashboard Counts
    # ----------------------------------

    def dashboard_summary(self):

        announcements = self.repository.list_all(
            page=1,
            size=100000
        )["items"]

        total = len(announcements)

        active = 0
        archived = 0
        requires_ack = 0

        today = date.today()

        for announcement in announcements:

            if announcement.archived:
                archived += 1
                continue

            if (
                announcement.expiry_date
                and
                announcement.expiry_date < today
            ):
                continue

            active += 1

            if announcement.requires_acknowledgement:
                requires_ack += 1

        return {
            "total": total,
            "active": active,
            "archived": archived,
            "requires_acknowledgement": requires_ack
        }