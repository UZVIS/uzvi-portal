import pytest

from app.modules.announcements.service import (
    AnnouncementService
)

from app.modules.announcements.schemas import (
    AnnouncementCreate
)


def test_create_announcement(db):

    service = AnnouncementService(db)

    announcement = AnnouncementCreate(

        posted_by="EMP001",

        title="Holiday",

        body="Office closed tomorrow",

        target_type="company",

        target_value=None,

        requires_acknowledgement=False,

        expiry_date=None

    )

    created = service.create_announcement(
        announcement
    )

    assert created.title == "Holiday"


def test_get_announcement(db):

    service = AnnouncementService(db)

    announcement = AnnouncementCreate(

        posted_by="EMP001",

        title="Meeting",

        body="Monthly meeting",

        target_type="company"

    )

    created = service.create_announcement(
        announcement
    )

    fetched = service.get_announcement(
        created.announcement_id
    )

    assert fetched.announcement_id == created.announcement_id


def test_acknowledge(db):

    service = AnnouncementService(db)

    announcement = AnnouncementCreate(

        posted_by="EMP001",

        title="Security",

        body="Security Update",

        target_type="company",

        requires_acknowledgement=True

    )

    created = service.create_announcement(
        announcement
    )

    ack = service.acknowledge(

        created.announcement_id,

        "EMP100"

    )

    assert ack.employee_id == "EMP100"