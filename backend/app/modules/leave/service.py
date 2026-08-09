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

from app.modules.directory.models import Employee

# ==========================================
# 1. Leave Type (Rules) Logic
# ==========================================
def create_leave_type(db: Session, leave_type: LeaveTypeCreate):
    """
    Instantiates a new LeaveType model and passes it to the CRUD layer.
    """
    new_leave_type = LeaveType(
        name=leave_type.name,
        accrual_method=leave_type.accrual_method,
        carry_forward_limit=leave_type.carry_forward_limit,
        doc_required_threshold=leave_type.doc_required_threshold,
        requires_hr_approval=leave_type.requires_hr_approval
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

def get_leave_applications(db: Session, employee_id: str = None, role: str = None):
    """
    Retrieves leave applications scoped securely by user role and identity:
    - Employee: Retrieves only their own submitted leave applications.
    - Manager: Retrieves pending leave requests specifically from their direct subordinates.
    - HR: Retrieves applications requiring final verification (PENDING_HR state).
    - Admin / Others: Retrieves organization-wide leave records.
    """
    query = db.query(LeaveApplication)
    
    user_role = role.strip() if role else ""
    
    if user_role == "Employee" and employee_id:
        query = query.filter(LeaveApplication.employee_id == employee_id)
        
    elif user_role == "Manager" and employee_id:
        # Subquery to identify all employee IDs reporting directly to this manager
        manager_team_employees = db.query(
            Employee.employee_id
        ).filter(
            Employee.manager_id == employee_id
        ).subquery()
        
        # Filter applications belonging to subordinates and strictly matching PENDING status
        query = query.filter(
            LeaveApplication.employee_id.in_(manager_team_employees),
            LeaveApplication.status == LeaveStatusEnum.PENDING
        )
        
    elif user_role == "HR":
        # Filter strictly for requests requiring HR review and sign-off
        query = query.filter(
            LeaveApplication.status == LeaveStatusEnum.PENDING_HR
        )
        
    return query.all()

def calculate_team_leave_percentage(db: Session, team_id: str) -> float:
    """
    Calculates the percentage of team members currently on an approved leave today.
    """
    if not team_id:
        return 0.0

    total_members = db.query(Employee).filter(Employee.team_id == team_id).count()
    if total_members == 0:
        return 0.0

    today = date.today()
    
    employees_on_leave = db.query(LeaveApplication).join(
        Employee,
        LeaveApplication.employee_id == Employee.employee_id
    ).filter(
        Employee.team_id == team_id,
        LeaveApplication.status == LeaveStatusEnum.APPROVED,
        LeaveApplication.start_date <= today,
        LeaveApplication.end_date >= today
    ).count()

    return (employees_on_leave / total_members) * 100.0

def update_leave_status(db: Session, application_id: str, leave_status: LeaveStatusUpdate, force: bool = False):
    """
    Handles the approval or rejection workflow of a leave application.
    Enforces role security, dynamic HR routing, team availability thresholds,
    and final balance deductions.
    """
    application = crud.get_leave_application_by_id(db=db, application_id=application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    current_status = getattr(application.status, "value", application.status).upper()

    if current_status in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail=f"Application is already {current_status}")

    employee = crud.get_employee_by_id(db=db, employee_id=application.employee_id)
    approver = crud.get_employee_by_id(db=db, employee_id=leave_status.approver_id)
    
    if not approver:
        raise HTTPException(status_code=404, detail="Approver profile not found in system")

    approver_tier = getattr(approver, "access_tier", "")
    allowed_management_tiers = ["Manager", "Admin", "Admin/Leadership", "HR-Restricted"]

    if approver_tier not in allowed_management_tiers:
        raise HTTPException(status_code=403, detail="Access denied. You are not authorized to perform this action.")
    
    leave_type = db.query(LeaveType).filter(LeaveType.leave_type_id == application.leave_type_id).first()
    total_days = (application.end_date - application.start_date).days + 1

    requested_action = getattr(leave_status.status, "value", leave_status.status).upper()
    target_status = requested_action
    is_final_approval = False

    is_admin_override = approver_tier in ["Admin", "Admin/Leadership"]

    if requested_action == "APPROVED":
        if current_status == "PENDING":
            needs_hr = leave_type.requires_hr_approval if leave_type else False
            doc_threshold = leave_type.doc_required_threshold if leave_type else 0
            
            # Admins override the HR requirement flow and approve directly
            if (needs_hr or (doc_threshold > 0 and total_days > doc_threshold)) and not is_admin_override:
                target_status = "PENDING_HR"
                is_final_approval = False
            else:
                target_status = "APPROVED"
                is_final_approval = True
                
        elif current_status == "PENDING_HR":
            if approver_tier not in ["HR-Restricted", "Admin", "Admin/Leadership"]:
                raise HTTPException(
                    status_code=403, 
                    detail="Access denied. Only HR or Admin personnel can perform final verification."
                )
            target_status = "APPROVED"
            is_final_approval = True
            
    elif requested_action == "REJECTED":
        target_status = "REJECTED"
        is_final_approval = False

    # Skip 30% warning check if actor is an Admin/Leadership enforcing an override
    if target_status in ["APPROVED", "PENDING_HR"] and current_status == "PENDING" and not force and not is_admin_override:
        if employee and getattr(employee, 'team_id', None):
            percentage = calculate_team_leave_percentage(db, employee.team_id)
            
            if percentage >= 30.0:
                return {
                    "approved": False,
                    "status": LeaveStatusEnum.PENDING,
                    "warning": True,
                    "percentage": round(percentage, 2),
                    "message": f"{round(percentage)}% of your team is already on leave. Please review before approving."
                }

    if is_final_approval:
        leave_balance = crud.get_leave_balance(
            db=db,
            employee_id=application.employee_id,
            leave_type_id=application.leave_type_id,
        )
        if not leave_balance:
            raise HTTPException(status_code=404, detail="Leave balance not found for this employee")

        if leave_balance.balance < total_days:
             raise HTTPException(
                 status_code=400, 
                 detail=f"Insufficient leave balance. Requested {total_days} days, but only {leave_balance.balance} available."
             )

        leave_balance.balance -= total_days
        crud.update_leave_balance(db=db, leave_balance=leave_balance)

    application.status = target_status
    application.approver_id = leave_status.approver_id
    updated_application = crud.update_leave_application(db=db, application=application)

    new_audit = LeaveAuditLog(
        application_id=application.application_id,
        actor_id=leave_status.approver_id,
        action=target_status 
    )
    crud.create_audit_log(db=db, audit_log=new_audit)

    if target_status == "PENDING_HR":
        return {
            "approved": False,
            "status": LeaveStatusEnum.PENDING_HR,
            "warning": False,
            "percentage": 0.0,
            "message": "Leave request approved and forwarded to HR for final verification."
        }
    elif target_status == "APPROVED":
        return {
            "approved": True,
            "status": LeaveStatusEnum.APPROVED,
            "warning": False,
            "percentage": 0.0,
            "message": "Leave request fully approved successfully."
        }
    else:
        return {
            "approved": False,
            "status": LeaveStatusEnum.REJECTED,
            "warning": False,
            "percentage": 0.0,
            "message": "Leave request rejected successfully."
        }


def clean_test_leave_data(db: Session):
    """
    Development-only helper to wipe test leave applications and audit logs
    without touching employees, teams, or leave types.
    """
    return crud.reset_all_leave_data(db=db)