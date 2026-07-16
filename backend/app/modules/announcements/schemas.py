from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional


class AnnouncementBase(BaseModel):
    title: str = Field(..., description="Announcement headline")
    body: str = Field(..., description="Full announcement content")
    target_type: str = Field(
        ..., description="Audience scope: company_wide | team | role"
    )
    target_value: Optional[str] = Field(
        None,
        description="team_id or access_tier name; required when target_type is team/role",
    )
    requires_ack: bool = Field(
        default=False,
        description="Whether employees must acknowledge reading this announcement",
    )
    expiry_date: Optional[date] = Field(
        None, description="Date after which the announcement is auto-archived"
    )


class AnnouncementCreate(AnnouncementBase):
    posted_by: str = Field(
        ..., description="Employee ID of the poster (Admin/Leadership or Manager)"
    )


class AnnouncementResponse(AnnouncementBase):
    announcement_id: str
    posted_by: str
    status: str
    posted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnnouncementAckCreate(BaseModel):
    employee_id: str = Field(..., description="Employee acknowledging the announcement")


class AnnouncementAckResponse(BaseModel):
    id: str
    announcement_id: str
    employee_id: str
    acknowledged_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AcknowledgmentStatus(BaseModel):
    """One row per targeted employee, for the Admin ack-tracking view (FR-ANN-03)."""

    employee_id: str
    acknowledged: bool
    acknowledged_at: Optional[datetime] = None