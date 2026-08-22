


from datetime import date, datetime
from typing import Optional, Dict

from pydantic import BaseModel, Field


ALLOWED_STATUSES = [
    "Submitted",
    "Manager Approved",
    "Approved",
    "Rejected",
    "Reimbursed",
]


ALLOWED_RECEIPT_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
}


MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024


class ExpenseCategoryCreate(BaseModel):
    category_id: str
    name: str
    cap_amount: Optional[float] = None


class ExpenseCategoryRead(
    ExpenseCategoryCreate
):
    model_config = {
        "from_attributes": True
    }


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

    employee_name: Optional[str] = None

    category_id: str

    project_id: Optional[str] = None

    amount: float

    date: date

    status: str

    description: Optional[str] = None

    receipt_file_path: Optional[str] = None

    # ========================================================
    # DECISION INFORMATION
    # ========================================================

    # Role of the person who made the latest decision
    decided_by_role: Optional[str] = None

    # Employee ID of the person who made the latest decision
    decided_by: Optional[str] = None

    # Name of the person who made the latest decision
    decided_by_name: Optional[str] = None

    # Date/time of the latest decision
    decided_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


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