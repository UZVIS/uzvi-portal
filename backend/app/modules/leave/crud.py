"""
Leave Management (M2) CRUD Operations
=====================================
This module contains the database operations (Create, Read, Update) for the Leave Management system.
It interacts with the database sessions to manage leave types, balances, applications, and audit logs.
"""

from sqlalchemy.orm import Session

from app.modules.directory.models import Employee
from app.modules.leave.models import (
    LeaveApplication,
    LeaveAuditLog,
    LeaveBalance,
    LeaveType,
)
from app.utils import generate_prefixed_id 

# ==========================================
# 1. Employee Directory (M0) Link
# ==========================================
def get_employee_by_id(db: Session, employee_id: str):
    """
    Fetches an employee's details from the central Employee Directory.
    Used to validate if an employee exists before processing leave requests.
    """
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()


# ==========================================
# 2. Leave Types (CL, SL, ML) Operations
# ==========================================
def get_leave_types(db: Session):
    """
    Retrieves all available leave types configured in the system.
    """
    return db.query(LeaveType).all()

def get_leave_type_by_id(db: Session, leave_type_id: str):
    """
    Fetches a specific leave type by its unique ID.
    """
    return db.query(LeaveType).filter(LeaveType.leave_type_id == leave_type_id).first()

def create_leave_type(db: Session, leave_type: LeaveType):
    """
    Creates a new leave type in the system.
    Automatically generates a prefixed ID (e.g., 'LT001').
    """
    new_id = generate_prefixed_id(db, LeaveType, "leave_type_id", "LT")
    leave_type.leave_type_id = new_id

    db.add(leave_type)
    db.commit()
    db.refresh(leave_type) 
    return leave_type


# ==========================================
# 3. Leave Balance (Wallet) Operations
# ==========================================
def get_leave_balance(db: Session, employee_id: str, leave_type_id: str):
    """
    Retrieves the leave balance for a specific employee and a specific leave type.
    Used to check if an employee has enough balance before applying for leave.
    """
    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == leave_type_id,
    ).first()

def get_leave_balances(db: Session, employee_id: str):
    """
    Retrieves all leave balances (the entire leave wallet) for a specific employee.
    """
    return db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).all()

def update_leave_balance(db: Session, leave_balance: LeaveBalance):
    """
    Commits updates to an employee's leave balance.
    Typically used to deduct days after a leave application is approved.
    """
    db.commit()
    db.refresh(leave_balance)
    return leave_balance

def create_leave_balance(db: Session, leave_balance: LeaveBalance):
    """
    Initializes a new leave balance record for an employee.
    Automatically generates a prefixed ID (e.g., 'LB001').
    """
    new_id = generate_prefixed_id(db, LeaveBalance, "balance_id", "LB")
    leave_balance.balance_id = new_id

    db.add(leave_balance)
    db.commit()
    db.refresh(leave_balance)
    return leave_balance


# ==========================================
# 4. Leave Application Operations
# ==========================================
def create_leave_application(db: Session, application: LeaveApplication):
    """
    Creates a new leave application for an employee.
    Automatically generates a prefixed ID (e.g., 'LA001') before saving to the database.
    """
    new_id = generate_prefixed_id(db, LeaveApplication, "application_id", "LA")
    application.application_id = new_id

    db.add(application)
    db.commit()
    db.refresh(application)
    return application

def get_leave_applications(db: Session):
    """
    Retrieves a list of all leave applications across the organization.
    Typically used by managers or HR to view pending team requests.
    """
    return db.query(LeaveApplication).all()

def get_leave_application_by_id(db: Session, application_id: str):
    """
    Fetches a specific leave application using its unique ID.
    Useful for retrieving full details of a request before an Approve/Reject action.
    """
    return db.query(LeaveApplication).filter(LeaveApplication.application_id == application_id).first()

def update_leave_application(db: Session, application: LeaveApplication):
    """
    Commits changes made to an existing leave application to the database.
    Primarily used when a manager updates the status (e.g., PENDING to APPROVED).
    """
    db.commit()
    db.refresh(application)
    return application


# ==========================================
# 5. Audit Log (History Trackers)
# ==========================================
def create_audit_log(db: Session, audit_log: LeaveAuditLog):
    """
    Creates an immutable audit log entry for a leave application action.
    Automatically generates a prefixed ID (e.g., 'AL001').
    Used for compliance and tracking approval/rejection history.
    """
    new_id = generate_prefixed_id(db, LeaveAuditLog, "log_id", "AL")
    audit_log.log_id = new_id

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log