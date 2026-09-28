from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.helpdesk import schemas, service
from app.modules.helpdesk.dependencies import get_current_employee, require_privileged


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # EMP001: Admin (active). EMP002: Manager (active). EMP003: HR-Restricted
    # (active). EMP004: plain Employee (primary raiser). EMP005: a second
    # plain Employee (used as "someone else"). EMP006: exited Admin.
    session.add(Employee(employee_id="EMP001", name="Alice Admin", access_tier="Admin/Leadership"))
    session.add(Employee(employee_id="EMP002", name="Mona Manager", access_tier="Manager"))
    session.add(Employee(employee_id="EMP003", name="Hana HR", access_tier="HR-Restricted"))
    session.add(Employee(employee_id="EMP004", name="Eddie Employee", access_tier="Employee"))
    session.add(Employee(employee_id="EMP005", name="Other Employee", access_tier="Employee"))
    session.add(Employee(
        employee_id="EMP006", name="Inactive Admin",
        access_tier="Admin/Leadership", employment_status="exited",
    ))
    session.commit()
    yield session
    session.close()


# ---------- dependencies.py: role gating ----------

def test_get_current_employee_blocks_inactive(db):
    with pytest.raises(HTTPException) as exc:
        get_current_employee(x_employee_id="EMP006", db=db)
    assert exc.value.status_code == 403


def test_require_privileged_allows_manager_hr_admin(db):
    for emp_id in ("EMP001", "EMP002", "EMP003"):
        emp = db.get(Employee, emp_id)
        assert require_privileged(emp) is emp


def test_require_privileged_blocks_plain_employee(db):
    employee = db.get(Employee, "EMP004")
    with pytest.raises(HTTPException) as exc:
        require_privileged(employee)
    assert exc.value.status_code == 403


# ---------- schemas.py: enum validation ----------

def test_ticket_create_rejects_invalid_category():
    with pytest.raises(ValidationError):
        schemas.TicketCreate(category="Plumbing", priority="High", description="Leak")


def test_ticket_create_rejects_invalid_priority():
    with pytest.raises(ValidationError):
        schemas.TicketCreate(category="IT", priority="Urgent", description="Broken laptop")


def test_ticket_create_rejects_empty_description():
    with pytest.raises(ValidationError):
        schemas.TicketCreate(category="IT", priority="High", description="   ")


def test_ticket_create_accepts_valid_input():
    t = schemas.TicketCreate(category="IT", priority="High", description="Broken laptop")
    assert t.category == "IT"


def test_status_update_rejects_invalid_status():
    with pytest.raises(ValidationError):
        schemas.TicketStatusUpdate(status="Cancelled")


# ---------- ticket creation + auto-assignment (FR-HLP-01, FR-HLP-02) ----------

def test_create_ticket_auto_assigns_to_eligible_admin(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Laptop won't boot")
    assert ticket.assigned_to == "EMP001"
    assert ticket.status == "Open"


def test_create_ticket_balances_load_across_eligible_pool(db):
    db.add(Employee(employee_id="EMP007", name="Second Admin", access_tier="Admin/Leadership"))
    db.commit()

    t1 = service.create_ticket(db, "EMP004", "IT", "High", "First issue")
    assert t1.assigned_to == "EMP001"  # both start at 0, tie broken by lower id
    t2 = service.create_ticket(db, "EMP005", "IT", "High", "Second issue")
    assert t2.assigned_to == "EMP007"  # EMP001 now has 1 open, EMP007 has 0


def test_create_ticket_excludes_inactive_employees_from_pool(db):
    db.query(Employee).filter(Employee.employee_id == "EMP001").update({"employment_status": "exited"})
    db.commit()
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "No one to assign")
    assert ticket.assigned_to is None


def test_hr_ticket_routes_to_hr_restricted_tier(db):
    # HR has a dedicated tier with a matching name - HR tickets go there,
    # not to Admin/Leadership.
    ticket = service.create_ticket(db, "EMP004", "HR", "Medium", "Leave balance question")
    assert ticket.assigned_to == "EMP003"  # the only active HR-Restricted employee


def test_facilities_and_other_route_to_admin_leadership(db):
    # No dedicated tier exists for either category, so both fall back to
    # Admin/Leadership - same rule already used for IT in Onboarding.
    facilities_ticket = service.create_ticket(db, "EMP004", "Facilities", "Low", "AC not working")
    other_ticket = service.create_ticket(db, "EMP005", "Other", "Low", "General question")
    assert facilities_ticket.assigned_to == "EMP001"
    assert other_ticket.assigned_to == "EMP001"


# ---------- ticket viewing permissions (FR-HLP-04, FR-HLP-05) ----------

