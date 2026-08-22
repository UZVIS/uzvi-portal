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

    manager = Employee(
        employee_id="MGR1",
        name="Manager One",
        access_tier="Manager",
    )

    employee = Employee(
        employee_id="EMP1",
        name="Employee One",
        access_tier="Employee",
        manager_id="MGR1",
    )

    admin = Employee(
        employee_id="ADM1",
        name="Admin One",
        access_tier="Admin/Leadership",
    )

    hr = Employee(
        employee_id="HR1",
        name="HR One",
        access_tier="HR-Restricted",
    )

    db_session.add_all(
        [
            manager,
            employee,
            admin,
            hr,
        ]
    )

    db_session.commit()

    return {
        "manager": manager,
        "employee": employee,
        "admin": admin,
        "hr": hr,
    }


@pytest.fixture
def submitted_claim(
    db_session,
    employees,
):

    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C1",
            name="Travel",
            cap_amount=None,
        ),
    )

    return service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR1",
            employee_id="EMP1",
            category_id="C1",
            amount=1000,
            date=date(2026, 1, 5),
        ),
    )


# ============================================================
# AUTHENTICATION
# ============================================================

def test_approve_without_header_is_rejected(
    client,
    employees,
    submitted_claim,
):
    res = client.post(
        "/expenses/claims/CLR1/approve"
    )

    assert res.status_code == 401


def test_approve_with_unknown_employee_id_is_rejected(
    client,
    employees,
    submitted_claim,
):
    res = client.post(
        "/expenses/claims/CLR1/approve",
        headers={
            "X-Employee-Id": "GHOST"
        },
    )

    assert res.status_code == 401


def test_approve_as_plain_employee_is_forbidden(
    client,
    employees,
    submitted_claim,
):
    res = client.post(
        "/expenses/claims/CLR1/approve",
        headers={
            "X-Employee-Id": "EMP1"
        },
    )

    assert res.status_code == 403


def test_approve_as_manager_succeeds(
    client,
    employees,
    submitted_claim,
):
    res = client.post(
        "/expenses/claims/CLR1/approve",
        headers={
            "X-Employee-Id": "MGR1"
        },
    )

    assert res.status_code == 200

    body = res.json()

    assert body["status"] == "Approved"
    assert body["decided_by_role"] == "Manager"
    assert body["decided_by"] == "MGR1"


def test_approve_as_hr_is_forbidden(
    client,
    employees,
    submitted_claim,
):
    res = client.post(
        "/expenses/claims/CLR1/approve",
        headers={
            "X-Employee-Id": "HR1"
        },
    )

    assert res.status_code == 403


# ============================================================
# HIGH VALUE CLAIM
# ============================================================

def test_high_value_claim_rejected_for_manager_via_api(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C2",
            name="Big Ticket",
            cap_amount=None,
        ),
    )

    service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR2",
            employee_id="EMP1",
            category_id="C2",
            amount=30000,
            date=date(2026, 1, 5),
        ),
    )

    # Manager cannot perform final approval.
    # This first action should create Manager Approved.
    res = client.post(
        "/expenses/claims/CLR2/approve",
        headers={
            "X-Employee-Id": "MGR1"
        },
    )

    assert res.status_code == 200

    assert res.json()["status"] == "Manager Approved"

    # Admin performs final approval.
    res = client.post(
        "/expenses/claims/CLR2/approve",
        headers={
            "X-Employee-Id": "ADM1"
        },
    )

    assert res.status_code == 200

    body = res.json()

    assert body["status"] == "Approved"
    assert body["decided_by"] == "ADM1"
    assert body["decided_by_role"] == "Admin/Leadership"


def test_high_value_claim_cannot_be_approved_by_hr(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C3",
            name="Big Ticket HR",
            cap_amount=None,
        ),
    )

    service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR3",
            employee_id="EMP1",
            category_id="C3",
            amount=30000,
            date=date(2026, 1, 5),
        ),
    )

    res = client.post(
        "/expenses/claims/CLR3/approve",
        headers={
            "X-Employee-Id": "HR1"
        },
    )

    assert res.status_code == 403


# ============================================================
# REJECTION
# ============================================================

