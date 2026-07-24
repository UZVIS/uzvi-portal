"""
Leave Management (M2) Business Logic (Services)
===============================================
This module contains the core business logic for handling leave types,
balances, applications, and the approval workflow. It acts as a bridge 
between the API routers and the database CRUD operations.
"""

from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.leave import crud
from app.modules.leave.models import (
    LeaveApplication,
    LeaveAuditLog,
    LeaveType,
    LeaveBalance
)
from app.modules.leave.schemas import (
    LeaveApplicationCreate,
    LeaveTypeCreate,
    LeaveBalanceCreate,
    LeaveStatusUpdate,
    LeaveStatusEnum
)


# ==========================================
# 1. Leave Type (Rules) Logic
# ==========================================

def create_leave_type(db: Session, leave_type: LeaveTypeCreate):
    """
    Instantiates a new LeaveType model and passes it to the CRUD layer.
    (ID generation is handled dynamically in the CRUD layer).
    """
    new_leave_type = LeaveType(
        name=leave_type.name,
        accrual_method=leave_type.accrual_method,
        carry_forward_limit=leave_type.carry_forward_limit,
        doc_required_threshold=leave_type.doc_required_threshold,
    )
    return crud.create_leave_type(db=db, leave_type=new_leave_type)

def get_leave_types(db: Session):
    """
    Retrieves all configured leave types.
    """
    return crud.get_leave_types(db)


# ==========================================
# 2. Leave Balance Logic
# ==========================================

def create_leave_balance(db: Session, leave_balance: LeaveBalanceCreate):
    """
    Instantiates a new LeaveBalance model (wallet) for an employee.
    """
    new_leave_balance = LeaveBalance(
        employee_id=leave_balance.employee_id,
        leave_type_id=leave_balance.leave_type_id,
        year=leave_balance.year,
        balance=leave_balance.balance,
    )
    return crud.create_leave_balance(db=db, leave_balance=new_leave_balance)
    
def get_leave_balances(db: Session, employee_id: str):
    """
    Retrieves all leave balances for a specific employee.
    """
    return crud.get_leave_balances(db=db, employee_id=employee_id)


# ==========================================
# 3. Leave Application & Approval Logic
# ==========================================

def create_leave_application(db: Session, application_data: LeaveApplicationCreate):
    """
    Processes a new leave request from an employee.
    Defaults the status to PENDING before saving.
    """
    new_app = LeaveApplication(
        employee_id=application_data.employee_id,
        leave_type_id=application_data.leave_type_id,
        start_date=application_data.start_date,
        end_date=application_data.end_date,
        reason=application_data.reason,
        status=LeaveStatusEnum.PENDING 
    )
    return crud.create_leave_application(db=db, application=new_app)

def get_leave_applications(db: Session):
    """
    Retrieves a list of all leave applications.
    """
    return crud.get_leave_applications(db=db)

def update_leave_status(db: Session, application_id: str, leave_status: LeaveStatusUpdate):
    """
    Handles the approval or rejection workflow of a leave application.
    Deducts the required days from the employee's balance if approved,
    and logs the action in the audit trail.
    """
    # Step 1: Verify the application exists
    application = crud.get_leave_application_by_id(db=db, application_id=application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    # Step 2: Prevent modification if already processed
    if application.status in [LeaveStatusEnum.APPROVED, LeaveStatusEnum.REJECTED]:
        raise HTTPException(status_code=400, detail=f"Application is already {application.status.value}")

    # Step 3: Handle balance deduction if the manager approves the request
    if leave_status.status == LeaveStatusEnum.APPROVED:
        leave_balance = crud.get_leave_balance(
            db=db,
            employee_id=application.employee_id,
            leave_type_id=application.leave_type_id,
        )
        if not leave_balance:
            raise HTTPException(status_code=404, detail="Leave balance not found for this employee")

        # Calculate the total days requested (inclusive of start and end dates)
        total_days = (application.end_date - application.start_date).days + 1
        
        # Verify sufficient balance exists
        if leave_balance.balance < total_days:
             raise HTTPException(
                 status_code=400, 
                 detail=f"Insufficient leave balance. Requested {total_days} days, but only {leave_balance.balance} available."
             )

        # Deduct the days and update the balance
        leave_balance.balance -= total_days
        crud.update_leave_balance(db=db, leave_balance=leave_balance)

    # Step 4: Update the application status and approver details
    application.status = leave_status.status
    application.approver_id = leave_status.approver_id
    updated_application = crud.update_leave_application(db=db, application=application)

    # Step 5: Generate an audit log for security and historical tracking
    new_audit = LeaveAuditLog(
        application_id=application.application_id,
        actor_id=leave_status.approver_id,
        action=leave_status.status.value 
    )
    crud.create_audit_log(db=db, audit_log=new_audit)

    return updated_application