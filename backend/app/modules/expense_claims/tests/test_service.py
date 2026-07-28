"""
M4 - Expense Claims
backend/app/modules/expense_claims/tests/test_service.py

Per NFR-MNT-03: unit tests for core business logic (calculations, validation).
"""
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.expense_claims import schemas, service


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
    emp = Employee(employee_id="E1", name="Test Employee")
    db.add(emp)
    db.commit()
    return emp


@pytest.fixture
def category(db):
    return service.create_category(
        db, schemas.ExpenseCategoryCreate(category_id="C1", name="Travel", cap_amount=10000)
    )


def test_create_claim_within_cap(db, employee, category):
    claim = service.create_claim(
        db,
        schemas.ExpenseClaimCreate(
            claim_id="CL1", employee_id="E1", category_id="C1", amount=5000, date=date(2026, 1, 5)
        ),
    )
    assert claim.status == "Submitted"


def test_create_claim_over_cap_rejected(db, employee, category):
    with pytest.raises(service.CapExceededError):
        service.create_claim(
            db,
            schemas.ExpenseClaimCreate(
                claim_id="CL2", employee_id="E1", category_id="C1", amount=15000, date=date(2026, 1, 5)
            ),
        )


def test_status_transitions_submitted_to_reimbursed(db, employee, category):
    service.create_claim(
        db,
        schemas.ExpenseClaimCreate(
            claim_id="CL3", employee_id="E1", category_id="C1", amount=1000, date=date(2026, 1, 5)
        ),
    )
    service.approve_claim(db, "CL3", decided_by_role="Manager")
    claim = service.mark_reimbursed(db, "CL3")
    assert claim.status == "Reimbursed"


def test_cannot_skip_straight_to_reimbursed(db, employee, category):
    service.create_claim(
        db,
        schemas.ExpenseClaimCreate(
            claim_id="CL4", employee_id="E1", category_id="C1", amount=1000, date=date(2026, 1, 5)
        ),
    )
    with pytest.raises(service.InvalidTransitionError):
        service.mark_reimbursed(db, "CL4")


def test_high_value_claim_requires_admin_approval(db, employee):
    service.create_category(
        db, schemas.ExpenseCategoryCreate(category_id="C2", name="Big Ticket", cap_amount=None)
    )
    service.create_claim(
        db,
        schemas.ExpenseClaimCreate(
            claim_id="CL5", employee_id="E1", category_id="C2", amount=30000, date=date(2026, 1, 5)
        ),
    )
    with pytest.raises(PermissionError):
        service.approve_claim(db, "CL5", decided_by_role="Manager")

    claim = service.approve_claim(db, "CL5", decided_by_role="Admin")
    assert claim.status == "Approved"


def test_pending_reimbursement_total(db, employee, category):
    service.create_claim(
        db, schemas.ExpenseClaimCreate(
            claim_id="CL6", employee_id="E1", category_id="C1", amount=1000, date=date(2026, 1, 5)
        )
    )
    service.create_claim(
        db, schemas.ExpenseClaimCreate(
            claim_id="CL7", employee_id="E1", category_id="C1", amount=2000, date=date(2026, 1, 6)
        )
    )
    service.approve_claim(db, "CL7", decided_by_role="Manager")

    total = service.pending_reimbursement_total(db, "E1")
    assert total.claim_count == 2
    assert total.pending_reimbursement_total == 3000
