"""
M4 - Expense Claims
backend/app/modules/expense_claims/router.py

Mounted at /expenses per the integration contract (FRD Section 7).
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.expense_claims import schemas, service

router = APIRouter(prefix="/expenses", tags=["expense-claims"])


# --- Categories ---

@router.post("/categories", response_model=schemas.ExpenseCategoryRead)
def create_category(data: schemas.ExpenseCategoryCreate, db: Session = Depends(get_db)):
    return service.create_category(db, data)


@router.get("/categories", response_model=List[schemas.ExpenseCategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return service.list_categories(db)


# --- Claims ---

@router.post("/claims", response_model=schemas.ExpenseClaimRead)
def create_claim(data: schemas.ExpenseClaimCreate, db: Session = Depends(get_db)):
    try:
        return service.create_claim(db, data)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except service.CapExceededError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/claims", response_model=List[schemas.ExpenseClaimRead])
def list_claims(employee_id: Optional[str] = None, db: Session = Depends(get_db)):
    return service.list_claims(db, employee_id)


@router.get("/claims/{claim_id}", response_model=schemas.ExpenseClaimRead)
def get_claim(claim_id: str, db: Session = Depends(get_db)):
    try:
        return service.get_claim(db, claim_id)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/claims/{claim_id}/approve", response_model=schemas.ExpenseClaimRead)
def approve_claim(claim_id: str, decision: schemas.ClaimDecision, db: Session = Depends(get_db)):
    try:
        return service.approve_claim(db, claim_id, decision.decided_by_role)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.InvalidTransitionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@router.post("/claims/{claim_id}/reject", response_model=schemas.ExpenseClaimRead)
def reject_claim(claim_id: str, db: Session = Depends(get_db)):
    try:
        return service.reject_claim(db, claim_id)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.InvalidTransitionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/claims/{claim_id}/reimburse", response_model=schemas.ExpenseClaimRead)
def reimburse_claim(claim_id: str, db: Session = Depends(get_db)):
    try:
        return service.mark_reimbursed(db, claim_id)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.InvalidTransitionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/employees/{employee_id}/pending-total", response_model=schemas.PendingTotal)
def pending_total(employee_id: str, db: Session = Depends(get_db)):
    return service.pending_reimbursement_total(db, employee_id)


@router.get("/projects/{project_id}/rollup", response_model=schemas.ProjectExpenseRollup)
def project_rollup(project_id: str, db: Session = Depends(get_db)):
    return service.project_expense_rollup(db, project_id)
