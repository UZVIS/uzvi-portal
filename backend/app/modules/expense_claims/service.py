"""
M4 - Expense Claims
backend/app/modules/expense_claims/service.py
"""
from typing import List, Optional
from collections import defaultdict

from sqlalchemy.orm import Session

from app.modules.expense_claims import models, schemas

# FR-EXP-03: claims route through manager approval, then Admin/Finance above
# this amount threshold. Plain constant for now - the FRD frames it as
# "configurable," which really belongs in a settings table once one exists.
ADMIN_APPROVAL_THRESHOLD = 25000.0

# FR-EXP-04 status flow: Submitted -> Approved/Rejected -> Reimbursed
VALID_TRANSITIONS = {
    "Submitted": {"Approved", "Rejected"},
    "Approved": {"Reimbursed"},
    "Rejected": set(),
    "Reimbursed": set(),
}


class NotFoundError(Exception):
    pass


class InvalidTransitionError(Exception):
    pass


class CapExceededError(Exception):
    pass


# --- Categories ---

def create_category(db: Session, data: schemas.ExpenseCategoryCreate) -> models.ExpenseCategory:
    category = models.ExpenseCategory(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def list_categories(db: Session) -> List[models.ExpenseCategory]:
    return db.query(models.ExpenseCategory).all()


def get_category(db: Session, category_id: str) -> models.ExpenseCategory:
    category = db.get(models.ExpenseCategory, category_id)
    if category is None:
        raise NotFoundError(f"Category {category_id} not found")
    return category


# --- Claims ---

def create_claim(db: Session, data: schemas.ExpenseClaimCreate) -> models.ExpenseClaim:
    """FR-EXP-01, FR-EXP-02 (cap enforcement)."""
    category = get_category(db, data.category_id)
    if category.cap_amount is not None and data.amount > category.cap_amount:
        raise CapExceededError(
            f"Amount {data.amount} exceeds cap {category.cap_amount} for category {category.category_id}"
        )

    claim = models.ExpenseClaim(
        claim_id=data.claim_id,
        employee_id=data.employee_id,
        category_id=data.category_id,
        project_id=data.project_id,
        amount=data.amount,
        date=data.date,
        status="Submitted",
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def get_claim(db: Session, claim_id: str) -> models.ExpenseClaim:
    claim = db.get(models.ExpenseClaim, claim_id)
    if claim is None:
        raise NotFoundError(f"Claim {claim_id} not found")
    return claim


def list_claims(db: Session, employee_id: Optional[str] = None) -> List[models.ExpenseClaim]:
    query = db.query(models.ExpenseClaim)
    if employee_id:
        query = query.filter(models.ExpenseClaim.employee_id == employee_id)
    return query.all()


def _transition(db: Session, claim_id: str, new_status: str) -> models.ExpenseClaim:
    claim = get_claim(db, claim_id)
    if new_status not in VALID_TRANSITIONS.get(claim.status, set()):
        raise InvalidTransitionError(f"Cannot move claim from {claim.status} to {new_status}")
    claim.status = new_status
    db.commit()
    db.refresh(claim)
    return claim


def approve_claim(db: Session, claim_id: str, decided_by_role: str) -> models.ExpenseClaim:
    """FR-EXP-03: claims above ADMIN_APPROVAL_THRESHOLD require Admin/Finance, not just Manager."""
    claim = get_claim(db, claim_id)
    if claim.amount > ADMIN_APPROVAL_THRESHOLD and decided_by_role not in ("Admin", "HR-Restricted"):
        raise PermissionError(
            f"Claim {claim_id} exceeds {ADMIN_APPROVAL_THRESHOLD} and requires Admin/Finance approval"
        )
    return _transition(db, claim_id, "Approved")


def reject_claim(db: Session, claim_id: str) -> models.ExpenseClaim:
    return _transition(db, claim_id, "Rejected")


def mark_reimbursed(db: Session, claim_id: str) -> models.ExpenseClaim:
    return _transition(db, claim_id, "Reimbursed")


def pending_reimbursement_total(db: Session, employee_id: str) -> schemas.PendingTotal:
    """FR-EXP-07: own claim history + running reimbursement-pending total."""
    claims = list_claims(db, employee_id=employee_id)
    pending = [c for c in claims if c.status in ("Submitted", "Approved")]
    return schemas.PendingTotal(
        employee_id=employee_id,
        pending_reimbursement_total=round(sum(c.amount for c in pending), 2),
        claim_count=len(pending),
    )


def project_expense_rollup(db: Session, project_id: str) -> schemas.ProjectExpenseRollup:
    """FR-EXP-06: per-project expense rollup, links to M1 project data."""
    claims = db.query(models.ExpenseClaim).filter(models.ExpenseClaim.project_id == project_id).all()
    by_status: dict = defaultdict(float)
    for c in claims:
        by_status[c.status] += c.amount

    return schemas.ProjectExpenseRollup(
        project_id=project_id,
        total_amount=round(sum(c.amount for c in claims), 2),
        claim_count=len(claims),
        by_status=dict(by_status),
    )
