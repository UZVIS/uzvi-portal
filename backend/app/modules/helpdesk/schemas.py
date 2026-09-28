from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator

Category = Literal["HR", "IT", "Facilities", "Other"]
Priority = Literal["High", "Medium", "Low"]
Status = Literal["Open", "In Progress", "Resolved", "Closed"]


class TicketCreate(BaseModel):
    category: Category
    priority: Priority
    description: str

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("description cannot be empty")
        return v


class TicketStatusUpdate(BaseModel):
    status: Status


class TicketReassign(BaseModel):
    assigned_to: str


class CommentCreate(BaseModel):
    comment: str

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("comment cannot be empty")
        return v


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    comment_id: int
    ticket_id: int
    author_id: str
    comment: str
    created_at: datetime


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: int
    raised_by: str
    category: Category
    priority: Priority
    status: Status
    assigned_to: Optional[str] = None
    description: str
    created_at: datetime
    updated_at: datetime
    sla_breached: bool
    comments: list[CommentOut] = []
