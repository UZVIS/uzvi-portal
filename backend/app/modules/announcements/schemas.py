from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, Field


class AnnouncementBase(BaseModel):

    title: str = Field(
        ...,
        min_length=3,
        max_length=200
    )

    body: str = Field(
        ...,
        min_length=5
    )

    target_type: str

    target_value: Optional[str] = None

    requires_acknowledgement: bool = False

    expiry_date: Optional[date] = None


class AnnouncementCreate(
    AnnouncementBase
):

    posted_by: str


class AnnouncementUpdate(BaseModel):

    title: Optional[str] = None

    body: Optional[str] = None

    target_type: Optional[str] = None

    target_value: Optional[str] = None

    requires_acknowledgement: Optional[
        bool
    ] = None

    expiry_date: Optional[
        date
    ] = None

    archived: Optional[
        bool
    ] = None


class AnnouncementResponse(
    AnnouncementBase
):

    announcement_id: int

    posted_by: str

    archived: bool

    created_at: datetime

    updated_at: datetime

    class Config:
        from_attributes = True


class AnnouncementAckCreate(
    BaseModel
):

    employee_id: str


class AnnouncementAckResponse(
    BaseModel
):

    id: int

    announcement_id: int

    employee_id: str

    acknowledged_at: datetime

    class Config:
        from_attributes = True


class PaginatedAnnouncements(
    BaseModel
):

    page: int

    size: int

    total: int

    items: List[
        AnnouncementResponse
    ]