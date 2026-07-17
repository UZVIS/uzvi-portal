
from datetime import date
from typing import Optional, Dict

from pydantic import BaseModel, Field

ALLOWED_STATUSES = ["Submitted", "Approved", "Rejected", "Reimbursed"]


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
    # Accepted but not yet persisted - see module TODO on schema gap.
    description: Optional[str] = None
    receipt_attached: Optional[bool] = None


class ExpenseClaimRead(BaseModel):
    claim_id: str
    employee_id: str
    category_id: str
    project_id: Optional[str] = None
    amount: float
    date: date
    status: str

    model_config = {"from_attributes": True}


class ClaimDecision(BaseModel):
    # NFR-SEC-01: this should come from the authenticated caller, not the
    # request body, once real auth exists (V1 has no auth yet - NFR-SEC-05).
    decided_by_role: str  # "Manager" | "Admin" | "HR-Restricted"


class PendingTotal(BaseModel):
    employee_id: str
    pending_reimbursement_total: float
    claim_count: int


class ProjectExpenseRollup(BaseModel):
    project_id: str
    total_amount: float
    claim_count: int
    by_status: Dict[str, float]
