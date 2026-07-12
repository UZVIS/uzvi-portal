import uuid
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.modules.leave import crud
from app.modules.leave.models import (
    LeaveApplication,
    LeaveAuditLog,
)
from app.modules.leave.schemas import (
    LeaveApplicationCreate,
)


def apply_leave(
    db: Session,
    leave: LeaveApplicationCreate,
):
    # Check if employee exists
    employee = crud.get_employee_by_id(
        db=db,
        employee_id=leave.employee_id,
    )
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    # Check if leave type exists
    leave_type = crud.get_leave_type_by_id(
        db=db,
        leave_type_id=leave.leave_type_id,
    )
    if not leave_type:
        raise HTTPException(
            status_code=404,
            detail="Leave type not found",
        )

    # Check if leave balance is sufficient
    leave_balance = crud.get_leave_balance(
        db=db,
        employee_id=leave.employee_id,
        leave_type_id=leave.leave_type_id,
    )
    if not leave_balance or leave_balance.balance <= 0:
        raise HTTPException(
            status_code=400,
            detail="Insufficient leave balance",
        )

    # Create a new leave application
    new_application = LeaveApplication(
        application_id=str(uuid.uuid4()),
        employee_id=leave.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        status="pending"
    )
    created_application = crud.create_leave_application(
        db=db, application=new_application
    )

    # Create an audit log entry for the new application
    audit_log_entry = LeaveAuditLog(
    log_id=str(uuid.uuid4()),
    application_id=created_application.application_id,
    actor_id=leave.employee_id,
    action="Applied",
    timestamp=datetime.utcnow(),
    )
    crud.create_audit_log(db=db, audit_log=audit_log_entry)

    return created_application

