# from datetime import datetime

from sqlalchemy.orm import Session

from app.modules.m0_employee.models import Employee
from app.modules.m2_leavemanagement.models import (
    LeaveApplication,
    LeaveAuditLog,
    LeaveBalance,
    LeaveType,
)
# from app.modules.m2_leavemanagement.schemas import LeaveApplicationCreate

def get_employee_by_id(
    db: Session,
    employee_id: str,
):
    return (
        db.query(Employee)
        .filter(Employee.employee_id == employee_id)
        .first()
    )

def get_leave_type_by_id(
    db: Session,
    leave_type_id: str,
):
    return (
        db.query(LeaveType)
        .filter(
            LeaveType.leave_type_id == leave_type_id
        )
        .first()
    )

def get_leave_balance(
    db: Session,
    employee_id: str,
    leave_type_id: str,
):
    return (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == leave_type_id,
        )
        .first()
    )

def create_leave_application(
    db: Session,
    application: LeaveApplication,
):
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

def create_audit_log(
    db: Session,
    audit_log: LeaveAuditLog,
):
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log