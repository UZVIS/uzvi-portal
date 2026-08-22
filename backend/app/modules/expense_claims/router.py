

# # from typing import List, Optional

# # from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
# # from sqlalchemy.orm import Session

# # from app.database import get_db
# # from app.modules.directory.models import Employee
# # from app.modules.expense_claims import schemas, service
# # from app.modules.expense_claims.dependencies import (
# #     get_current_employee,
# #     require_approver,
# # )


# # router = APIRouter(
# #     prefix="/expenses",
# #     tags=["expense-claims"],
# # )



# # @router.post(
# #     "/categories",
# #     response_model=schemas.ExpenseCategoryRead,
# # )
# # def create_category(
# #     data: schemas.ExpenseCategoryCreate,
# #     db: Session = Depends(get_db),
# # ):
# #     try:
# #         return service.create_category(db, data)
# #     except ValueError as exc:
# #         raise HTTPException(
# #             status_code=400,
# #             detail=str(exc),
# #         )


# # @router.get(
# #     "/categories",
# #     response_model=List[schemas.ExpenseCategoryRead],
# # )
# # def list_categories(
# #     db: Session = Depends(get_db),
# # ):
# #     return service.list_categories(db)


# # @router.post(
# #     "/claims",
# #     response_model=schemas.ExpenseClaimRead,
# # )
# # def create_claim(
# #     data: schemas.ExpenseClaimCreate,
# #     db: Session = Depends(get_db),
# #     current_employee: Employee = Depends(get_current_employee),
# # ):

# #     data.employee_id = current_employee.employee_id

# #     try:
# #         return service.create_claim(db, data)

# #     except service.NotFoundError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )

# #     except service.CapExceededError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )

# #     except service.FutureDateError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )


# # @router.post(
# #     "/claims/{claim_id}/receipt",
# #     response_model=schemas.ExpenseClaimRead,
# # )
# # def upload_receipt(
# #     claim_id: str,
# #     file: UploadFile = File(...),
# #     db: Session = Depends(get_db),
# # ):
# #     """FR-EXP-01: attach a receipt file to an existing claim."""

# #     try:
# #         return service.upload_receipt(
# #             db,
# #             claim_id,
# #             file,
# #         )

# #     except service.NotFoundError as exc:
# #         raise HTTPException(
# #             status_code=404,
# #             detail=str(exc),
# #         )

# #     except service.InvalidReceiptError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )



# # @router.get(
# #     "/claims",
# #     response_model=List[schemas.ExpenseClaimRead],
# # )
# # def list_claims(
# #     employee_id: Optional[str] = None,
# #     db: Session = Depends(get_db),
# # ):
# #     return service.list_claims(
# #         db,
# #         employee_id,
# #     )


# # @router.get(
# #     "/claims/{claim_id}",
# #     response_model=schemas.ExpenseClaimRead,
# # )
# # def get_claim(
# #     claim_id: str,
# #     db: Session = Depends(get_db),
# # ):
# #     try:
# #         return service.get_claim(
# #             db,
# #             claim_id,
# #         )

# #     except service.NotFoundError as exc:
# #         raise HTTPException(
# #             status_code=404,
# #             detail=str(exc),
# #         )



# # @router.post(
# #     "/claims/{claim_id}/approve",
# #     response_model=schemas.ExpenseClaimRead,
# # )
# # def approve_claim(
# #     claim_id: str,
# #     db: Session = Depends(get_db),
# #     current_employee: Employee = Depends(require_approver),
# # ):
# #     try:
# #         return service.approve_claim(
# #             db,
# #             claim_id,
# #             current_employee.access_tier,
# #             current_employee.employee_id,
# #         )

# #     except service.NotFoundError as exc:
# #         raise HTTPException(
# #             status_code=404,
# #             detail=str(exc),
# #         )

# #     except service.InvalidTransitionError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )

# #     except PermissionError as exc:
# #         raise HTTPException(
# #             status_code=403,
# #             detail=str(exc),
# #         )


