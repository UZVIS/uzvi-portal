from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.expense_claims import schemas, service


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
# EMPLOYEE FIXTURE
# ============================================================

@pytest.fixture
def employees(db):

    manager = Employee(
        employee_id="MGR1",
        name="Manager One",
        access_tier="Manager",
    )

    employee = Employee(
        employee_id="E1",
        name="Test Employee",
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

    db.add_all(
        [
            manager,
            employee,
            admin,
            hr,
        ]
    )

    db.commit()

    return {
        "manager": manager,
        "employee": employee,
        "admin": admin,
        "hr": hr,
    }


# ============================================================
# HELPERS
# ============================================================

def _make_category(
    db,
    category_id="CAT1",
    cap_amount=None,
):
    return service.create_category(
        db,
        schemas.ExpenseCategoryCreate(
            category_id=category_id,
            name="Travel",
            cap_amount=cap_amount,
        ),
    )


def _submit_claim(
    db,
    employee_id,
    category_id,
    day,
    amount,
    claim_id=None,
):
    return service.create_claim(
        db,
        schemas.ExpenseClaimCreate(
            claim_id=(
                claim_id
                or f"C-{employee_id}-{category_id}-{day}-{amount}"
            ),
            employee_id=employee_id,
            category_id=category_id,
            date=day,
            amount=amount,
        ),
    )


# ============================================================
# CATEGORY CREATION
# ============================================================

def test_create_category_trims_whitespace(db):
    category = service.create_category(
        db,
        schemas.ExpenseCategoryCreate(
            category_id="CAT1",
            name="  Travel  ",
        ),
    )

    assert category.name == "Travel"


def test_create_category_rejects_empty_name(db):
    with pytest.raises(ValueError):
        service.create_category(
            db,
            schemas.ExpenseCategoryCreate(
                category_id="CAT1",
                name="   ",
            ),
        )


def test_create_category_rejects_duplicate_case_insensitive(db):

    _make_category(
        db,
        category_id="CAT1",
    )

    with pytest.raises(ValueError):
        service.create_category(
            db,
            schemas.ExpenseCategoryCreate(
                category_id="CAT2",
                name="travel",
            ),
        )


# ============================================================
# CLAIM CREATION
# ============================================================

def test_claim_rejects_unknown_category(
    db,
    employees,
):
    with pytest.raises(service.NotFoundError):
        _submit_claim(
            db,
            "E1",
            "NO_SUCH_CATEGORY",
            date(2026, 1, 5),
            1000,
        )


def test_claim_rejects_amount_over_per_claim_cap(
    db,
    employees,
):

    _make_category(
        db,
        cap_amount=2000,
    )

    with pytest.raises(service.CapExceededError):
        _submit_claim(
            db,
            "E1",
            "CAT1",
            date(2026, 1, 5),
            2500,
        )


def test_claim_allows_amount_at_exactly_the_cap(
    db,
    employees,
):

    _make_category(
        db,
        cap_amount=2000,
    )

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        2000,
    )

    assert claim.amount == 2000


def test_claim_rejects_when_monthly_total_would_exceed_cap(
    db,
    employees,
):

    _make_category(
        db,
        cap_amount=5000,
    )

    _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        3000,
    )

    with pytest.raises(service.CapExceededError):

        _submit_claim(
            db,
            "E1",
            "CAT1",
            date(2026, 1, 20),
            3000,
        )


def test_claim_monthly_cap_resets_next_month(
    db,
    employees,
):

    _make_category(
        db,
        cap_amount=5000,
    )

    _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 25),
        4000,
    )

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 2, 1),
        4000,
    )

    assert claim.amount == 4000


def test_claim_monthly_cap_ignores_rejected_claims(
    db,
    employees,
):

    _make_category(
        db,
        cap_amount=5000,
    )

    first = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        4000,
    )

    service.reject_claim(
        db,
        first.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 20),
        4000,
    )

    assert claim.amount == 4000


def test_claim_rejects_future_date(
    db,
    employees,
):

    _make_category(db)

    tomorrow = date.today() + timedelta(days=1)

    with pytest.raises(service.FutureDateError):

        _submit_claim(
            db,
            "E1",
            "CAT1",
            tomorrow,
            500,
        )


def test_claim_allows_today(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date.today(),
        500,
    )

    assert claim.date == date.today()


def test_new_claim_starts_as_submitted(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        500,
    )

    assert claim.status == "Submitted"


# ============================================================
# APPROVAL THRESHOLD
# ============================================================

def test_manager_can_approve_claim_under_threshold(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        5000,
    )

    approved = service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    assert approved.status == "Approved"
    assert approved.decided_by_role == "Manager"
    assert approved.decided_by == "MGR1"


