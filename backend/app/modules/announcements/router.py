from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.announcements import service
from app.modules.announcements.schemas import (
    AnnouncementCreate,
    AnnouncementResponse,
    AnnouncementAckCreate,
    AnnouncementAckResponse,
    AcknowledgmentStatus,
)

router = APIRouter(
    prefix="/api/v1/announcements", tags=["M9 Announcements / Notice Board"]
)


@router.post("/", response_model=AnnouncementResponse, status_code=201)
def post_new_announcement(
    announcement_in: AnnouncementCreate, db: Session = Depends(get_db)
):
    try:
        return service.create_announcement(db, announcement_in)
    except service.PosterNotFound:
        raise HTTPException(status_code=404, detail="Posting employee not found.")
    except service.UnauthorizedPoster:
        raise HTTPException(
            status_code=403,
            detail="Only Admin/Leadership or Manager tiers may post announcements.",
        )
    except service.InvalidTargetType:
        raise HTTPException(
            status_code=422,
            detail="target_type must be one of: company_wide, team, role.",
        )
    except service.TargetValueRequired:
        raise HTTPException(
            status_code=422,
            detail="target_value is required when target_type is 'team' or 'role'.",
        )


@router.get("/", response_model=List[AnnouncementResponse])
def list_all_announcements_admin_view(db: Session = Depends(get_db)):
    return service.list_all_announcements(db)


@router.get("/feed/{employee_id}", response_model=List[AnnouncementResponse])
def list_announcements_for_employee(employee_id: str, db: Session = Depends(get_db)):
    try:
        return service.list_visible_announcements(db, employee_id)
    except service.EmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found.")


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def retrieve_announcement_by_id(announcement_id: str, db: Session = Depends(get_db)):
    announcement = service.get_announcement(db, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    return announcement


@router.post(
    "/{announcement_id}/acknowledge",
    response_model=AnnouncementAckResponse,
    status_code=201,
)
def acknowledge_announcement_by_employee(
    announcement_id: str, ack_in: AnnouncementAckCreate, db: Session = Depends(get_db)
):
    try:
        return service.acknowledge_announcement(
            db, announcement_id, ack_in.employee_id
        )
    except service.AnnouncementNotFound:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    except service.EmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found.")
    except service.AcknowledgmentNotRequired:
        raise HTTPException(
            status_code=422,
            detail="This announcement does not require acknowledgment.",
        )


@router.get(
    "/{announcement_id}/acknowledgment-status",
    response_model=List[AcknowledgmentStatus],
)
def view_acknowledgment_status(announcement_id: str, db: Session = Depends(get_db)):
    try:
        return service.get_acknowledgment_status(db, announcement_id)
    except service.AnnouncementNotFound:
        raise HTTPException(status_code=404, detail="Announcement not found.")