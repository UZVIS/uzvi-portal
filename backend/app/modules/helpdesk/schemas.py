from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TicketCreate(BaseModel):
    raised_by: str
    category: str
    priority: str
    description: str
    assigned_to: Optional[str] = None


class TicketCommentResponse(BaseModel):
    comment_id: int
    ticket_id: int
    author_id: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    ticket_id: int
    raised_by: str
    category: str
    priority: str
    status: str
    description: str
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime

    comments: list[TicketCommentResponse] = []

    # FR-HLP-06: true when the ticket is still open and has been sitting
    # longer than the configured SLA threshold for its priority.
    sla_breached: bool = False

    class Config:
        from_attributes = True


class TicketUpdate(BaseModel):
    status: str
    assigned_to: Optional[str] = None


class TicketCommentCreate(BaseModel):
    author_id: str
    comment: str