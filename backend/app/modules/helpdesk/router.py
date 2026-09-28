from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee
from app.modules.helpdesk import schemas, service
from app.modules.helpdesk.dependencies import get_current_employee, require_privileged

router = APIRouter(prefix="/api/v1/helpdesk", tags=["helpdesk"])


def _to_ticket_out(ticket) -> schemas.TicketOut:
    return schemas.TicketOut(
        ticket_id=ticket.ticket_id,
        raised_by=ticket.raised_by,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        assigned_to=ticket.assigned_to,
        description=ticket.description,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        sla_breached=service.is_sla_breached(ticket),
        comments=ticket.comments,
    )


@router.post("/tickets", response_model=schemas.TicketOut)
def create_ticket(
    payload: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    ticket = service.create_ticket(
        db, current_employee.employee_id, payload.category, payload.priority, payload.description
    )
    return _to_ticket_out(ticket)


# NOTE: "/tickets/me" and "/tickets/queue" are registered BEFORE the generic
# "/tickets/{ticket_id}" wildcard, per the route-ordering rule already
# learned in this project - a specific path must come before a wildcard.

@router.get("/tickets/me", response_model=list[schemas.TicketOut])
def list_my_tickets(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    tickets = service.list_my_tickets(db, current_employee.employee_id)
    return [_to_ticket_out(t) for t in tickets]


@router.get("/tickets/queue", response_model=list[schemas.TicketOut])
def list_queue(
    category: Optional[schemas.Category] = Query(default=None),
    priority: Optional[schemas.Priority] = Query(default=None),
    status: Optional[schemas.Status] = Query(default=None),
    min_age_hours: Optional[float] = Query(default=None, ge=0),
    db: Session = Depends(get_db),
    _: Employee = Depends(require_privileged),
):
    tickets = service.list_queue(db, category, priority, status, min_age_hours)
    return [_to_ticket_out(t) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    ticket = service.get_ticket_for_viewer(db, ticket_id, current_employee)
    return _to_ticket_out(ticket)


@router.patch("/tickets/{ticket_id}/status", response_model=schemas.TicketOut)
def update_status(
    ticket_id: int,
    payload: schemas.TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_privileged),
):
    ticket = service.update_status(db, ticket_id, payload.status, current_employee)
    return _to_ticket_out(ticket)


@router.patch("/tickets/{ticket_id}/assign", response_model=schemas.TicketOut)
def reassign_ticket(
    ticket_id: int,
    payload: schemas.TicketReassign,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_privileged),
):
    ticket = service.reassign_ticket(db, ticket_id, payload.assigned_to, current_employee)
    return _to_ticket_out(ticket)


@router.post("/tickets/{ticket_id}/comments", response_model=schemas.CommentOut)
def add_comment(
    ticket_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    return service.add_comment(db, ticket_id, current_employee, payload.comment)
