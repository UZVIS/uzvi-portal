from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TicketCreate(BaseModel):
    raised_by: str
    category: str
    priority: str
    description: str
    assigned_to: Optional[str] = None


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

    class Config:
        from_attributes = True


class TicketStatusUpdate(BaseModel):
    status: str


class TicketCommentCreate(BaseModel):
    author_id: str
    comment: str


class TicketCommentResponse(BaseModel):
    comment_id: int
    ticket_id: int
    author_id: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True