def test_manager_can_approve_high_value_claim_to_manager_stage(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        30000,
    )

    approved = service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    assert approved.status == "Manager Approved"
    assert approved.decided_by == "MGR1"
    assert approved.decided_by_role == "Manager"


def test_high_value_claim_requires_manager_then_admin(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        30000,
    )

    manager_approved = service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    assert manager_approved.status == "Manager Approved"
    assert manager_approved.decided_by == "MGR1"

    final_approved = service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Admin/Leadership",
        decided_by_employee_id="ADM1",
    )

    assert final_approved.status == "Approved"
    assert final_approved.decided_by == "ADM1"
    assert final_approved.decided_by_role == "Admin/Leadership"


def test_hr_cannot_approve_claim_over_threshold(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        30000,
    )

    with pytest.raises(PermissionError):

        service.approve_claim(
            db,
            claim.claim_id,
            decided_by_role="HR-Restricted",
            decided_by_employee_id="HR1",
        )


def test_hr_cannot_approve_normal_claim(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        5000,
    )

    with pytest.raises(PermissionError):

        service.approve_claim(
            db,
            claim.claim_id,
            decided_by_role="HR-Restricted",
            decided_by_employee_id="HR1",
        )


# ============================================================
# STATE TRANSITIONS
# ============================================================

def test_cannot_reimburse_a_submitted_claim(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        500,
    )

    with pytest.raises(service.InvalidTransitionError):

        service.mark_reimbursed(
            db,
            claim.claim_id,
        )


def test_can_reimburse_an_approved_claim(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        500,
    )

    service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    reimbursed = service.mark_reimbursed(
        db,
        claim.claim_id,
    )

    assert reimbursed.status == "Reimbursed"


def test_cannot_reject_an_already_approved_claim(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        500,
    )

    service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    with pytest.raises(service.InvalidTransitionError):

        service.reject_claim(
            db,
            claim.claim_id,
            decided_by_role="Manager",
            decided_by_employee_id="MGR1",
        )


def test_rejected_claim_cannot_transition_further(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        500,
    )

    service.reject_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    with pytest.raises(service.InvalidTransitionError):

        service.approve_claim(
            db,
            claim.claim_id,
            decided_by_role="Manager",
            decided_by_employee_id="MGR1",
        )


# ============================================================
# PENDING TOTALS
# ============================================================

def test_pending_total_counts_submitted_and_approved_only(
    db,
    employees,
):

    _make_category(db)

    c1 = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        1000,
    )

    _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 6),
        500,
    )

    service.approve_claim(
        db,
        c1.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    service.mark_reimbursed(
        db,
        c1.claim_id,
    )

    result = service.pending_reimbursement_total(
        db,
        "E1",
    )

    assert result.pending_reimbursement_total == 500
    assert result.claim_count == 1


# ============================================================
# DISPLAY NAME
# ============================================================

def test_employee_name_property_resolves_from_directory(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        500,
    )

    assert claim.employee_name == "Test Employee"


# ============================================================
# REJECTION
# ============================================================

def test_manager_can_reject_high_value_claim_at_first_stage(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        30000,
    )

    rejected = service.reject_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    assert rejected.status == "Rejected"
    assert rejected.decided_by == "MGR1"
    assert rejected.decided_by_role == "Manager"


def test_admin_can_reject_high_value_after_manager_approval(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        30000,
    )

    service.approve_claim(
        db,
        claim.claim_id,
        decided_by_role="Manager",
        decided_by_employee_id="MGR1",
    )

    rejected = service.reject_claim(
        db,
        claim.claim_id,
        decided_by_role="Admin/Leadership",
        decided_by_employee_id="ADM1",
    )

    assert rejected.status == "Rejected"
    assert rejected.decided_by == "ADM1"
    assert rejected.decided_by_role == "Admin/Leadership"


def test_hr_cannot_reject_claim_over_threshold(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        30000,
    )

    with pytest.raises(PermissionError):

        service.reject_claim(
            db,
            claim.claim_id,
            decided_by_role="HR-Restricted",
            decided_by_employee_id="HR1",
        )


def test_hr_cannot_reject_normal_claim(
    db,
    employees,
):

    _make_category(db)

    claim = _submit_claim(
        db,
        "E1",
        "CAT1",
        date(2026, 1, 5),
        5000,
    )

    with pytest.raises(PermissionError):

        service.reject_claim(
            db,
            claim.claim_id,
            decided_by_role="HR-Restricted",
            decided_by_employee_id="HR1",
        )