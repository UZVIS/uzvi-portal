from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# -----------------------------
# Leave Application Schemas
# -----------------------------

class LeaveApplicationBase(BaseModel):
    employee_id: str = Field(
        ...,
        description="Employee ID of the applicant"
    )

    leave_type_id: str = Field(
        ...,
        description="Selected leave type"
    )

    start_date: date = Field(
        ...,
        description="Leave start date"
    )

    end_date: date = Field(
        ...,
        description="Leave end date"
    )

    reason: str = Field(
        ...,
        description="Reason for leave application"
    )


class LeaveApplicationCreate(LeaveApplicationBase):
    pass


class LeaveApplicationUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None


class LeaveApplicationResponse(LeaveApplicationBase):
    application_id: str
    status: str
    approver_id: Optional[str]

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Leave Type Schemas
# -----------------------------

class LeaveTypeBase(BaseModel):
    name: str = Field(
        ...,
        description="Leave type name"
    )

    accrual_method: str = Field(
        ...,
        description="Leave accrual method"
    )

    carry_forward_limit: int = Field(
        ...,
        description="Maximum carry forward limit"
    )

    doc_required_threshold: Optional[int] = Field(
        None,
        description="Document required threshold"
    )


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeResponse(LeaveTypeBase):
    leave_type_id: str

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Leave Balance Schemas
# -----------------------------

class LeaveBalanceBase(BaseModel):
    employee_id: str = Field(
        ...,
        description="Employee ID"
    )

    leave_type_id: str = Field(
        ...,
        description="Leave Type ID"
    )

    year: int = Field(
        ...,
        description="Balance year"
    )

    balance: int = Field(
        ...,
        description="Available leave balance"
    )

class LeaveBalanceCreate(LeaveBalanceBase):
    pass


class LeaveBalanceResponse(LeaveBalanceBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


# -----------------------------
# Leave Audit Log Schemas
# -----------------------------

class LeaveAuditLogBase(BaseModel):
    application_id: str = Field(
        ...,
        description="Leave Application ID"
    )

    actor_id: str = Field(
        ...,
        description="Employee performing the action"
    )

    action: str = Field(
        ...,
        description="Audit action"
    )

    timestamp: datetime = Field(
        ...,
        description="Action timestamp"
    )


class LeaveAuditLogCreate(LeaveAuditLogBase):
    pass


class LeaveAuditLogResponse(LeaveAuditLogBase):
    log_id: str

    model_config = ConfigDict(from_attributes=True)