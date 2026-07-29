from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.modules.directory.models import Base


class Ticket(Base):
    """
    Stores helpdesk tickets raised by employees.
    """

    __tablename__ = "helpdesk_tickets"

    ticket_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    raised_by = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False,
    )

    category = Column(
        String,
        nullable=False,
    )

    priority = Column(
        String,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default="Open",
    )

    assigned_to = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=True,
    )

    description = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    comments = relationship(
        "TicketComment",
        back_populates="ticket",
        cascade="all, delete-orphan",
    )


class TicketComment(Base):
    """
    Stores comments and activity for a helpdesk ticket.
    """

    __tablename__ = "helpdesk_ticket_comments"

    comment_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    ticket_id = Column(
        Integer,
        ForeignKey("helpdesk_tickets.ticket_id"),
        nullable=False,
    )

    author_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False,
    )

    comment = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    ticket = relationship(
        "Ticket",
        back_populates="comments",
    )