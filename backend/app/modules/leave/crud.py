"""
Leave Management (M2) CRUD Operations
================================     
This module contains the database operations (Create, Read, Update) for the Leave Management system.
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
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()

# ==========================================
# 2. Leave Types Operations
# ==========================================
def get_leave_types(db: Session):
    return db.query(LeaveType).all()

def get_leave_type_by_id(db: Session, leave_type_id: str):
    return db.query(LeaveType).filter(LeaveType.leave_type_id == leave_type_id).first()

def create_leave_type(db: Session, leave_type: LeaveType):
    new_id = generate_prefixed_id(db, LeaveType, "leave_type_id", "LT")
    leave_type.leave_type_id = new_id
    db.add(leave_type)
    db.commit()
    db.refresh(leave_type) 
    return leave_type

# ==========================================
# 3. Leave Balance Operations
# ==========================================
def get_leave_balance(db: Session, employee_id: str, leave_type_id: str):
    return db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.leave_type_id == leave_type_id,
    ).first()

def get_leave_balances(db: Session, employee_id: str):
    return db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee_id).all()

def update_leave_balance(db: Session, leave_balance: LeaveBalance):
    db.commit()
    db.refresh(leave_balance)
    return leave_balance

def create_leave_balance(db: Session, leave_balance: LeaveBalance):
    new_id = generate_prefixed_id(db, LeaveBalance, "id", "LB")
    leave_balance.id = new_id
    db.add(leave_balance)
    db.commit()
    db.refresh(leave_balance)
    return leave_balance

# ==========================================
# 4. Leave Application Operations
# ==========================================
def create_leave_application(db: Session, application: LeaveApplication):
    new_id = generate_prefixed_id(db, LeaveApplication, "application_id", "LA")
    application.application_id = new_id
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

def get_leave_applications(db: Session):
    return db.query(LeaveApplication).all()

def get_leave_application_by_id(db: Session, application_id: str):
    return db.query(LeaveApplication).filter(LeaveApplication.application_id == application_id).first()

def update_leave_application(db: Session, application: LeaveApplication):
    db.commit()
    db.refresh(application)
    return application

# ==========================================
# 5. Audit Log (History Trackers)
# ==========================================
def create_audit_log(db: Session, audit_log: LeaveAuditLog):
    new_id = generate_prefixed_id(db, LeaveAuditLog, "log_id", "AL")
    audit_log.log_id = new_id
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log

# ==========================================
# 6. Default Initialization & Utilities
# ==========================================
def initialize_default_leave_types(db: Session):
    """
    Automatically creates system-defined leave types if they don't exist.
    """
    default_leave_types = [
        {"id": "LT001", "name": "Earned Leave", "accrual": "Yearly", "cf_limit": 10, "doc": 0, "hr": False},
        {"id": "LT002", "name": "Casual Leave", "accrual": "Yearly", "cf_limit": 0, "doc": 0, "hr": False},
        {"id": "LT003", "name": "Sick Leave", "accrual": "Yearly", "cf_limit": 0, "doc": 3, "hr": False},
        {"id": "LT004", "name": "Maternity Leave", "accrual": "One-Time", "cf_limit": 0, "doc": 0, "hr": True},
        {"id": "LT005", "name": "Paternity Leave", "accrual": "One-Time", "cf_limit": 0, "doc": 0, "hr": True},
        {"id": "LT006", "name": "Compensatory Off", "accrual": "Automated", "cf_limit": 0, "doc": 0, "hr": False},
        {"id": "LT007", "name": "Bereavement Leave", "accrual": "Incident", "cf_limit": 0, "doc": 0, "hr": True},
    ]

    for lt in default_leave_types:
        existing = db.query(LeaveType).filter(LeaveType.leave_type_id == lt["id"]).first()
        if not existing:
            new_lt = LeaveType(
                leave_type_id=lt["id"],
                name=lt["name"],
                accrual_method=lt["accrual"],
                carry_forward_limit=lt["cf_limit"],
                doc_required_threshold=lt["doc"],
                requires_hr_approval=lt["hr"]
            )
            db.add(new_lt)
    db.commit()
    return True

def reset_all_leave_data(db: Session):
    # 1. Delete all audit logs first
    db.query(LeaveAuditLog).delete(synchronize_session=False)
    # 2. Delete all leave applications
    db.query(LeaveApplication).delete(synchronize_session=False)
    # 3. Reset each leave balance based on its specific leave type limit
    balances = db.query(LeaveBalance).all()
    
    default_limits = {
        "LT001": 18,  # Earned Leave
        "LT002": 12,  # Casual Leave
        "LT003": 12,  # Sick Leave
        "LT004": 180, # Maternity Leave
        "LT005": 15,  # Paternity Leave
        "LT006": 0,   # Comp Off
        "LT007": 5    # Bereavement 
    }
    
    for balance in balances:
        balance.balance = default_limits.get(balance.leave_type_id, 12)
        
    db.commit()
    return True