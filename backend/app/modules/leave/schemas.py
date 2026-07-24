"""
Leave Management (M2) Pydantic Schemas
======================================
This module defines the Pydantic models used for data validation, 
request payload parsing, and response serialization in the API layer.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date, datetime
from enum import Enum


class LeaveStatusEnum(str, Enum):
    """
    Enumeration for leave application statuses.
    """
    PENDING = "pending"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# ==========================================
# Leave Type Schemas
# ==========================================

class LeaveTypeCreate(BaseModel):
    """
    Schema for creating a new leave type.
    """
    name: str = Field(..., description="Name of the leave (e.g., Casual Leave, Sick Leave)")
    accrual_method: str
    carry_forward_limit: int
    doc_required_threshold: Optional[int] = None

class LeaveTypeResponse(LeaveTypeCreate):
    """
    Schema for returning leave type details.
    """
    leave_type_id: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Leave Application Schemas
# ==========================================

class LeaveApplicationCreate(BaseModel):
    """
    Schema for an employee applying for a new leave.
    """
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date
    reason: str

class LeaveApplicationResponse(LeaveApplicationCreate):
    """
    Schema for returning leave application details, including its current status.
    """
    application_id: str
    status: LeaveStatusEnum
    approver_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class LeaveStatusUpdate(BaseModel):
    """
    Schema for managers to approve or reject a leave application.
    """
    status: LeaveStatusEnum = Field(..., description="Leave status (APPROVED or REJECTED)")
    approver_id: str = Field(..., description="Employee ID of the manager taking action")


# ==========================================
# Leave Balance Schemas
# ==========================================

class LeaveBalanceCreate(BaseModel):
    """
    Schema for initializing or adding to an employee's leave balance wallet.
    """
    employee_id: str
    leave_type_id: str
    year: int
    balance: int

class LeaveBalanceResponse(LeaveBalanceCreate):
    """
    Schema for returning an employee's leave balance details.
    """
    balance_id: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Leave Audit Log Schemas
# ==========================================

class LeaveAuditLogResponse(BaseModel):
    """
    Schema for returning audit log entries to track the history of leave actions.
    """
    log_id: str
    application_id: str
    actor_id: str
    action: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)