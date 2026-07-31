from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee
from app.modules.helpdesk.dependencies import (
    PRIVILEGED_TIERS,
    get_current_employee,
)
from app.modules.helpdesk.models import Ticket, TicketComment
from app.modules.helpdesk.schemas import (
    TicketCommentCreate,
    TicketCommentResponse,
    TicketCreate,
    TicketResponse,
    TicketUpdate,
)
from app.modules.helpdesk.service import (
    add_comment,
    create_ticket,
    get_all_tickets,
    get_ticket,
    update_ticket,
)

router = APIRouter(
    prefix="/api/helpdesk",
    tags=["Helpdesk"],
)

# FR-HLP-02: default owner to auto-assign per category when the caller
# doesn't already specify one. Categories currently offered by the
# frontend (CreateTicketPage.tsx) are used as keys here; fill in real
# employee_ids as HR/IT/Facilities ownership is decided. A value of None
# leaves the ticket unassigned, same as today's behavior.
CATEGORY_DEFAULT_OWNERS: dict[str, Optional[str]] = {
    "Hardware": None,
    "Software": None,
    "Network": None,
    "Access": None,
    "Email": None,
    "Other": None,
}

# FR-HLP-06: SLA breach threshold in hours per priority. A priority not
# listed here falls back to DEFAULT_SLA_THRESHOLD_HOURS.
SLA_THRESHOLD_HOURS: dict[str, float] = {
    "High": 8,
    "Medium": 24,
    "Low": 72,
}
DEFAULT_SLA_THRESHOLD_HOURS = 24

# Statuses still considered "open" for SLA-breach purposes.
OPEN_STATUSES = {"Open", "In Progress"}


def _serialize_ticket(ticket: Ticket) -> TicketResponse:
    """
    Build a TicketResponse from a Ticket ORM object, computing the
    sla_breached flag (FR-HLP-06) instead of relying on a stored column.
    """
    threshold = SLA_THRESHOLD_HOURS.get(
        ticket.priority, DEFAULT_SLA_THRESHOLD_HOURS
    )
    age_hours = (
        datetime.utcnow() - ticket.created_at
    ).total_seconds() / 3600
    sla_breached = (
        ticket.status in OPEN_STATUSES and age_hours > threshold
    )

    return TicketResponse(
        ticket_id=ticket.ticket_id,
        raised_by=ticket.raised_by,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        description=ticket.description,
        assigned_to=ticket.assigned_to,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        comments=[
            TicketCommentResponse.model_validate(c)
            for c in ticket.comments
        ],
        sla_breached=sla_breached,
    )


@router.post(
    "/tickets",
    response_model=TicketResponse,
    status_code=201,
)
def create_helpdesk_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    ticket_data = ticket_in.model_dump()

    if not ticket_data.get("assigned_to"):
        ticket_data["assigned_to"] = CATEGORY_DEFAULT_OWNERS.get(
            ticket_data["category"]
        )

    ticket = Ticket(**ticket_data)
    ticket = create_ticket(db, ticket)
    return _serialize_ticket(ticket)


@router.get(
    "/tickets",
    response_model=list[TicketResponse],
)
def list_helpdesk_tickets(
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    min_age_hours: Optional[float] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    tickets = get_all_tickets(
        db,
        category=category,
        priority=priority,
        status=status,
        min_age_hours=min_age_hours,
    )

    if current_employee.access_tier not in PRIVILEGED_TIERS:
        tickets = [
            t for t in tickets
            if t.raised_by == current_employee.employee_id
        ]

    return [_serialize_ticket(t) for t in tickets]


@router.get(
    "/tickets/{ticket_id}",
    response_model=TicketResponse,
)
def get_helpdesk_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    ticket = get_ticket(db, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found.",
        )

    if (
        current_employee.access_tier not in PRIVILEGED_TIERS
        and current_employee.employee_id != ticket.raised_by
        and current_employee.employee_id != ticket.assigned_to
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view tickets you raised or are assigned to.",
        )

    return _serialize_ticket(ticket)


@router.patch(
    "/tickets/{ticket_id}/status",
    response_model=TicketResponse,
)
def change_ticket_status(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    ticket = get_ticket(db, ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found.",
        )

    if (
        current_employee.access_tier not in PRIVILEGED_TIERS
        and current_employee.employee_id != ticket.assigned_to
    ):
        raise HTTPException(
            status_code=403,
            detail="Only the assigned owner or an Admin/Manager/HR-Restricted account can update this ticket.",
        )

    updated = update_ticket(
        db,
        ticket,
        ticket_in.status,
        ticket_in.assigned_to,
    )
    return _serialize_ticket(updated)


@router.post(
    "/tickets/{ticket_id}/comments",
    response_model=TicketCommentResponse,
    status_code=201,
)
def create_ticket_comment(
    ticket_id: int,
    comment_in: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
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