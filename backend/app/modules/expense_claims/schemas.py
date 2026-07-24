from datetime import date
from typing import Optional, Dict

from pydantic import BaseModel, Field

ALLOWED_STATUSES = ["Submitted", "Approved", "Rejected", "Reimbursed"]
ALLOWED_RECEIPT_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class ExpenseCategoryCreate(BaseModel):
    category_id: str
    name: str
    cap_amount: Optional[float] = None


class ExpenseCategoryRead(ExpenseCategoryCreate):
    model_config = {"from_attributes": True}


class ExpenseClaimCreate(BaseModel):
    claim_id: str
    employee_id: str
    category_id: str
    project_id: Optional[str] = None
    amount: float = Field(gt=0)
    date: date
    description: Optional[str] = None
    


class ExpenseClaimRead(BaseModel):
    claim_id: str
    employee_id: str
    category_id: str
    project_id: Optional[str] = None
    amount: float
    date: date
    status: str
    description: Optional[str] = None
    receipt_file_path: Optional[str] = None

    model_config = {"from_attributes": True}


class ClaimDecision(BaseModel):
    decided_by_role: str


class PendingTotal(BaseModel):
    employee_id: str
    pending_reimbursement_total: float
    claim_count: int


class ProjectExpenseRollup(BaseModel):
    project_id: str
    total_amount: float
    claim_count: int
    by_status: Dict[str, float]