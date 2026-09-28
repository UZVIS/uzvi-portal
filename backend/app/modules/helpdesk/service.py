from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.modules.directory.models import Employee
from app.modules.helpdesk.dependencies import PRIVILEGED_TIERS
from app.modules.helpdesk.models import Ticket, TicketComment

# FR-HLP-02: category -> eligible assignment tier. IT confirmed explicitly
# to Admin/Leadership. HR routes to the HR-Restricted tier since a
# dedicated tier with a matching name already exists for it - routing HR
# tickets anywhere else would ignore a signal the system already gives us.
# Facilities and Other have no dedicated tier, so they fall to
# Admin/Leadership - the same "no dedicated tier -> Admin/Leadership" rule
# this team already applied to IT tasks in the Onboarding module.
CATEGORY_ASSIGNMENT_TIER = {
    "IT": "Admin/Leadership",
    "HR": "HR-Restricted",
    "Facilities": "Admin/Leadership",
    "Other": "Admin/Leadership",
}

# FR-HLP-06: SLA breach thresholds, confirmed per priority.
SLA_HOURS = {"High": 8, "Medium": 24, "Low": 72}

# "Open" for workload-counting and SLA purposes means "not yet finished" -
# Resolved/Closed tickets don't count against someone's live workload and
# can't be SLA-breached (the clock stops once the matter is resolved).
UNRESOLVED_STATUSES = {"Open", "In Progress"}

ALLOWED_TRANSITIONS = {
    "Open": {"In Progress"},
    "In Progress": {"Resolved"},
    "Resolved": {"In Progress", "Closed"},  # In Progress = reopen
    "Closed": set(),  # terminal - a wrongly-closed matter becomes a new ticket
}


def _pick_assignee(db: Session, category: str) -> Optional[str]:
    tier = CATEGORY_ASSIGNMENT_TIER.get(category)
    if tier is None:
        return None

    eligible = (
        db.query(Employee)
        .filter(Employee.access_tier == tier, Employee.employment_status == "active")
        .order_by(Employee.employee_id)
        .all()
    )
    if not eligible:
        return None

    best_employee_id = None
    best_count = None
    for employee in eligible:
        open_count = (
            db.query(Ticket)
            .filter(
                Ticket.assigned_to == employee.employee_id,
                Ticket.status.in_(UNRESOLVED_STATUSES),
            )
            .count()
        )
        if best_count is None or open_count < best_count:
            best_count = open_count
            best_employee_id = employee.employee_id
        # ties broken by iterating in employee_id order and using strict
        # less-than above, so the first (alphabetically lowest id) wins.

    return best_employee_id


def create_ticket(db: Session, raised_by: str, category: str, priority: str, description: str) -> Ticket:
    ticket = Ticket(
        raised_by=raised_by,
        category=category,
        priority=priority,
        description=description,
        status="Open",
        assigned_to=_pick_assignee(db, category),
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_ticket(db: Session, ticket_id: int) -> Ticket:
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.comments))
        .filter(Ticket.ticket_id == ticket_id)
        .first()
    )
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    return ticket


def get_ticket_for_viewer(db: Session, ticket_id: int, viewer: Employee) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    is_privileged = viewer.access_tier in PRIVILEGED_TIERS
    if ticket.raised_by != viewer.employee_id and not is_privileged:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own tickets.",
        )
    return ticket


def list_my_tickets(db: Session, employee_id: str) -> list[Ticket]:
    return (
        db.query(Ticket)
        .options(joinedload(Ticket.comments))
        .filter(Ticket.raised_by == employee_id)
        .order_by(Ticket.created_at.desc())
        .all()
    )


def list_queue(
    db: Session,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    min_age_hours: Optional[float] = None,
) -> list[Ticket]:
    # FR-HLP-05: filterable by category, priority, and age.
    query = db.query(Ticket).options(joinedload(Ticket.comments))
    if category is not None:
        query = query.filter(Ticket.category == category)
    if priority is not None:
        query = query.filter(Ticket.priority == priority)
    if status is not None:
        query = query.filter(Ticket.status == status)
    if min_age_hours is not None:
        cutoff = datetime.utcnow() - timedelta(hours=min_age_hours)
        query = query.filter(Ticket.created_at <= cutoff)
    return query.order_by(Ticket.created_at.asc()).all()


def update_status(db: Session, ticket_id: int, new_status: str, actor: Employee) -> Ticket:
    ticket = get_ticket(db, ticket_id)
    allowed_next = ALLOWED_TRANSITIONS.get(ticket.status, set())
    if new_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move a ticket from '{ticket.status}' to '{new_status}'.",
        )

    old_status = ticket.status
    ticket.status = new_status
    db.add(TicketComment(
        ticket_id=ticket_id,
        author_id=actor.employee_id,
        comment=f"Status changed from {old_status} to {new_status} by {actor.employee_id}.",
    ))
    db.commit()
    db.refresh(ticket)
    return ticket


def reassign_ticket(db: Session, ticket_id: int, new_assignee_id: str, actor: Employee) -> Ticket:
    ticket = get_ticket(db, ticket_id)

    target = db.get(Employee, new_assignee_id)
    if target is None:
        raise HTTPException(status_code=404, detail="Assignee not found.")
    if target.employment_status != "active":
        raise HTTPException(status_code=400, detail="Cannot assign a ticket to an exited employee.")
    if target.access_tier not in PRIVILEGED_TIERS:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign a ticket to a {target.access_tier} account - only privileged tiers handle tickets.",
        )

    old_assignee = ticket.assigned_to or "Unassigned"
    ticket.assigned_to = new_assignee_id
    db.add(TicketComment(
        ticket_id=ticket_id,
        author_id=actor.employee_id,
        comment=f"Reassigned from {old_assignee} to {new_assignee_id} by {actor.employee_id}.",
    ))
    db.commit()
    db.refresh(ticket)
    return ticket


def add_comment(db: Session, ticket_id: int, actor: Employee, comment_text: str) -> TicketComment:
    ticket = get_ticket(db, ticket_id)
    is_privileged = actor.access_tier in PRIVILEGED_TIERS
    is_raiser = actor.employee_id == ticket.raised_by
    is_assignee = actor.employee_id == ticket.assigned_to
    if not (is_privileged or is_raiser or is_assignee):
        raise HTTPException(
            status_code=403,
            detail="Only the ticket's raiser, its assignee, or a privileged tier may comment.",
        )

    comment = TicketComment(ticket_id=ticket_id, author_id=actor.employee_id, comment=comment_text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def is_sla_breached(ticket: Ticket) -> bool:
    if ticket.status not in UNRESOLVED_STATUSES:
        return False
    threshold_hours = SLA_HOURS.get(ticket.priority)
    if threshold_hours is None:
        return False
    # Naive UTC throughout, matching the model's own datetime.utcnow()
    # storage - mixing naive/aware here is exactly the class of bug already
    # found and fixed in Documents' access log.
    elapsed = datetime.utcnow() - ticket.created_at
    return elapsed > timedelta(hours=threshold_hours)
