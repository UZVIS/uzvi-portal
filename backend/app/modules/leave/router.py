"""
Leave Management (M2) API Router
================================
This module defines the RESTful API endpoints for the Leave Management system.
It handles routing for leave types, leave applications, balances, and status updates.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.modules.leave import schemas, service


def get_db():
    """
    Dependency to get the database session.
    Yields a session and ensures it is closed after the request is completed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(
    prefix="/api/v1/leave",
    tags=["M2 Leave Management"],
)

# ==========================================
# 1. Leave Types Endpoints
# ==========================================

@router.post("/leave-types", response_model=schemas.LeaveTypeResponse, status_code=201)
def create_leave_type(
    leave_type: schemas.LeaveTypeCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new leave type (e.g., Casual Leave, Sick Leave).
    """
    return service.create_leave_type(db=db, leave_type=leave_type)

@router.get("/leave-types", response_model=List[schemas.LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db)):
    """
    Retrieve all available leave types configured in the system.
    """
    return service.get_leave_types(db)


# ==========================================
# 2. Leave Applications Endpoints
# ==========================================

@router.post("/applications", response_model=schemas.LeaveApplicationResponse, status_code=201)
def apply_leave(
    leave: schemas.LeaveApplicationCreate,
    db: Session = Depends(get_db),
):
    """
    Submit a new leave application for an employee.
    The application is created with a default 'PENDING' status.
    """
    return service.create_leave_application(db=db, application_data=leave)

@router.get("/applications", response_model=List[schemas.LeaveApplicationResponse])
def get_leave_applications(db: Session = Depends(get_db)):
    """
    Retrieve a list of all leave applications across the organization.
    """
    return service.get_leave_applications(db=db)

@router.put("/applications/{application_id}/status", response_model=schemas.LeaveApplicationResponse)
def update_application_status(
    application_id: str,
    status_data: schemas.LeaveStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update the status of a leave application (Approve/Reject).
    - Updates the application status.
    - Deducts the requested days from the employee's balance if APPROVED.
    - Creates an Audit Log entry for the action.
    """
    return service.update_leave_status(
        db=db,
        application_id=application_id,
        leave_status=status_data
    )


# ==========================================
# 3. Leave Balances Endpoints
# ==========================================

@router.post("/leave-balances", response_model=schemas.LeaveBalanceResponse, status_code=201)
def create_leave_balance(
    leave_balance: schemas.LeaveBalanceCreate,
    db: Session = Depends(get_db),
):
    """
    Initialize or add to an employee's leave balance wallet for a specific year.
    """
    return service.create_leave_balance(db=db, leave_balance=leave_balance)

@router.get("/leave-balances/{employee_id}", response_model=List[schemas.LeaveBalanceResponse])
def get_leave_balances(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve the entire leave balance wallet for a specific employee.
    """
    return service.get_leave_balances(db=db, employee_id=employee_id)

