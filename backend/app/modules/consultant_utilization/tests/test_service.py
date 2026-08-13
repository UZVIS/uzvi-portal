
# from datetime import date, timedelta

# import pytest
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.database import Base
# from app.modules.directory.models import Employee
# from app.modules.consultant_utilization import schemas, service


# @pytest.fixture
# def db():
#     engine = create_engine("sqlite:///:memory:")
#     Base.metadata.create_all(engine)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()
#     yield session
#     session.close()


# @pytest.fixture
# def employee(db):
#     emp = Employee(employee_id="E1", name="Test Consultant")
#     db.add(emp)
#     db.commit()
#     return emp


# def _log_hours(db, employee_id, project_id, day, hours, billable):
#     entry = schemas.TimeEntryCreate(
#         entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}",
#         employee_id=employee_id,
#         project_id=project_id,
#         date=day,
#         hours=hours,
#         billable_flag=billable,
#     )
#     return service.create_time_entry(db, entry)


# def test_utilization_flags_under_utilized(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 10 billable hours in a 1-week period against 40h capacity -> well under 60%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "under_utilized"
#     assert summary.utilization_pct < 0.60


# def test_utilization_flags_over_allocated(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 45 billable hours across the week (spread over multiple days since a
#     # single entry is capped at 24h/day) against 40h/week capacity -> >105%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 9, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "over_allocated"
#     assert summary.utilization_pct > 1.05


# def test_non_billable_hours_dont_count_toward_utilization(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Internal", project_type="Internal")
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 6, False)  # not billable

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.billable_hours == 0
#     assert summary.flag == "under_utilized"


# def test_project_margin_calculation(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=60)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 20, True)

#     margin = service.compute_project_margin(db, "P1")
#     assert margin.revenue == 2000
#     assert margin.cost == 1200
#     assert margin.margin == 800
#     assert margin.margin_pct == pytest.approx(0.4)


# def test_time_entry_rejects_unknown_project(db, employee):
#     with pytest.raises(service.NotFoundError):
#         _log_hours(db, "E1", "NO_SUCH_PROJECT", date(2026, 1, 5), 5, True)

# def test_time_entry_rejects_future_date(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     tomorrow = date.today() + timedelta(days=1)
#     with pytest.raises(service.FutureDateError):
#         _log_hours(db, "E1", "P1", tomorrow, 5, True)


# def test_time_entry_allows_today(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date.today(), 5, True)
#     assert entry.date == date.today()


# def test_org_dashboard_groups_bench_risk_and_over_allocated(db, employee):
#     db.add(Employee(employee_id="E2", name="Consultant Two"))
#     db.commit()
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True)    # under-utilized

#     _log_hours(db, "E2", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 9), 9, True)   # over-allocated

#     dashboard = service.compute_org_utilization(db, date(2026, 1, 5), date(2026, 1, 11))
#     assert "E1" in dashboard.bench_risk
#     assert "E2" in dashboard.over_allocated

# from datetime import date, timedelta

# import pytest
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.database import Base
# from app.modules.directory.models import Employee
# from app.modules.consultant_utilization import schemas, service


# @pytest.fixture
# def db():
#     engine = create_engine("sqlite:///:memory:")
#     Base.metadata.create_all(engine)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()
#     yield session
#     session.close()


# @pytest.fixture
# def employee(db):
#     emp = Employee(employee_id="E1", name="Test Consultant")
#     db.add(emp)
#     db.commit()
#     return emp


# def _log_hours(db, employee_id, project_id, day, hours, billable, confirm_overtime=True):
#     entry = schemas.TimeEntryCreate(
#         entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}-{hours}",
#         employee_id=employee_id,
#         project_id=project_id,
#         date=day,
#         hours=hours,
#         billable_flag=billable,
#         confirm_overtime=confirm_overtime,
#     )
#     return service.create_time_entry(db, entry)


# def test_utilization_flags_under_utilized(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 10 billable hours in a 1-week period against 40h capacity -> well under 60%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "under_utilized"
#     assert summary.utilization_pct < 0.60


# def test_utilization_flags_over_allocated(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 45 billable hours across the week (spread over multiple days since a
#     # single entry is capped at 24h/day) against 40h/week capacity -> >105%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 9, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "over_allocated"
#     assert summary.utilization_pct > 1.05


# def test_non_billable_hours_dont_count_toward_utilization(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Internal", project_type="Internal")
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 6, False)  # not billable

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.billable_hours == 0
#     assert summary.flag == "under_utilized"


# def test_project_margin_calculation(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=60)
#     )
#     # 20 total hours, split across two days since a single entry now caps
#     # at 16h/day - margin calc sums across all entries regardless of date.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 16, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 4, True)

#     margin = service.compute_project_margin(db, "P1")
#     assert margin.revenue == 2000
#     assert margin.cost == 1200
#     assert margin.margin == 800
#     assert margin.margin_pct == pytest.approx(0.4)


# def test_time_entry_rejects_unknown_project(db, employee):
#     with pytest.raises(service.NotFoundError):
#         _log_hours(db, "E1", "NO_SUCH_PROJECT", date(2026, 1, 5), 5, True)


# def test_time_entry_rejects_future_date(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     tomorrow = date.today() + timedelta(days=1)
#     with pytest.raises(service.FutureDateError):
#         _log_hours(db, "E1", "P1", tomorrow, 5, True)


# def test_time_entry_allows_today(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date.today(), 5, True)
#     assert entry.date == date.today()


# def test_time_entry_rejects_combined_hours_over_16_in_a_day(db, employee):
#     """A day only has 16h max (8 normal + 8 overtime) - even across
#     multiple separate entries."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)
#     with pytest.raises(service.DailyHoursExceededError):
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)


# def test_time_entry_allows_up_to_exactly_16_hours_combined(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     assert entry.hours == 6


# def test_daily_hours_cap_resets_next_day(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 16, True)
#     # Different day - shouldn't count against Jan 5th's total.
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 6), 16, True)
#     assert entry.date == date(2026, 1, 6)


# def test_hours_within_normal_budget_are_never_overtime(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, True, confirm_overtime=False)
#     assert entry.normal_hours == 6
#     assert entry.overtime_hours == 0
 
 
# def test_overtime_requires_confirmation(db, employee):
#     """Logging 10h with no confirmation should not silently succeed - the
#     caller must explicitly acknowledge the overtime portion first."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True, confirm_overtime=False)
#     assert exc_info.value.remaining_normal_hours == 8
#     assert exc_info.value.requested_hours == 10
 
 
# def test_overtime_confirmed_splits_correctly(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True, confirm_overtime=True)
#     assert entry.normal_hours == 8
#     assert entry.overtime_hours == 2
#     assert entry.hours == 10
 
 
# def test_cumulative_overtime_across_two_entries_same_day(db, employee):
#     """Exact scenario: first entry 6h (all normal, no OT needed). Second
#     entry 5h the same day - only 2h of normal budget remain, so 2h normal
#     + 3h overtime for that second entry."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     first = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, True, confirm_overtime=False)
#     assert first.normal_hours == 6
#     assert first.overtime_hours == 0
 
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True, confirm_overtime=False)
#     assert exc_info.value.remaining_normal_hours == 2
#     assert exc_info.value.requested_hours == 5
 
#     second = _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True, confirm_overtime=True)
#     assert second.normal_hours == 2
#     assert second.overtime_hours == 3
 
 
# def test_declining_overtime_can_be_resubmitted_at_remaining_normal_budget(db, employee):
#     """This is the client-side flow when the person says "No" to the OT
#     prompt: resubmit with hours capped to whatever normal budget remains,
#     rather than the original higher amount."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, True, confirm_overtime=False)
 
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True, confirm_overtime=False)
#     remaining = exc_info.value.remaining_normal_hours  # 2
 
#     # Person said "No" - resubmit truncated to just the remaining budget.
#     truncated = _log_hours(db, "E1", "P1", date(2026, 1, 5), remaining, True, confirm_overtime=False)
#     assert truncated.hours == 2
#     assert truncated.normal_hours == 2
#     assert truncated.overtime_hours == 0
 
 
# def test_overtime_confirmation_required_even_when_zero_normal_remains(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True, confirm_overtime=False)  # uses up all normal
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 1, True, confirm_overtime=False)
#     assert exc_info.value.remaining_normal_hours == 0
 
 
# def test_org_dashboard_groups_bench_risk_and_over_allocated(db, employee):
#     db.add(Employee(employee_id="E2", name="Consultant Two"))
#     db.commit()
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True)    # under-utilized

#     _log_hours(db, "E2", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 9), 9, True)   # over-allocated

#     dashboard = service.compute_org_utilization(db, date(2026, 1, 5), date(2026, 1, 11))
#     assert "E1" in dashboard.bench_risk
#     assert "E2" in dashboard.over_allocated



from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.consultant_utilization import schemas, service


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def employee(db):
    emp = Employee(employee_id="E1", name="Test Consultant")
    db.add(emp)
    db.commit()
    return emp


def _log_hours(db, employee_id, project_id, day, hours, billable):
    entry = schemas.TimeEntryCreate(
        entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}-{hours}",
        employee_id=employee_id,
        project_id=project_id,
        date=day,
        hours=hours,
        billable_flag=billable,
    )
    return service.create_time_entry(db, entry)


def test_utilization_flags_under_utilized(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    # 8 billable hours in a 1-week period against 40h capacity -> well under 60%.
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True)

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.flag == "under_utilized"
    assert summary.utilization_pct < 0.60


def test_utilization_flags_over_allocated(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    # 48 billable hours during the week.
    # Jan 10 is Saturday, so use 16 hours on Friday instead.
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True)
    _log_hours(db, "E1", "P1", date(2026, 1, 6), 8, True)
    _log_hours(db, "E1", "P1", date(2026, 1, 7), 8, True)
    _log_hours(db, "E1", "P1", date(2026, 1, 8), 8, True)
    _log_hours(db, "E1", "P1", date(2026, 1, 9), 16, True)

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.flag == "over_allocated"
    assert summary.utilization_pct > 1.05


def test_non_billable_hours_dont_count_toward_utilization(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Internal",
            project_type="Internal",
        ),
    )

    _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
    _log_hours(db, "E1", "P1", date(2026, 1, 6), 6, False)
    _log_hours(db, "E1", "P1", date(2026, 1, 7), 6, False)
    _log_hours(db, "E1", "P1", date(2026, 1, 8), 6, False)
    _log_hours(db, "E1", "P1", date(2026, 1, 9), 6, False)

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 0
    assert summary.flag == "under_utilized"


def test_project_margin_calculation(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=60,
        ),
    )

    _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True)
    _log_hours(db, "E1", "P1", date(2026, 1, 6), 8, True)
    _log_hours(db, "E1", "P1", date(2026, 1, 7), 4, True)

    margin = service.compute_project_margin(db, "P1")

    assert margin.revenue == 2000
    assert margin.cost == 1200
    assert margin.margin == 800
    assert margin.margin_pct == pytest.approx(0.4)


def test_time_entry_rejects_unknown_project(db, employee):
    with pytest.raises(service.NotFoundError):
        _log_hours(
            db,
            "E1",
            "NO_SUCH_PROJECT",
            date(2026, 1, 5),
            5,
            True,
        )


def test_time_entry_rejects_future_date(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    tomorrow = date.today() + timedelta(days=1)

    with pytest.raises(service.FutureDateError):
        _log_hours(db, "E1", "P1", tomorrow, 5, True)


def test_time_entry_allows_today(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date.today(),
        5,
        True,
    )

    assert entry.date == date.today()


def test_time_entry_rejects_combined_hours_over_16_in_a_day(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

    with pytest.raises(service.DailyHoursExceededError):
        _log_hours(
            db,
            "E1",
            "P1",
            date(2026, 1, 5),
            10,
            True,
        )


def test_time_entry_allows_up_to_exactly_16_hours_combined(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
        False,
    )

    assert entry.hours == 6


def test_daily_hours_cap_resets_next_day(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    _log_hours(db, "E1", "P1", date(2026, 1, 5), 16, True)

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 6),
        16,
        True,
    )

    assert entry.date == date(2026, 1, 6)


def test_hours_within_normal_budget_have_no_overtime(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
        True,
    )

    assert entry.normal_hours == 6
    assert entry.overtime_hours == 0
    assert entry.ot_status is None


def test_overtime_saves_immediately_as_pending(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
        True,
    )

    assert entry.hours == 10
    assert entry.normal_hours == 8
    assert entry.overtime_hours == 2
    assert entry.ot_status == "Pending"


def test_cumulative_overtime_across_two_entries_same_day(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    first = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
        True,
    )

    assert first.normal_hours == 6
    assert first.overtime_hours == 0
    assert first.ot_status is None

    second = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        5,
        True,
    )

    assert second.normal_hours == 2
    assert second.overtime_hours == 3
    assert second.ot_status == "Pending"


def test_pending_overtime_excluded_from_utilization_until_approved(
    db,
    employee,
):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
        True,
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 8


def test_approving_overtime_makes_it_count_toward_utilization(
    db,
    employee,
):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
        True,
    )

    service.approve_ot(
        db,
        entry.entry_id,
        decided_by_role="Admin/Leadership",
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 10


def test_rejecting_overtime_caps_entry_back_to_normal_hours(
    db,
    employee,
):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
        True,
    )

    rejected = service.reject_ot(
        db,
        entry.entry_id,
        decided_by_role="HR-Restricted",
    )

    assert rejected.ot_status == "Rejected"
    assert rejected.hours == 8
    assert rejected.overtime_hours == 0

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 8


def test_list_pending_ot_entries(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
        True,
    )

    entry_with_ot = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 6),
        10,
        True,
    )

    pending = service.list_pending_ot_entries(db)

    assert len(pending) == 1
    assert pending[0].entry_id == entry_with_ot.entry_id


def test_cannot_approve_ot_twice(db, employee):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        10,
        True,
    )

    service.approve_ot(
        db,
        entry.entry_id,
        decided_by_role="Admin/Leadership",
    )

    with pytest.raises(service.InvalidOTTransitionError):
        service.approve_ot(
            db,
            entry.entry_id,
            decided_by_role="Admin/Leadership",
        )


def test_cannot_approve_ot_on_entry_with_no_pending_ot(
    db,
    employee,
):
    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        6,
        True,
    )

    with pytest.raises(service.InvalidOTTransitionError):
        service.approve_ot(
            db,
            entry.entry_id,
            decided_by_role="Admin/Leadership",
        )


def test_org_dashboard_groups_bench_risk_and_over_allocated(
    db,
    employee,
):
    db.add(
        Employee(
            employee_id="E2",
            name="Consultant Two",
        )
    )
    db.commit()

    service.create_project(
        db,
        schemas.ProjectCreate(
            project_id="P1",
            name="Client A",
            project_type="real project",
            billing_rate=100,
            cost_rate=50,
        ),
    )

    # E1 is under-utilized.
    _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 5),
        5,
        True,
    )

    # E2 has 48 billable hours during the week.
    # Jan 10 is Saturday, so use 16 hours on Friday instead.
    _log_hours(
        db,
        "E2",
        "P1",
        date(2026, 1, 5),
        8,
        True,
    )

    _log_hours(
        db,
        "E2",
        "P1",
        date(2026, 1, 6),
        8,
        True,
    )

    _log_hours(
        db,
        "E2",
        "P1",
        date(2026, 1, 7),
        8,
        True,
    )

    _log_hours(
        db,
        "E2",
        "P1",
        date(2026, 1, 8),
        8,
        True,
    )

    _log_hours(
        db,
        "E2",
        "P1",
        date(2026, 1, 9),
        16,
        True,
    )

    dashboard = service.compute_org_utilization(
        db,
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert "E1" in dashboard.bench_risk
    assert "E2" in dashboard.over_allocated