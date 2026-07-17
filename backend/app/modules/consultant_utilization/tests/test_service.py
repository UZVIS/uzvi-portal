"""
M1 - Consultant Utilization Tracker
backend/app/modules/consultant_utilization/tests/test_service.py

Per NFR-MNT-03: unit tests for core business logic (calculations, validation).
Uses an isolated in-memory SQLite DB - not the real app database.
"""
from datetime import date

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
        entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}",
        employee_id=employee_id,
        project_id=project_id,
        date=day,
        hours=hours,
        billable_flag=billable,
    )
    return service.create_time_entry(db, entry)


def test_utilization_flags_under_utilized(db, employee):
    service.create_project(
        db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
                                   billing_rate=100, cost_rate=50)
    )
    # 10 billable hours in a 1-week period against 40h capacity -> well under 60%.
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.flag == "under_utilized"
    assert summary.utilization_pct < 0.60


def test_utilization_flags_over_allocated(db, employee):
    service.create_project(
        db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project")
    )
    # 45 billable hours against a 40h/week capacity for a 1-week period -> >105%.
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 45, True)

    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.flag == "over_allocated"
    assert summary.utilization_pct > 1.05


def test_non_billable_hours_dont_count_toward_utilization(db, employee):
    service.create_project(
        db, schemas.ProjectCreate(project_id="P1", name="Internal", project_type="Internal")
    )
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 30, False)  # not billable

    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.billable_hours == 0
    assert summary.flag == "under_utilized"


def test_project_margin_calculation(db, employee):
    service.create_project(
        db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
                                   billing_rate=100, cost_rate=60)
    )
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 20, True)

    margin = service.compute_project_margin(db, "P1")
    assert margin.revenue == 2000
    assert margin.cost == 1200
    assert margin.margin == 800
    assert margin.margin_pct == pytest.approx(0.4)


def test_time_entry_rejects_unknown_project(db, employee):
    with pytest.raises(service.NotFoundError):
        _log_hours(db, "E1", "NO_SUCH_PROJECT", date(2026, 1, 5), 5, True)


def test_org_dashboard_groups_bench_risk_and_over_allocated(db, employee):
    db.add(Employee(employee_id="E2", name="Consultant Two"))
    db.commit()
    service.create_project(
        db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
                                   billing_rate=100, cost_rate=50)
    )
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True)    # under-utilized
    _log_hours(db, "E2", "P1", date(2026, 1, 5), 45, True)   # over-allocated

    dashboard = service.compute_org_utilization(db, date(2026, 1, 5), date(2026, 1, 11))
    assert "E1" in dashboard.bench_risk
    assert "E2" in dashboard.over_allocated
