"""
Leave Management (M2) Business Logic (Services)
===============================================
This module contains the core business logic for handling leave types,
balances, applications, and the approval workflow. It acts as a bridge 
between the API routers and the database CRUD operations.

"""

from datetime import datetime, date
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

# ⚠️ IMPORTANT: Import your Employee model here based on your project structure.
# Assuming it's in a directory module, for example:
from app.modules.directory.models import Employee 


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
    # Validate employee exists in the shared Employee Directory (M0)
    employee = crud.get_employee_by_id(db=db, employee_id=leave_balance.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in Employee Directory")

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
    # Validate employee exists in the shared Employee Directory (M0)
    employee = crud.get_employee_by_id(db=db, employee_id=application_data.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in Employee Directory")

    new_app = LeaveApplication(
        employee_id=application_data.employee_id,
        leave_type_id=application_data.leave_type_id,
        start_date=application_data.start_date,
        end_date=application_data.end_date,
        status=LeaveStatusEnum.PENDING 
    )
    return crud.create_leave_application(db=db, application=new_app)

def get_leave_applications(db: Session):
    """
    Retrieves a list of all leave applications.
    """
    return crud.get_leave_applications(db=db)

# ⭐ NEW FUNCTION: Calculate Team Leave Percentage
def calculate_team_leave_percentage(db: Session, team_id: str) -> float:
    """
    Calculates the percentage of team members currently on an approved leave today.
    """
    if not team_id:
        return 0.0

    # 1. Get total members in the team
    total_members = db.query(Employee).filter(Employee.team_id == team_id).count()
    if total_members == 0:
        return 0.0

    # 2. Get members currently on leave today
    today = date.today()
    employees_on_leave = db.query(LeaveApplication).join(Employee).filter(
        Employee.team_id == team_id,
        LeaveApplication.status == LeaveStatusEnum.APPROVED,
        LeaveApplication.start_date <= today,
        LeaveApplication.end_date >= today
    ).count()

    # 3. Calculate percentage
    return (employees_on_leave / total_members) * 100.0


# ⭐ UPDATED FUNCTION: Includes Force logic and Percentage checking
def update_leave_status(db: Session, application_id: str, leave_status: LeaveStatusUpdate, force: bool = False):
    """
    Handles the approval or rejection workflow of a leave application.
    Checks team availability before approving unless forced.
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

    employee = crud.get_employee_by_id(db=db, employee_id=application.employee_id)

    # ⭐ Step 3: Check Team Availability (The 30% Rule)
    if leave_status.status == LeaveStatusEnum.APPROVED and not force:
        if employee and getattr(employee, 'team_id', None):
            percentage = calculate_team_leave_percentage(db, employee.team_id)
            
            if percentage >= 30.0:
                # Return the warning instead of processing the leave
                return {
                    "approved": False,
                    "warning": True,
                    "percentage": round(percentage, 2),
                    "message": f"{round(percentage)}% of your team is already on leave. Please review before approving."
                }

    # Step 4: Handle balance deduction if the manager approves the request
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

    # Step 5: Update the application status and approver details
    application.status = leave_status.status
    application.approver_id = leave_status.approver_id
    updated_application = crud.update_leave_application(db=db, application=application)

    # Step 6: Generate an audit log for security and historical tracking
    new_audit = LeaveAuditLog(
        application_id=application.application_id,
        actor_id=leave_status.approver_id,
        action=leave_status.status.value 
    )
    crud.create_audit_log(db=db, audit_log=new_audit)

    # ⭐ Step 7: Return final success response matching our schema
    return {
        "approved": True,
        "warning": False,
        "percentage": 0.0,
        "message": f"Leave request {leave_status.status.value.lower()} successfully."
    }