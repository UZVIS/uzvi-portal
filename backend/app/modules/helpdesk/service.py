from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.modules.helpdesk.models import Ticket, TicketComment


def create_ticket(db: Session, ticket: Ticket):
    """
    Save a new helpdesk ticket.
    """
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_all_tickets(
    db: Session,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    min_age_hours: Optional[float] = None,
):
    """
    Return helpdesk tickets, optionally filtered by category, priority,
    status, and minimum age in hours (FR-HLP-05). Any filter left as None
    is not applied, so calling this with no arguments still returns every
    ticket exactly as before.
    """
    query = db.query(Ticket)

    if category:
        query = query.filter(Ticket.category == category)

    if priority:
        query = query.filter(Ticket.priority == priority)

    if status:
        query = query.filter(Ticket.status == status)

    tickets = query.all()

    if min_age_hours is not None:
        cutoff = datetime.utcnow() - timedelta(hours=min_age_hours)
        tickets = [t for t in tickets if t.created_at <= cutoff]

    return tickets


def get_ticket(db: Session, ticket_id: int):
    """
    Return a single helpdesk ticket with comments.
    """
    return (
        db.query(Ticket)
        .options(joinedload(Ticket.comments))
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )


def update_ticket(
    db: Session,
    ticket: Ticket,
    status: str,
    assigned_to: str | None,
):
    ticket.status = status
    ticket.assigned_to = assigned_to

    db.commit()
    db.refresh(ticket)

    return ticket


def add_comment(
    db: Session,
    comment: TicketComment,
):
    """
    Save a comment for a ticket.
    """
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment