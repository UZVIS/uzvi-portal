from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.helpdesk.models import Ticket, TicketComment
from app.modules.helpdesk.schemas import (
    TicketCommentCreate,
    TicketCommentResponse,
    TicketCreate,
    TicketResponse,
    TicketStatusUpdate,
)
from app.modules.helpdesk.service import (
    add_comment,
    create_ticket,
    get_all_tickets,
    get_ticket,
    update_ticket_status,
)

router = APIRouter(
    prefix="/api/helpdesk",
    tags=["Helpdesk"],
)


@router.post(
    "/tickets",
    response_model=TicketResponse,
    status_code=201,
)
def create_helpdesk_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
):
    ticket = Ticket(**ticket_in.model_dump())
    return create_ticket(db, ticket)


@router.get(
    "/tickets",
    response_model=list[TicketResponse],
)
def list_helpdesk_tickets(
    db: Session = Depends(get_db),
):
    return get_all_tickets(db)


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketResponse,
)
def get_helpdesk_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
):
    ticket = get_ticket(db, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found.",
        )

    return ticket


@router.patch(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse,
)
def change_ticket_status(
    ticket_id: int,
    status_in: TicketStatusUpdate,
    db: Session = Depends(get_db),
):
    ticket = get_ticket(db, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found.",
        )

    return update_ticket_status(
        db,
        ticket,
        status_in.status,
    )


@router.post(
    "/tickets/{ticket_id}/comments",
    response_model=TicketCommentResponse,
    status_code=201,
)
def create_ticket_comment(
    ticket_id: int,
    comment_in: TicketCommentCreate,
    db: Session = Depends(get_db),
):
    ticket = get_ticket(db, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found.",
        )

    comment = TicketComment(
        ticket_id=ticket_id,
        **comment_in.model_dump(),
    )

    return add_comment(
        db,
        comment,
    )