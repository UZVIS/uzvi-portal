
# from datetime import date, timedelta

# import pytest
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.database import Base
# from app.modules.directory.models import Employee
# from app.modules.expense_claims import schemas, service


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
#     emp = Employee(employee_id="E1", name="Test Employee")
#     db.add(emp)
#     db.commit()
#     return emp


# @pytest.fixture
# def category(db):
#     return service.create_category(
#         db, schemas.ExpenseCategoryCreate(category_id="C1", name="Travel", cap_amount=10000)
#     )


# def test_create_claim_within_cap(db, employee, category):
#     claim = service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL1", employee_id="E1", category_id="C1", amount=5000, date=date(2026, 1, 5)
#         ),
#     )
#     assert claim.status == "Submitted"


# def test_create_claim_over_cap_rejected(db, employee, category):
#     with pytest.raises(service.CapExceededError):
#         service.create_claim(
#             db,
#             schemas.ExpenseClaimCreate(
#                 claim_id="CL2", employee_id="E1", category_id="C1", amount=15000, date=date(2026, 1, 5)
#             ),
#         )

# def test_cumulative_monthly_cap_blocks_second_claim(db, employee, category):
#     service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL_CUM1", employee_id="E1", category_id="C1", amount=8000, date=date(2026, 1, 5)
#         ),
#     )
#     with pytest.raises(service.CapExceededError):
#         service.create_claim(
#             db,
#             schemas.ExpenseClaimCreate(
#                 claim_id="CL_CUM2", employee_id="E1", category_id="C1", amount=3000, date=date(2026, 1, 20)
#             ),
#         )


# def test_cumulative_cap_resets_next_month(db, employee, category):
#     service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL_JAN", employee_id="E1", category_id="C1", amount=8000, date=date(2026, 1, 5)
#         ),
#     )
#     # Same amount, but in February - should NOT count against January's total.
#     claim = service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL_FEB", employee_id="E1", category_id="C1", amount=8000, date=date(2026, 2, 1)
#         ),
#     )
#     assert claim.status == "Submitted"


# def test_cumulative_cap_ignores_rejected_claims(db, employee, category):
#     claim1 = service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL_R1", employee_id="E1", category_id="C1", amount=8000, date=date(2026, 1, 5)
#         ),
#     )
#     service.reject_claim(db, "CL_R1", decided_by_role="Manager")
#     # CL_R1 was rejected, so it shouldn't count toward January's cumulative total.
#     claim2 = service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL_R2", employee_id="E1", category_id="C1", amount=8000, date=date(2026, 1, 20)
#         ),
#     )
#     assert claim2.status == "Submitted"
# def test_create_claim_rejects_future_date(db, employee, category):
#     tomorrow = date.today() + timedelta(days=1)
#     with pytest.raises(service.FutureDateError):
#         service.create_claim(
#             db,
#             schemas.ExpenseClaimCreate(
#                 claim_id="CL_FUTURE", employee_id="E1", category_id="C1", amount=500, date=tomorrow
#             ),
#         )


# def test_create_claim_allows_today(db, employee, category):
#     claim = service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL_TODAY", employee_id="E1", category_id="C1", amount=500, date=date.today()
#         ),
#     )
#     assert claim.date == date.today()

# def test_status_transitions_submitted_to_reimbursed(db, employee, category):
#     service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL3", employee_id="E1", category_id="C1", amount=1000, date=date(2026, 1, 5)
#         ),
#     )
#     service.approve_claim(db, "CL3", decided_by_role="Manager")
#     claim = service.mark_reimbursed(db, "CL3")
#     assert claim.status == "Reimbursed"


# def test_cannot_skip_straight_to_reimbursed(db, employee, category):
#     service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL4", employee_id="E1", category_id="C1", amount=1000, date=date(2026, 1, 5)
#         ),
#     )
#     with pytest.raises(service.InvalidTransitionError):
#         service.mark_reimbursed(db, "CL4")


