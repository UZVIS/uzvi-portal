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
    name: str = Field(..., description="Name of the leave type (e.g., Casual Leave, Sick Leave)")
    accrual_method: str
    carry_forward_limit: int
    doc_required_threshold: Optional[int] = None
    requires_hr_approval: bool = False

class LeaveTypeResponse(LeaveTypeCreate):
    leave_type_id: str
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Leave Application Schemas
# ==========================================

class EmployeeBasicInfo(BaseModel):
    """
    Schema for fetching basic employee details from M0 without data duplication.
    Ensure these fields match your M0 Employee model attributes.
    """
    employee_id: str
    name: Optional[str] = None 
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    team_id: Optional[str] = None
    gender: Optional[str] = "Male"

    model_config = ConfigDict(from_attributes=True)


class LeaveApplicationCreate(BaseModel):
    employee_id: str
    leave_type_id: str
    start_date: date
    end_date: date


class LeaveApplicationResponse(LeaveApplicationCreate):
    application_id: str
    status: LeaveStatusEnum
    approver_id: Optional[str] = None
    
    # Appended Employee Details from M0 via joinedload
    employee: Optional[EmployeeBasicInfo] = None
    
    model_config = ConfigDict(from_attributes=True)


class LeaveStatusUpdate(BaseModel):
    status: LeaveStatusEnum = Field(..., description="Target leave status action")
    approver_id: str = Field(..., description="Employee ID of the actor executing the change")

class LeaveApprovalResponse(BaseModel):
    approved: bool
    status: LeaveStatusEnum
    warning: bool = False
    percentage: Optional[float] = 0.0
    message: str


# ==========================================
# Leave Balance Schemas
# ==========================================

class LeaveBalanceCreate(BaseModel):
    employee_id: str
    leave_type_id: str
    year: int
    balance: int

class LeaveBalanceResponse(LeaveBalanceCreate):
    id: str
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Leave Audit Log Schemas
# ==========================================

class LeaveAuditLogResponse(BaseModel):
    log_id: str
    application_id: str
    actor_id: str
    action: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)