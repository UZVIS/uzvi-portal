

from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee
from app.modules.expense_claims import schemas, service
from app.modules.expense_claims.dependencies import (
    get_current_employee,
    require_approver,
)


router = APIRouter(
    prefix="/expenses",
    tags=["expense-claims"],
)


@router.post(
    "/categories",
    response_model=schemas.ExpenseCategoryRead,
)
def create_category(
    data: schemas.ExpenseCategoryCreate,
    db: Session = Depends(get_db),
):
    try:
        return service.create_category(
            db,
            data,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@router.get(
    "/categories",
    response_model=List[schemas.ExpenseCategoryRead],
)
def list_categories(
    db: Session = Depends(get_db),
):
    return service.list_categories(db)


@router.post(
    "/claims",
    response_model=schemas.ExpenseClaimRead,
)
def create_claim(
    data: schemas.ExpenseClaimCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        get_current_employee
    ),
):

    # Never trust employee_id sent by frontend.
    data.employee_id = current_employee.employee_id

    try:
        return service.create_claim(
            db,
            data,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.CapExceededError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.FutureDateError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


@router.post(
    "/claims/{claim_id}/receipt",
    response_model=schemas.ExpenseClaimRead,
)
def upload_receipt(
    claim_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    try:
        return service.upload_receipt(
            db,
            claim_id,
            file,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except service.InvalidReceiptError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


@router.get(
    "/claims",
    response_model=List[schemas.ExpenseClaimRead],
)
def list_claims(
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        get_current_employee
    ),
):
 

    return service.list_claims(
        db,
        employee_id=employee_id,
        current_employee=current_employee,
    )


@router.get(
    "/claims/{claim_id}",
    response_model=schemas.ExpenseClaimRead,
)
def get_claim(
    claim_id: str,
    db: Session = Depends(get_db),
):
    try:
        return service.get_claim(
            db,
            claim_id,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )


@router.post(
    "/claims/{claim_id}/approve",
    response_model=schemas.ExpenseClaimRead,
)
def approve_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_approver
    ),
):
    try:
        return service.approve_claim(
            db,
            claim_id,
            current_employee.access_tier,
            current_employee.employee_id,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except service.InvalidTransitionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )


@router.post(
    "/claims/{claim_id}/reject",
    response_model=schemas.ExpenseClaimRead,
)
def reject_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_approver
    ),
):
    try:
        return service.reject_claim(
            db,
            claim_id,
            current_employee.access_tier,
            current_employee.employee_id,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except service.InvalidTransitionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except PermissionError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )


@router.post(
    "/claims/{claim_id}/reimburse",
    response_model=schemas.ExpenseClaimRead,
)
def reimburse_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_approver
    ),
):
    try:
        return service.mark_reimbursed(
            db,
            claim_id,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except service.InvalidTransitionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


@router.get(
    "/employees/{employee_id}/pending-total",
    response_model=schemas.PendingTotal,
)
def pending_total(
    employee_id: str,
    db: Session = Depends(get_db),
):
    return service.pending_reimbursement_total(
        db,
        employee_id,
    )


@router.get(
    "/projects/{project_id}/rollup",
    response_model=schemas.ProjectExpenseRollup,
)
def project_rollup(
    project_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_approver
    ),
):
    return service.project_expense_rollup(
        db,
        project_id,
    )