# def test_high_value_claim_requires_admin_approval(db, employee):
#     service.create_category(
#         db, schemas.ExpenseCategoryCreate(category_id="C2", name="Big Ticket", cap_amount=None)
#     )
#     service.create_claim(
#         db,
#         schemas.ExpenseClaimCreate(
#             claim_id="CL5", employee_id="E1", category_id="C2", amount=30000, date=date(2026, 1, 5)
#         ),
#     )
#     with pytest.raises(PermissionError):
#         service.approve_claim(db, "CL5", decided_by_role="Manager")

#     claim = service.approve_claim(db, "CL5", decided_by_role="Admin/Leadership")
#     assert claim.status == "Approved"


# def test_pending_reimbursement_total(db, employee, category):
#     service.create_claim(
#         db, schemas.ExpenseClaimCreate(
#             claim_id="CL6", employee_id="E1", category_id="C1", amount=1000, date=date(2026, 1, 5)
#         )
#     )
#     service.create_claim(
#         db, schemas.ExpenseClaimCreate(
#             claim_id="CL7", employee_id="E1", category_id="C1", amount=2000, date=date(2026, 1, 6)
#         )
#     )
#     service.approve_claim(db, "CL7", decided_by_role="Manager")

#     total = service.pending_reimbursement_total(db, "E1")
#     assert total.claim_count == 2
#     assert total.pending_reimbursement_total == 3000

from datetime import date, timedelta

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
    emp = Employee(employee_id="E1", name="Test Employee", access_tier="Employee")
    db.add(emp)
    db.commit()
    return emp


def _make_category(db, category_id="CAT1", cap_amount=None):
    return service.create_category(
        db,
        schemas.ExpenseCategoryCreate(category_id=category_id, name="Travel", cap_amount=cap_amount),
    )


def _submit_claim(db, employee_id, category_id, day, amount, claim_id=None):
    return service.create_claim(
        db,
        schemas.ExpenseClaimCreate(
            claim_id=claim_id or f"C-{employee_id}-{category_id}-{day}-{amount}",
            employee_id=employee_id,
            category_id=category_id,
            date=day,
            amount=amount,
        ),
    )


# ---------------------------------------------------------------------------
# Category creation
# ---------------------------------------------------------------------------

def test_create_category_trims_whitespace(db):
    category = service.create_category(
        db, schemas.ExpenseCategoryCreate(category_id="CAT1", name="  Travel  ")
    )
    assert category.name == "Travel"


def test_create_category_rejects_empty_name(db):
    with pytest.raises(ValueError):
        service.create_category(db, schemas.ExpenseCategoryCreate(category_id="CAT1", name="   "))


def test_create_category_rejects_duplicate_case_insensitive(db):
    _make_category(db, category_id="CAT1")
    with pytest.raises(ValueError):
        service.create_category(db, schemas.ExpenseCategoryCreate(category_id="CAT2", name="travel"))


# ---------------------------------------------------------------------------
# Claim creation - caps and validation
# ---------------------------------------------------------------------------

def test_claim_rejects_unknown_category(db, employee):
    with pytest.raises(service.NotFoundError):
        _submit_claim(db, "E1", "NO_SUCH_CATEGORY", date(2026, 1, 5), 1000)


def test_claim_rejects_amount_over_per_claim_cap(db, employee):
    _make_category(db, cap_amount=2000)
    with pytest.raises(service.CapExceededError):
        _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 2500)


def test_claim_allows_amount_at_exactly_the_cap(db, employee):
    _make_category(db, cap_amount=2000)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 2000)
    assert claim.amount == 2000


def test_claim_rejects_when_monthly_total_would_exceed_cap(db, employee):
    _make_category(db, cap_amount=5000)
    _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 3000)
    with pytest.raises(service.CapExceededError):
        _submit_claim(db, "E1", "CAT1", date(2026, 1, 20), 3000)


def test_claim_monthly_cap_resets_next_month(db, employee):
    _make_category(db, cap_amount=5000)
    _submit_claim(db, "E1", "CAT1", date(2026, 1, 25), 4000)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 2, 1), 4000)
    assert claim.amount == 4000