def test_reject_over_threshold_returns_manager_stage(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C9",
            name="Big",
            cap_amount=None,
        ),
    )

    service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR9",
            employee_id="EMP1",
            category_id="C9",
            amount=30000,
            date=date(2026, 1, 5),
        ),
    )

    # Manager can reject at the first approval stage.
    res = client.post(
        "/expenses/claims/CLR9/reject",
        headers={
            "X-Employee-Id": "MGR1"
        },
    )

    assert res.status_code == 200

    body = res.json()

    assert body["status"] == "Rejected"
    assert body["decided_by"] == "MGR1"


def test_admin_can_reject_over_threshold_via_api(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C10",
            name="Big2",
            cap_amount=None,
        ),
    )

    service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR10",
            employee_id="EMP1",
            category_id="C10",
            amount=30000,
            date=date(2026, 1, 5),
        ),
    )

    # First Manager approval.
    res = client.post(
        "/expenses/claims/CLR10/approve",
        headers={
            "X-Employee-Id": "MGR1"
        },
    )

    assert res.status_code == 200
    assert res.json()["status"] == "Manager Approved"

    # Admin rejection at second stage.
    res = client.post(
        "/expenses/claims/CLR10/reject",
        headers={
            "X-Employee-Id": "ADM1"
        },
    )

    assert res.status_code == 200

    body = res.json()

    assert body["status"] == "Rejected"
    assert body["decided_by"] == "ADM1"
    assert body["decided_by_role"] == "Admin/Leadership"


def test_hr_cannot_reject_normal_claim(
    client,
    employees,
    submitted_claim,
):
    res = client.post(
        "/expenses/claims/CLR1/reject",
        headers={
            "X-Employee-Id": "HR1"
        },
    )

    assert res.status_code == 403


def test_hr_cannot_reject_high_value_claim(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C11",
            name="HR Big",
            cap_amount=None,
        ),
    )

    service.create_claim(
        db_session,
        schemas.ExpenseClaimCreate(
            claim_id="CLR11",
            employee_id="EMP1",
            category_id="C11",
            amount=30000,
            date=date(2026, 1, 5),
        ),
    )

    res = client.post(
        "/expenses/claims/CLR11/reject",
        headers={
            "X-Employee-Id": "HR1"
        },
    )

    assert res.status_code == 403


# ============================================================
# PROJECT ROLLUP
# ============================================================

def test_project_rollup_blocked_for_plain_employee(
    client,
    employees,
    submitted_claim,
):
    res = client.get(
        "/expenses/projects/P1/rollup",
        headers={
            "X-Employee-Id": "EMP1"
        },
    )

    assert res.status_code == 403


def test_project_rollup_allowed_for_manager(
    client,
    employees,
    submitted_claim,
):
    res = client.get(
        "/expenses/projects/P1/rollup",
        headers={
            "X-Employee-Id": "MGR1"
        },
    )

    assert res.status_code == 200


def test_project_rollup_allowed_for_admin(
    client,
    employees,
    submitted_claim,
):
    res = client.get(
        "/expenses/projects/P1/rollup",
        headers={
            "X-Employee-Id": "ADM1"
        },
    )

    assert res.status_code == 200


def test_project_rollup_allowed_for_hr(
    client,
    employees,
    submitted_claim,
):
    res = client.get(
        "/expenses/projects/P1/rollup",
        headers={
            "X-Employee-Id": "HR1"
        },
    )

    assert res.status_code == 200


# ============================================================
# CLAIM CREATION SECURITY
# ============================================================

def test_create_claim_ignores_spoofed_employee_id(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C20",
            name="Food",
            cap_amount=None,
        ),
    )

    res = client.post(
        "/expenses/claims",
        headers={
            "X-Employee-Id": "EMP1"
        },
        json={
            "claim_id": "CLR20",
            "employee_id": "MGR1",
            "category_id": "C20",
            "amount": 500,
            "date": "2026-01-05",
        },
    )

    assert res.status_code == 200
    assert res.json()["employee_id"] == "EMP1"


def test_create_claim_without_header_is_rejected(
    client,
    employees,
    db_session,
):
    service.create_category(
        db_session,
        schemas.ExpenseCategoryCreate(
            category_id="C21",
            name="Food2",
            cap_amount=None,
        ),
    )

    res = client.post(
        "/expenses/claims",
        json={
            "claim_id": "CLR21",
            "employee_id": "EMP1",
            "category_id": "C21",
            "amount": 500,
            "date": "2026-01-05",
        },
    )

    assert res.status_code == 401