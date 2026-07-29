"""
M4 - Expense Claims
backend/app/modules/expense_claims/service.py
"""
import os
import uuid
from typing import List, Optional
from collections import defaultdict

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.modules.expense_claims import models, schemas

ADMIN_APPROVAL_THRESHOLD = 25000.0

VALID_TRANSITIONS = {
    "Submitted": {"Approved", "Rejected"},
    "Approved": {"Reimbursed"},
    "Rejected": set(),
    "Reimbursed": set(),
}

# Local disk storage for now. Move to cloud storage (S3 etc.) for production.
RECEIPT_STORAGE_DIR = os.path.join(os.path.dirname(__file__), "receipt_uploads")
os.makedirs(RECEIPT_STORAGE_DIR, exist_ok=True)


class NotFoundError(Exception):
    pass


class InvalidTransitionError(Exception):
    pass


class CapExceededError(Exception):
    pass


class InvalidReceiptError(Exception):
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
        description=data.description,
        receipt_file_path=None,  # attached separately via upload_receipt()
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


def upload_receipt(db: Session, claim_id: str, file: UploadFile) -> models.ExpenseClaim:
    """Saves an uploaded receipt file to disk and links it to the claim."""
    claim = get_claim(db, claim_id)

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in schemas.ALLOWED_RECEIPT_EXTENSIONS:
        raise InvalidReceiptError(
            f"Unsupported file type '{ext}'. Allowed: {', '.join(schemas.ALLOWED_RECEIPT_EXTENSIONS)}"
        )

    contents = file.file.read()
    if len(contents) > schemas.MAX_RECEIPT_SIZE_BYTES:
        raise InvalidReceiptError("Receipt file exceeds 5MB limit")

    stored_filename = f"{claim_id}_{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(RECEIPT_STORAGE_DIR, stored_filename)
    with open(stored_path, "wb") as f:
        f.write(contents)

    claim.receipt_file_path = f"receipt_uploads/{stored_filename}"
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
    claims = list_claims(db, employee_id=employee_id)
    pending = [c for c in claims if c.status in ("Submitted", "Approved")]
    return schemas.PendingTotal(
        employee_id=employee_id,
        pending_reimbursement_total=round(sum(c.amount for c in pending), 2),
        claim_count=len(pending),
    )


def project_expense_rollup(db: Session, project_id: str) -> schemas.ProjectExpenseRollup:
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