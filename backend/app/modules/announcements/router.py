from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status
)
from sqlalchemy.orm import Session

from app.database import get_db

from .service import AnnouncementService

from .schemas import (
    AnnouncementCreate,
    AnnouncementUpdate,
    AnnouncementResponse,
    AnnouncementAckCreate,
    AnnouncementAckResponse,
    PaginatedAnnouncements
)

router = APIRouter(
    prefix="/announcements",
    tags=["Announcements"]
)


def get_service(db: Session = Depends(get_db)):
    return AnnouncementService(db)


# --------------------------------------------------
# Create Announcement
# --------------------------------------------------

@router.post(
    "",
    response_model=AnnouncementResponse,
    status_code=status.HTTP_201_CREATED
)
def create_announcement(
    announcement: AnnouncementCreate,
    service: AnnouncementService = Depends(get_service)
):
    return service.create_announcement(announcement)


# --------------------------------------------------
# Update Announcement
# --------------------------------------------------

@router.put(
    "/{announcement_id}",
    response_model=AnnouncementResponse
)
def update_announcement(
    announcement_id: int,
    announcement: AnnouncementUpdate,
    service: AnnouncementService = Depends(get_service)
):
    return service.update_announcement(
        announcement_id,
        announcement
    )


# --------------------------------------------------
# Archive Announcement
# --------------------------------------------------

@router.patch(
    "/{announcement_id}/archive",
    response_model=AnnouncementResponse
)
def archive_announcement(
    announcement_id: int,
    service: AnnouncementService = Depends(get_service)
):
    return service.archive_announcement(
        announcement_id
    )


# --------------------------------------------------
# Delete Announcement
# --------------------------------------------------

@router.delete(
    "/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_announcement(
    announcement_id: int,
    service: AnnouncementService = Depends(get_service)
):

    service.delete_announcement(
        announcement_id
    )

    return None


# --------------------------------------------------
# Get Single Announcement
# --------------------------------------------------

@router.get(
    "/{announcement_id}",
    response_model=AnnouncementResponse
)
def get_announcement(
    announcement_id: int,
    service: AnnouncementService = Depends(get_service)
):

    return service.get_announcement(
        announcement_id
    )


# --------------------------------------------------
# List All Announcements
# --------------------------------------------------

@router.get(
    "",
    response_model=PaginatedAnnouncements
)
def list_announcements(

    page: int = Query(1, ge=1),

    size: int = Query(20, ge=1, le=100),

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.list_announcements(
        page,
        size
    )


# --------------------------------------------------
# Active Announcements
# --------------------------------------------------

@router.get(
    "/active/list",
    response_model=PaginatedAnnouncements
)
def active_announcements(

    page: int = Query(1, ge=1),

    size: int = Query(20, ge=1, le=100),

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.active_announcements(
        page,
        size
    )


# --------------------------------------------------
# Filter
# --------------------------------------------------

@router.get(
    "/filter/list",
    response_model=PaginatedAnnouncements
)
def filter_announcements(

    team: Optional[str] = None,

    role: Optional[str] = None,

    page: int = 1,

    size: int = 20,

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.filter_announcements(

        team=team,

        role=role,

        page=page,

        size=size

    )


# --------------------------------------------------
# Acknowledge Announcement
# --------------------------------------------------

@router.post(
    "/{announcement_id}/acknowledge",
    response_model=AnnouncementAckResponse
)
def acknowledge_announcement(

    announcement_id: int,

    ack: AnnouncementAckCreate,

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.acknowledge(

        announcement_id,

        ack.employee_id

    )


# --------------------------------------------------
# Acknowledgement List
# --------------------------------------------------

@router.get(
    "/{announcement_id}/acknowledgements",
    response_model=list[AnnouncementAckResponse]
)
def acknowledgement_list(

    announcement_id: int,

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.acknowledgement_list(
        announcement_id
    )


# --------------------------------------------------
# Pending Acknowledgements
# --------------------------------------------------

@router.get(
    "/employee/{employee_id}/pending",
    response_model=list[AnnouncementResponse]
)
def pending_announcements(

    employee_id: str,

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.pending_announcements(
        employee_id
    )


# --------------------------------------------------
# Dashboard Summary
# --------------------------------------------------

@router.get(
    "/dashboard/summary"
)
def dashboard_summary(

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.dashboard_summary()


# --------------------------------------------------
# Archive Expired Announcements
# --------------------------------------------------

@router.post(
    "/archive-expired"
)
def archive_expired(

    service: AnnouncementService = Depends(
        get_service
    )

):

    return service.archive_expired()