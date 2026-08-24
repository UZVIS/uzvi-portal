from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.modules.directory.models import Employee
from app.modules.helpdesk.models import Ticket, TicketComment

# Statuses that still count as an active workload for load-balancing
# purposes (FR-HLP-02) and for SLA-breach checks (FR-HLP-06).
OPEN_STATUSES = {"Open", "In Progress"}


def pick_resolver(db: Session, candidate_ids: list[str]) -> Optional[str]:
    """
    Auto-assign a new ticket to the best available resolver from a pool
    of candidate employee_ids for its category (FR-HLP-02).

    Only active employees are eligible. Among those, the candidate with
    the fewest currently-open tickets already assigned to them is
    chosen, so load spreads across the team instead of always hitting
    the first person in the list. employee_id is used as a
    deterministic tie-breaker.

    Returns None - leaving the ticket unassigned for manual triage -
    when the category has no configured resolvers, or none of the
    configured resolvers are currently active employees.
    """
    if not candidate_ids:
        return None

    active_ids = {
        row[0]
        for row in db.query(Employee.employee_id).filter(
            Employee.employee_id.in_(candidate_ids),
            Employee.employment_status == "active",
        )
    }
    if not active_ids:
        return None

    open_counts = dict.fromkeys(active_ids, 0)
    for (assignee,) in db.query(Ticket.assigned_to).filter(
        Ticket.assigned_to.in_(active_ids),
        Ticket.status.in_(OPEN_STATUSES),
    ):
        open_counts[assignee] += 1

    return min(open_counts, key=lambda emp_id: (open_counts[emp_id], emp_id))


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