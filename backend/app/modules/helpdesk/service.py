from sqlalchemy.orm import Session

from app.modules.helpdesk.models import Ticket, TicketComment


def create_ticket(db: Session, ticket: Ticket):
    """
    Save a new helpdesk ticket.
    """
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_all_tickets(db: Session):
    """
    Return all helpdesk tickets.
    """
    return db.query(Ticket).all()


def get_ticket(db: Session, ticket_id: int):
    """
    Return a single helpdesk ticket.
    """
    return (
        db.query(Ticket)
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )


def update_ticket_status(
    db: Session,
    ticket: Ticket,
    status: str,
):
    """
    Update ticket status.
    """
    ticket.status = status

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