# # @router.post(
# #     "/claims/{claim_id}/reject",
# #     response_model=schemas.ExpenseClaimRead,
# # )
# # def reject_claim(
# #     claim_id: str,
# #     db: Session = Depends(get_db),
# #     current_employee: Employee = Depends(require_approver),
# # ):
# #     try:
# #         return service.reject_claim(
# #             db,
# #             claim_id,
# #             current_employee.access_tier,
# #             current_employee.employee_id,
# #         )

# #     except service.NotFoundError as exc:
# #         raise HTTPException(
# #             status_code=404,
# #             detail=str(exc),
# #         )

# #     except service.InvalidTransitionError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )

# #     except PermissionError as exc:
# #         raise HTTPException(
# #             status_code=403,
# #             detail=str(exc),
# #         )


# # @router.post(
# #     "/claims/{claim_id}/reimburse",
# #     response_model=schemas.ExpenseClaimRead,
# # )
# # def reimburse_claim(
# #     claim_id: str,
# #     db: Session = Depends(get_db),
# #     current_employee: Employee = Depends(require_approver),
# # ):
# #     try:
# #         return service.mark_reimbursed(
# #             db,
# #             claim_id,
# #         )

# #     except service.NotFoundError as exc:
# #         raise HTTPException(
# #             status_code=404,
# #             detail=str(exc),
# #         )

# #     except service.InvalidTransitionError as exc:
# #         raise HTTPException(
# #             status_code=422,
# #             detail=str(exc),
# #         )


# # @router.get(
# #     "/employees/{employee_id}/pending-total",
# #     response_model=schemas.PendingTotal,
# # )
# # def pending_total(
# #     employee_id: str,
# #     db: Session = Depends(get_db),
# # ):
# #     return service.pending_reimbursement_total(
# #         db,
# #         employee_id,
# #     )


# # @router.get(
# #     "/projects/{project_id}/rollup",
# #     response_model=schemas.ProjectExpenseRollup,
# # )
# # def project_rollup(
# #     project_id: str,
# #     db: Session = Depends(get_db),
# #     current_employee: Employee = Depends(require_approver),
# # ):
# #     return service.project_expense_rollup(
# #         db,
# #         project_id,
# #     )



# from typing import List, Optional

# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
# from sqlalchemy.orm import Session

# from app.database import get_db
# from app.modules.directory.models import Employee
# from app.modules.expense_claims import schemas, service
# from app.modules.expense_claims.dependencies import (
#     get_current_employee,
#     require_approver,
# )


# router = APIRouter(
#     prefix="/expenses",
#     tags=["expense-claims"],
# )


# @router.post(
#     "/categories",
#     response_model=schemas.ExpenseCategoryRead,
# )
# def create_category(
#     data: schemas.ExpenseCategoryCreate,
#     db: Session = Depends(get_db),
# ):
#     try:
#         return service.create_category(db, data)

#     except ValueError as exc:
#         raise HTTPException(
#             status_code=400,
#             detail=str(exc),
#         )


# @router.get(
#     "/categories",
#     response_model=List[schemas.ExpenseCategoryRead],
# )
# def list_categories(
#     db: Session = Depends(get_db),
# ):
#     return service.list_categories(db)


# @router.post(
#     "/claims",
#     response_model=schemas.ExpenseClaimRead,
# )
# def create_claim(
#     data: schemas.ExpenseClaimCreate,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(get_current_employee),
# ):
#     # Always use the authenticated employee.
#     data.employee_id = current_employee.employee_id

#     try:
#         return service.create_claim(db, data)

#     except service.NotFoundError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )

#     except service.CapExceededError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )

#     except service.FutureDateError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )


# @router.post(
#     "/claims/{claim_id}/receipt",
#     response_model=schemas.ExpenseClaimRead,
# )
# def upload_receipt(
#     claim_id: str,
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
# ):
#     """FR-EXP-01: attach a receipt file to an existing claim."""

#     try:
#         return service.upload_receipt(
#             db,
#             claim_id,
#             file,
#         )

#     except service.NotFoundError as exc:
#         raise HTTPException(
#             status_code=404,
#             detail=str(exc),
#         )

#     except service.InvalidReceiptError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )


# @router.get(
#     "/claims",
#     response_model=List[schemas.ExpenseClaimRead],
# )
# def list_claims(
#     employee_id: Optional[str] = None,
#     db: Session = Depends(get_db),
# ):
#     return service.list_claims(
#         db,
#         employee_id,
#     )