def test_raiser_can_view_own_ticket(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    raiser = db.get(Employee, "EMP004")
    found = service.get_ticket_for_viewer(db, ticket.ticket_id, raiser)
    assert found.ticket_id == ticket.ticket_id


def test_unrelated_employee_cannot_view_others_ticket(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    other = db.get(Employee, "EMP005")
    with pytest.raises(HTTPException) as exc:
        service.get_ticket_for_viewer(db, ticket.ticket_id, other)
    assert exc.value.status_code == 403


def test_privileged_tier_can_view_any_ticket(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    manager = db.get(Employee, "EMP002")
    found = service.get_ticket_for_viewer(db, ticket.ticket_id, manager)
    assert found.ticket_id == ticket.ticket_id


def test_list_my_tickets_only_returns_own(db):
    service.create_ticket(db, "EMP004", "IT", "High", "Mine")
    service.create_ticket(db, "EMP005", "IT", "High", "Not mine")
    mine = service.list_my_tickets(db, "EMP004")
    assert len(mine) == 1
    assert mine[0].raised_by == "EMP004"


# ---------- queue filtering (FR-HLP-05) ----------

def test_list_queue_filters_by_category_and_priority(db):
    service.create_ticket(db, "EMP004", "IT", "High", "IT issue")
    service.create_ticket(db, "EMP005", "HR", "Low", "HR issue")

    it_only = service.list_queue(db, category="IT")
    assert len(it_only) == 1
    assert it_only[0].category == "IT"

    low_only = service.list_queue(db, priority="Low")
    assert len(low_only) == 1
    assert low_only[0].priority == "Low"


def test_list_queue_filters_by_min_age(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Old issue")
    ticket.created_at = datetime.utcnow() - timedelta(hours=100)
    db.commit()

    too_recent_cutoff = service.list_queue(db, min_age_hours=200)
    assert too_recent_cutoff == []
    old_enough = service.list_queue(db, min_age_hours=50)
    assert len(old_enough) == 1


# ---------- status transitions (FR-HLP-03) ----------

def test_valid_forward_transition_succeeds(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    updated = service.update_status(db, ticket.ticket_id, "In Progress", admin)
    assert updated.status == "In Progress"


def test_skipping_a_stage_is_rejected(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    with pytest.raises(HTTPException) as exc:
        service.update_status(db, ticket.ticket_id, "Resolved", admin)  # skips In Progress
    assert exc.value.status_code == 400


def test_reopen_from_resolved_is_allowed(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    service.update_status(db, ticket.ticket_id, "In Progress", admin)
    service.update_status(db, ticket.ticket_id, "Resolved", admin)
    reopened = service.update_status(db, ticket.ticket_id, "In Progress", admin)
    assert reopened.status == "In Progress"


def test_closed_is_terminal(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    service.update_status(db, ticket.ticket_id, "In Progress", admin)
    service.update_status(db, ticket.ticket_id, "Resolved", admin)
    service.update_status(db, ticket.ticket_id, "Closed", admin)
    with pytest.raises(HTTPException) as exc:
        service.update_status(db, ticket.ticket_id, "In Progress", admin)
    assert exc.value.status_code == 400


def test_status_change_logs_activity_comment(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    service.update_status(db, ticket.ticket_id, "In Progress", admin)
    refreshed = service.get_ticket(db, ticket.ticket_id)
    assert any("Status changed from Open to In Progress" in c.comment for c in refreshed.comments)


# ---------- reassignment ----------

def test_reassign_to_active_employee_succeeds(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    updated = service.reassign_ticket(db, ticket.ticket_id, "EMP002", admin)
    assert updated.assigned_to == "EMP002"


def test_reassign_to_inactive_employee_raises_400(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    with pytest.raises(HTTPException) as exc:
        service.reassign_ticket(db, ticket.ticket_id, "EMP006", admin)
    assert exc.value.status_code == 400


def test_reassign_to_unknown_employee_raises_404(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    with pytest.raises(HTTPException) as exc:
        service.reassign_ticket(db, ticket.ticket_id, "EMP999", admin)
    assert exc.value.status_code == 404


def test_reassign_to_non_privileged_employee_raises_400(db):
    # A plain Employee tier can't handle tickets at all - can't see the
    # queue, can't change status - so it must never be a valid assignee.
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    with pytest.raises(HTTPException) as exc:
        service.reassign_ticket(db, ticket.ticket_id, "EMP005", admin)  # EMP005 is plain Employee
    assert exc.value.status_code == 400


# ---------- comments ----------

def test_raiser_can_comment(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    raiser = db.get(Employee, "EMP004")
    comment = service.add_comment(db, ticket.ticket_id, raiser, "Any update?")
    assert comment.author_id == "EMP004"


def test_assignee_can_comment(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")  # auto-assigned to EMP001
    assignee = db.get(Employee, "EMP001")
    comment = service.add_comment(db, ticket.ticket_id, assignee, "Looking into it")
    assert comment.author_id == "EMP001"


def test_unrelated_employee_cannot_comment(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    other = db.get(Employee, "EMP005")
    with pytest.raises(HTTPException) as exc:
        service.add_comment(db, ticket.ticket_id, other, "Not my ticket")
    assert exc.value.status_code == 403


def test_privileged_non_assignee_can_comment(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")  # assigned to EMP001
    manager = db.get(Employee, "EMP002")  # not raiser, not assigned, but privileged
    comment = service.add_comment(db, ticket.ticket_id, manager, "Checking in")
    assert comment.author_id == "EMP002"


# ---------- SLA breach (FR-HLP-06) ----------

def test_sla_not_breached_when_recent(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")  # High = 8h
    assert service.is_sla_breached(ticket) is False


def test_sla_breached_when_past_threshold(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    ticket.created_at = datetime.utcnow() - timedelta(hours=9)  # past 8h
    db.commit()
    assert service.is_sla_breached(ticket) is True


def test_sla_uses_correct_threshold_per_priority(db):
    low_ticket = service.create_ticket(db, "EMP004", "Other", "Low", "Minor issue")  # Low = 72h
    low_ticket.created_at = datetime.utcnow() - timedelta(hours=50)  # under 72h
    db.commit()
    assert service.is_sla_breached(low_ticket) is False


def test_resolved_ticket_is_never_flagged_breached(db):
    ticket = service.create_ticket(db, "EMP004", "IT", "High", "Issue")
    admin = db.get(Employee, "EMP001")
    service.update_status(db, ticket.ticket_id, "In Progress", admin)
    service.update_status(db, ticket.ticket_id, "Resolved", admin)
    ticket.created_at = datetime.utcnow() - timedelta(hours=100)
    db.commit()
    refreshed = service.get_ticket(db, ticket.ticket_id)
    assert service.is_sla_breached(refreshed) is False