def test_claim_monthly_cap_ignores_rejected_claims(db, employee):
    _make_category(db, cap_amount=5000)
    first = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 4000)
    service.reject_claim(db, first.claim_id, decided_by_role="Manager")
    # Rejected claim shouldn't count toward the monthly total.
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 20), 4000)
    assert claim.amount == 4000


def test_claim_rejects_future_date(db, employee):
    _make_category(db)
    tomorrow = date.today() + timedelta(days=1)
    with pytest.raises(service.FutureDateError):
        _submit_claim(db, "E1", "CAT1", tomorrow, 500)


def test_claim_allows_today(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date.today(), 500)
    assert claim.date == date.today()


def test_new_claim_starts_as_submitted(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 500)
    assert claim.status == "Submitted"


# ---------------------------------------------------------------------------
# Approval threshold
# ---------------------------------------------------------------------------

def test_manager_can_approve_claim_under_threshold(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 5000)
    approved = service.approve_claim(db, claim.claim_id, decided_by_role="Manager")
    assert approved.status == "Approved"
    assert approved.decided_by_role == "Manager"


def test_manager_cannot_approve_claim_over_threshold(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 30000)
    with pytest.raises(PermissionError):
        service.approve_claim(db, claim.claim_id, decided_by_role="Manager")


def test_admin_can_approve_claim_over_threshold(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 30000)
    approved = service.approve_claim(db, claim.claim_id, decided_by_role="Admin/Leadership")
    assert approved.status == "Approved"


def test_hr_can_approve_claim_over_threshold(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 30000)
    approved = service.approve_claim(db, claim.claim_id, decided_by_role="HR-Restricted")
    assert approved.status == "Approved"


# ---------------------------------------------------------------------------
# State transitions
# ---------------------------------------------------------------------------

def test_cannot_reimburse_a_submitted_claim(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 500)
    with pytest.raises(service.InvalidTransitionError):
        service.mark_reimbursed(db, claim.claim_id)


def test_can_reimburse_an_approved_claim(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 500)
    service.approve_claim(db, claim.claim_id, decided_by_role="Manager")
    reimbursed = service.mark_reimbursed(db, claim.claim_id)
    assert reimbursed.status == "Reimbursed"


def test_cannot_reject_an_already_approved_claim(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 500)
    service.approve_claim(db, claim.claim_id, decided_by_role="Manager")
    with pytest.raises(service.InvalidTransitionError):
        service.reject_claim(db, claim.claim_id, decided_by_role="Manager")


def test_rejected_claim_cannot_transition_further(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 500)
    service.reject_claim(db, claim.claim_id, decided_by_role="Manager")
    with pytest.raises(service.InvalidTransitionError):
        service.approve_claim(db, claim.claim_id, decided_by_role="Manager")


# ---------------------------------------------------------------------------
# Pending totals and rollups
# ---------------------------------------------------------------------------

def test_pending_total_counts_submitted_and_approved_only(db, employee):
    _make_category(db)
    c1 = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 1000)
    _submit_claim(db, "E1", "CAT1", date(2026, 1, 6), 500)
    service.approve_claim(db, c1.claim_id, decided_by_role="Manager")
    service.mark_reimbursed(db, c1.claim_id)

    result = service.pending_reimbursement_total(db, "E1")
    assert result.pending_reimbursement_total == 500
    assert result.claim_count == 1


def test_employee_name_property_resolves_from_directory(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 500)
    assert claim.employee_name == "Test Employee"

def test_manager_cannot_reject_claim_over_threshold(db, employee):
    """Regression test: the ₹25,000 threshold must block Manager from
    REJECTING a high-value claim too, not just approving it."""
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 30000)
    with pytest.raises(PermissionError):
        service.reject_claim(db, claim.claim_id, decided_by_role="Manager")


def test_admin_can_reject_claim_over_threshold(db, employee):
    _make_category(db)
    claim = _submit_claim(db, "E1", "CAT1", date(2026, 1, 5), 30000)
    rejected = service.reject_claim(db, claim.claim_id, decided_by_role="Admin/Leadership")
    assert rejected.status == "Rejected"    