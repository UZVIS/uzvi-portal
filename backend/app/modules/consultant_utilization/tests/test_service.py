from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.consultant_utilization import schemas, service

# Importing service already imports app.modules.leave.models
# (LeaveApplication, LeaveStatus) at module level, which registers
# those tables with Base.
from app.modules.leave.models import LeaveApplication, LeaveStatus


# ============================================================
# DATABASE FIXTURE
# ============================================================

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    yield session

    session.close()


# ============================================================
# HELPERS
# ============================================================

def _make_employee(
    db,
    employee_id,
    name="Test",
    access_tier="Employee",
    manager_id=None,
):
    emp = Employee(
        employee_id=employee_id,
        name=name,
        access_tier=access_tier,
        manager_id=manager_id,
    )

    db.add(emp)
    db.commit()

    return emp


def _log_hours(
    db,
    employee_id,
    project_id,
    day,
    hours,
    billable=True,
):
    entry = schemas.TimeEntryCreate(
        entry_id=f"TE-{employee_id}-{day}-{project_id}-{hours}-{billable}",
        employee_id=employee_id,
        project_id=project_id,
        date=day,
        hours=hours,
        billable_flag=billable,
    )

    return service.create_time_entry(
        db,
        entry,
    )


def _make_project(
    db,
    project_id="P1",
    billing_rate=100,
    cost_rate=50,
):
    return service.create_project(
        db,
        schemas.ProjectCreate(
            project_id=project_id,
            name="Client A",
            project_type="real project",
            billing_rate=billing_rate,
            cost_rate=cost_rate,
        ),
    )


# ---------------------------------------------------------------------------
# can_log_hours_for - Admin/Leadership only may log for someone else
# ---------------------------------------------------------------------------

def test_can_log_hours_for_self_always_true(db):
    e1 = _make_employee(
        db,
        "E1",
        access_tier="Employee",
    )

    assert service.can_log_hours_for(
        e1,
        e1,
    ) is True


def test_can_log_hours_for_admin_can_log_for_anyone(db):
    admin = _make_employee(
        db,
        "ADM1",
        access_tier="Admin/Leadership",
    )

    other = _make_employee(
        db,
        "E2",
        access_tier="Employee",
    )

    assert service.can_log_hours_for(
        admin,
        other,
    ) is True