# # IMPORTANT:
# # This route must appear BEFORE /claims/{claim_id}.
# @router.get(
#     "/claims/approvals",
#     response_model=List[schemas.ExpenseClaimRead],
# )
# def list_approval_claims(
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_approver),
# ):
#     return service.list_approval_claims(
#         db,
#         current_employee,
#     )


# @router.get(
#     "/claims/{claim_id}",
#     response_model=schemas.ExpenseClaimRead,
# )
# def get_claim(
#     claim_id: str,
#     db: Session = Depends(get_db),
# ):
#     try:
#         return service.get_claim(
#             db,
#             claim_id,
#         )

#     except service.NotFoundError as exc:
#         raise HTTPException(
#             status_code=404,
#             detail=str(exc),
#         )


# @router.post(
#     "/claims/{claim_id}/approve",
#     response_model=schemas.ExpenseClaimRead,
# )
# def approve_claim(
#     claim_id: str,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_approver),
# ):
#     try:
#         return service.approve_claim(
#             db,
#             claim_id,
#             current_employee.access_tier,
#             current_employee.employee_id,
#         )

#     except service.NotFoundError as exc:
#         raise HTTPException(
#             status_code=404,
#             detail=str(exc),
#         )

#     except service.InvalidTransitionError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )

#     except PermissionError as exc:
#         raise HTTPException(
#             status_code=403,
#             detail=str(exc),
#         )


# @router.post(
#     "/claims/{claim_id}/reject",
#     response_model=schemas.ExpenseClaimRead,
# )
# def reject_claim(
#     claim_id: str,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_approver),
# ):
#     try:
#         return service.reject_claim(
#             db,
#             claim_id,
#             current_employee.access_tier,
#             current_employee.employee_id,
#         )

#     except service.NotFoundError as exc:
#         raise HTTPException(
#             status_code=404,
#             detail=str(exc),
#         )

#     except service.InvalidTransitionError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )

#     except PermissionError as exc:
#         raise HTTPException(
#             status_code=403,
#             detail=str(exc),
#         )


# @router.post(
#     "/claims/{claim_id}/reimburse",
#     response_model=schemas.ExpenseClaimRead,
# )
# def reimburse_claim(
#     claim_id: str,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_approver),
# ):
#     try:
#         return service.mark_reimbursed(
#             db,
#             claim_id,
#         )

#     except service.NotFoundError as exc:
#         raise HTTPException(
#             status_code=404,
#             detail=str(exc),
#         )

#     except service.InvalidTransitionError as exc:
#         raise HTTPException(
#             status_code=422,
#             detail=str(exc),
#         )


# @router.get(
#     "/employees/{employee_id}/pending-total",
#     response_model=schemas.PendingTotal,
# )
# def pending_total(
#     employee_id: str,
#     db: Session = Depends(get_db),
# ):
#     return service.pending_reimbursement_total(
#         db,
#         employee_id,
#     )


# @router.get(
#     "/projects/{project_id}/rollup",
#     response_model=schemas.ProjectExpenseRollup,
# )
# def project_rollup(
#     project_id: str,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_approver),
# ):
#     return service.project_expense_rollup(
#         db,
#         project_id,
#     )

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


# ============================================================
# CATEGORIES
# ============================================================

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


# ============================================================
# CREATE CLAIM
# ============================================================

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


# ============================================================
# RECEIPT
# ============================================================

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


# ============================================================
# LIST CLAIMS
# ============================================================

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
    """
    If employee_id is supplied:
        return current employee's own claims.

    If employee_id is NOT supplied:
        return claims requiring the current employee's
        approval / claims already decided by that approver.

    Visibility is enforced by service.list_claims().
    """

    return service.list_claims(
        db,
        employee_id=employee_id,
        current_employee=current_employee,
    )


# ============================================================
# GET CLAIM
# ============================================================

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


# ============================================================
# APPROVE
# ============================================================

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


# ============================================================
# REJECT
# ============================================================

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


# ============================================================
# REIMBURSE
# ============================================================

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


# ============================================================
# PENDING TOTAL
# ============================================================

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


# ============================================================
# PROJECT ROLLUP
# ============================================================

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