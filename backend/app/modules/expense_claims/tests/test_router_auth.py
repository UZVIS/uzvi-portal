"""
M4 - Expense Claims
backend/app/modules/expense_claims/tests/test_router_auth.py

NFR-SEC-01: role-based access control enforced at the API layer, not just
the UI. These tests hit the real FastAPI routes (not the service layer
directly) to prove the X-Employee-Id header - not a client-supplied role
string - is what actually gates approve/reject/reimburse.
"""
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.modules.directory.models import Employee
from app.modules.expense_claims import schemas, service


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    def _get_db_override():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    yield session
    session.close()
    app.dependency_overrides.clear()


@pytest.fixture
def client(db_session):
    return TestClient(app)


@pytest.fixture
def employees(db_session):
    manager = Employee(employee_id="MGR1", name="Manager One", access_tier="Manager")
    employee = Employee(employee_id="EMP1", name="Employee One", access_tier="Employee")
    admin = Employee(employee_id="ADM1", name="Admin One", access_tier="Admin/Leadership")
    db_session.add_all([manager, employee, admin])
    db_session.commit()
    return {"manager": manager, "employee": employee, "admin": admin}


@pytest.fixture
def submitted_claim(db_session):
    service.create_category(
        db_session, schemas.ExpenseCategoryCreate(category_id="C1", name="Travel", cap_amount=None)
    )
    return service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR1", employee_id="EMP1", category_id="C1", amount=1000, date=date(2026, 1, 5)
        ),
    )


def test_approve_without_header_is_rejected(client, employees, submitted_claim):
    res = client.post("/expenses/claims/CLR1/approve")
    assert res.status_code == 401


def test_approve_as_plain_employee_is_forbidden(client, employees, submitted_claim):
    """An Employee-tier account cannot approve - even though nothing in the
    request body claims otherwise anymore, since the role now comes from
    the real M0 record, not client input."""
    res = client.post("/expenses/claims/CLR1/approve", headers={"X-Employee-Id": "EMP1"})
    assert res.status_code == 403


def test_approve_as_manager_succeeds(client, employees, submitted_claim):
    res = client.post("/expenses/claims/CLR1/approve", headers={"X-Employee-Id": "MGR1"})
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "Approved"
    # The decided_by_role is derived server-side from M0, not from anything
    # the client sent.
    assert body["decided_by_role"] == "Manager"


def test_approve_with_unknown_employee_id_is_rejected(client, employees, submitted_claim):
    res = client.post("/expenses/claims/CLR1/approve", headers={"X-Employee-Id": "GHOST"})
    assert res.status_code == 401


def test_approve_as_admin_leadership_succeeds(client, employees, submitted_claim):
    """Regression test: access_tier in M0 is literally 'Admin/Leadership', not
    'Admin' - this previously failed silently due to a string mismatch."""
    res = client.post("/expenses/claims/CLR1/approve", headers={"X-Employee-Id": "ADM1"})
    assert res.status_code == 200
    assert res.json()["decided_by_role"] == "Admin/Leadership"


def test_high_value_claim_rejected_for_manager_via_api(client, employees, db_session):
    """FR-EXP-03: above the admin threshold, Manager alone isn't enough -
    enforced here at the route level, not just in the service layer."""
    service.create_category(
        db_session, schemas.ExpenseCategoryCreate(category_id="C2", name="Big Ticket", cap_amount=None)
    )
    service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR2", employee_id="EMP1", category_id="C2", amount=30000, date=date(2026, 1, 5)
        ),
    )
    res = client.post("/expenses/claims/CLR2/approve", headers={"X-Employee-Id": "MGR1"})
    assert res.status_code == 403

    res = client.post("/expenses/claims/CLR2/approve", headers={"X-Employee-Id": "ADM1"})
    assert res.status_code == 200


def test_project_rollup_blocked_for_plain_employee(client, employees, submitted_claim):
    """Project Rollup is a cost-tracking view - restricted the same way as
    Approvals, not open to every Employee-tier account."""
    res = client.get("/expenses/projects/P1/rollup", headers={"X-Employee-Id": "EMP1"})
    assert res.status_code == 403


def test_project_rollup_allowed_for_manager(client, employees, submitted_claim):
    res = client.get("/expenses/projects/P1/rollup", headers={"X-Employee-Id": "MGR1"})
    assert res.status_code == 200

def test_create_claim_ignores_spoofed_employee_id(client, employees, db_session):
    """NFR-SEC-02: EMP1 is signed in, but tries to submit a claim claiming to
    be MGR1 in the request body. The claim must be attributed to whoever is
    actually signed in (EMP1), not whatever the client puts in the body."""
    service.create_category(
        db_session, schemas.ExpenseCategoryCreate(category_id="C3", name="Food", cap_amount=None)
    )
    res = client.post(
        "/expenses/claims",
        headers={"X-Employee-Id": "EMP1"},
        json={
            "claim_id": "CLR3",
            "employee_id": "MGR1",  # spoofed - should be ignored
            "category_id": "C3",
            "amount": 500,
            "date": "2026-01-05",
        },
    )
    assert res.status_code == 200
    assert res.json()["employee_id"] == "EMP1"


def test_create_claim_without_header_is_rejected(client, employees, db_session):
    service.create_category(
        db_session, schemas.ExpenseCategoryCreate(category_id="C3", name="Food", cap_amount=None)
    )
    res = client.post(
        "/expenses/claims",
        json={
            "claim_id": "CLR4",
            "employee_id": "EMP1",
            "category_id": "C3",
            "amount": 500,
            "date": "2026-01-05",
        },
    )
    assert res.status_code == 401    