def test_can_log_hours_for_manager_cannot_log_for_report(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    report = _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    assert service.can_log_hours_for(
        manager,
        report,
    ) is False


def test_can_log_hours_for_hr_cannot_log_for_report(db):
    hr = _make_employee(
        db,
        "HR1",
        access_tier="HR-Restricted",
    )

    report = _make_employee(
        db,
        "E9",
        access_tier="Employee",
        manager_id="HR1",
    )

    assert service.can_log_hours_for(
        hr,
        report,
    ) is False


# ---------------------------------------------------------------------------
# list_time_entry_employees
# ---------------------------------------------------------------------------

def test_admin_sees_every_employee(db):
    admin = _make_employee(
        db,
        "ADM1",
        access_tier="Admin/Leadership",
    )

    _make_employee(db, "E1")
    _make_employee(db, "E2")

    result = service.list_time_entry_employees(
        db,
        admin,
    )

    ids = {
        e.employee_id
        for e in result
    }

    assert ids == {
        "ADM1",
        "E1",
        "E2",
    }


def test_manager_sees_only_self_and_direct_reports(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_employee(
        db,
        "E9",
        access_tier="Employee",
        manager_id="OTHER",
    )

    result = service.list_time_entry_employees(
        db,
        manager,
    )

    ids = {
        e.employee_id
        for e in result
    }

    assert ids == {
        "E4",
        "E8",
    }


def test_plain_employee_sees_only_self(db):
    emp = _make_employee(
        db,
        "E1",
        access_tier="Employee",
    )

    result = service.list_time_entry_employees(
        db,
        emp,
    )

    assert [
        e.employee_id
        for e in result
    ] == ["E1"]


# ---------------------------------------------------------------------------
# create_time_entry - validation rules
# ---------------------------------------------------------------------------

def test_rejects_unknown_project(db):
    _make_employee(
        db,
        "E1",
    )

    with pytest.raises(service.NotFoundError):
        _log_hours(
            db,
            "E1",
            "NO_SUCH_PROJECT",
            date(2026, 1, 5),
            5,
        )


def test_rejects_unknown_employee(db):
    _make_project(db)

    with pytest.raises(service.NotFoundError):
        _log_hours(
            db,
            "GHOST",
            "P1",
            date(2026, 1, 5),
            5,
        )


def test_rejects_future_date(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    tomorrow = date.today() + timedelta(days=1)

    with pytest.raises(service.FutureDateError):
        _log_hours(
            db,
            "E1",
            "P1",
            tomorrow,
            5,
        )


def test_allows_today_when_today_is_weekday(db):
    today = date.today()

    # Saturday and Sunday are non-working days.
    # The utilization service intentionally rejects weekend entries.
    if today.weekday() >= 5:
        pytest.skip(
            "Today is a weekend; hours can only be logged on weekdays."
        )

    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        today,
        5,
    )

    assert entry.date == today


def test_rejects_weekend(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    # Jan 10, 2026 is a Saturday.
    with pytest.raises(service.WeekendDateError):
        _log_hours(
            db,
            "E1",
            "P1",
            date(2026, 1, 10),
            5,
        )


def test_rejects_logging_on_approved_leave_day(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    # NOTE:
    # These field names are based on the existing LeaveApplication
    # model used by the current test suite.
    leave = LeaveApplication(
        application_id="LA1",
        employee_id="E1",
        leave_type_id="LT1",
        start_date=date(2026, 1, 5),
        end_date=date(2026, 1, 6),
        status=LeaveStatus.APPROVED,
    )

    db.add(leave)
    db.commit()

    with pytest.raises(service.OnLeaveError):
        _log_hours(
            db,
            "E1",
            "P1",
            date(2026, 1, 5),
            5,
        )


def test_rejects_combined_hours_over_16_in_a_day(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    with pytest.raises(service.DailyHoursExceededError):
        _log_hours(
            db,
            "E1",
            "P1",
            date(2026, 1, 5),
            10,
        )


def test_allows_up_to_exactly_16_hours_combined(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
        billable=False,
    )

    assert entry.hours == 6


# ---------------------------------------------------------------------------
# Overtime split
# ---------------------------------------------------------------------------

def test_hours_within_normal_budget_have_no_overtime(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
    )

    assert entry.normal_hours == 6
    assert entry.overtime_hours == 0
    assert entry.ot_status is None


def test_overtime_saves_immediately_as_pending(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    assert entry.normal_hours == 8
    assert entry.overtime_hours == 2
    assert entry.ot_status == "Pending"


def test_cumulative_overtime_across_two_entries_same_day(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    first = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
    )

    assert first.ot_status is None

    second = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        5,
    )

    assert second.normal_hours == 2
    assert second.overtime_hours == 3
    assert second.ot_status == "Pending"


def test_top_of_chain_admin_with_no_manager_auto_approves_own_ot(db):
    _make_employee(
        db,
        "ADM1",
        access_tier="Admin/Leadership",
        manager_id=None,
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "ADM1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    assert entry.ot_status == "Approved"
    assert entry.ot_decided_by_role == "No approval required"


def test_admin_with_a_manager_still_goes_pending(db):
    _make_employee(
        db,
        "ADM2",
        access_tier="Admin/Leadership",
        manager_id="BOARD1",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "ADM2",
        "P1",
        date(2026, 1, 5),
        10,
    )

    assert entry.ot_status == "Pending"


# ---------------------------------------------------------------------------
# OT approval - scoped strictly by manager_id chain
# ---------------------------------------------------------------------------

def test_list_pending_ot_entries_scoped_to_direct_reports_only(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_employee(
        db,
        "E9",
        access_tier="Employee",
        manager_id="OTHER",
    )

    _make_project(db)

    _log_hours(
        db,
        "E8",
        "P1",
        date(2026, 1, 5),
        10,
    )

    _log_hours(
        db,
        "E9",
        "P1",
        date(2026, 1, 5),
        10,
    )

    pending = service.list_pending_ot_entries(
        db,
        manager,
    )

    assert len(pending) == 1
    assert pending[0].employee_id == "E8"


def test_manager_with_no_reports_sees_empty_queue(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    result = service.list_pending_ot_entries(
        db,
        manager,
    )

    assert result == []


def test_manager_can_approve_direct_reports_ot(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E8",
        "P1",
        date(2026, 1, 5),
        10,
    )

    approved = service.approve_ot(
        db,
        entry.entry_id,
        manager,
    )

    assert approved.ot_status == "Approved"
    assert approved.ot_decided_by_role == "Manager"


def test_manager_cannot_approve_ot_for_non_report(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E9",
        access_tier="Employee",
        manager_id="OTHER",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E9",
        "P1",
        date(2026, 1, 5),
        10,
    )

    with pytest.raises(service.NotYourReportError):
        service.approve_ot(
            db,
            entry.entry_id,
            manager,
        )


def test_admin_cannot_approve_ot_unless_literally_the_manager(db):
    admin = _make_employee(
        db,
        "ADM1",
        access_tier="Admin/Leadership",
    )

    _make_employee(
        db,
        "E1",
        access_tier="Employee",
        manager_id="SOMEONE_ELSE",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    with pytest.raises(service.NotYourReportError):
        service.approve_ot(
            db,
            entry.entry_id,
            admin,
        )


def test_reject_ot_caps_entry_back_to_normal_hours(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E8",
        "P1",
        date(2026, 1, 5),
        10,
    )

    rejected = service.reject_ot(
        db,
        entry.entry_id,
        manager,
    )

    assert rejected.ot_status == "Rejected"
    assert rejected.hours == 8
    assert rejected.overtime_hours == 0


def test_cannot_approve_ot_twice(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E8",
        "P1",
        date(2026, 1, 5),
        10,
    )

    service.approve_ot(
        db,
        entry.entry_id,
        manager,
    )

    with pytest.raises(service.InvalidOTTransitionError):
        service.approve_ot(
            db,
            entry.entry_id,
            manager,
        )


def test_cannot_approve_entry_with_no_pending_ot(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E8",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E8",
        "P1",
        date(2026, 1, 5),
        6,
    )

    with pytest.raises(service.InvalidOTTransitionError):
        service.approve_ot(
            db,
            entry.entry_id,
            manager,
        )


# ---------------------------------------------------------------------------
# Utilization math
# ---------------------------------------------------------------------------

def test_utilization_flags_under_utilized(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        8,
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.flag == "under_utilized"


def test_utilization_flags_over_allocated(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E1",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    # Monday-Friday = 40 normal hours.
    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        8,
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 6),
        8,
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 7),
        8,
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 8),
        8,
    )

    # 16 hours on Friday:
    # 8 normal + 8 overtime.
    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 9),
        16,
    )

    # Pending overtime does not count until approved.
    service.approve_ot(
        db,
        entry.entry_id,
        manager,
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 48
    assert summary.available_hours == 40
    assert summary.utilization_pct == pytest.approx(1.20)
    assert summary.flag == "over_allocated"


def test_seven_day_inclusive_range_gives_full_40h_available(db):
    """
    Regression test for the _weeks_in_period off-by-one:
    a 7-day inclusive range must count as exactly 1 week,
    not 6/7 of a week.
    """

    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    # Jan 5-9, 2026 are Mon-Fri.
    # Jan 5 to Jan 11 is a 7-day inclusive span.
    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.available_hours == pytest.approx(40.0)


def test_pending_ot_excluded_from_utilization_until_approved(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(db)

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 8


def test_approved_ot_counts_toward_utilization(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E1",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
    )

    service.approve_ot(
        db,
        entry.entry_id,
        manager,
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 10


# ---------------------------------------------------------------------------
# Project margins
# ---------------------------------------------------------------------------

def test_project_margin_calculation(db):
    _make_employee(
        db,
        "E1",
    )

    _make_project(
        db,
        billing_rate=100,
        cost_rate=60,
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        8,
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 6),
        8,
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 7),
        4,
    )

    margin = service.compute_project_margin(
        db,
        "P1",
    )

    assert margin.revenue == 2000
    assert margin.cost == 1200
    assert margin.margin == 800
    assert margin.margin_pct == pytest.approx(0.4)