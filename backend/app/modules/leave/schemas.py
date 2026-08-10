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
    Enumeration representing the possible states of a leave application.
    """
    PENDING = "pending"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PENDING_HR = "PENDING_HR"


# ==========================================
# Leave Type Schemas
# ==========================================

class LeaveTypeCreate(BaseModel):
    """
    Schema for creating a new leave type configuration.
    """
    name: str = Field(..., description="Name of the leave type (e.g., Casual Leave, Sick Leave)")
    accrual_method: str
    carry_forward_limit: int
    doc_required_threshold: Optional[int] = None
    requires_hr_approval: bool = False

class LeaveTypeResponse(LeaveTypeCreate):
    """
    Schema for returning leave type details including its unique identifier.
    """
    leave_type_id: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Leave Application Schemas
# ==========================================

class LeaveApplicationCreate(BaseModel):
    """
    Schema for processing a new leave application request from an employee.
    """
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date

class LeaveApplicationResponse(LeaveApplicationCreate):
    """
    Schema for returning leave application details, tracking its current status and approver.
    """
    application_id: str
    status: LeaveStatusEnum
    approver_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class LeaveStatusUpdate(BaseModel):
    """
    Schema for actors (Managers or HR) to approve or reject a leave application.
    """
    status: LeaveStatusEnum = Field(..., description="Target leave status action")
    approver_id: str = Field(..., description="Employee ID of the actor executing the change")

class LeaveApprovalResponse(BaseModel):
    """
    Schema for returning the result of an approval action, including target status and warnings.
    """
    approved: bool
    status: LeaveStatusEnum
    warning: bool = False
    percentage: Optional[float] = 0.0
    message: str


# ==========================================
# Leave Balance Schemas
# ==========================================

class LeaveBalanceCreate(BaseModel):
    """
    Schema for initializing or allocating a digital leave balance wallet for an employee.
    """
    employee_id: str
    leave_type_id: str
    year: int
    balance: int

class LeaveBalanceResponse(LeaveBalanceCreate):
    """
    Schema for returning an employee's leave balance details with a unique identifier.
    """
    id: str

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Leave Audit Log Schemas
# ==========================================

class LeaveAuditLogResponse(BaseModel):
    """
    Schema for returning audit log entries tracking the complete history of leave actions.
    """
    log_id: str
    application_id: str
    actor_id: str
    action: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)