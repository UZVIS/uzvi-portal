"""
Leave Management (M2) API Router
================================
This module defines the RESTful API endpoints for the Leave Management system.
It handles routing for leave types, leave applications, balances, and status updates.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

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
    Create a new leave type configuration (e.g., Casual Leave, Sick Leave).
    """
    return service.create_leave_type(db=db, leave_type=leave_type)


@router.get("/leave-types", response_model=List[schemas.LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db)):
    """
    Retrieve all available leave types configured in the organization.
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
    The application is initialized with a default pending status.
    """
    return service.create_leave_application(db=db, application_data=leave)


@router.get("/applications", response_model=List[schemas.LeaveApplicationResponse])
def get_leave_applications(
    employee_id: Optional[str] = Query(None, description="Employee ID for role-based filtering"),
    role: Optional[str] = Query(None, description="User role scoping (Employee, Manager, HR)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve leave applications with optional role and employee scoping.
    """
    return service.get_leave_applications(db=db, employee_id=employee_id, role=role)


@router.put("/applications/{application_id}/status", response_model=schemas.LeaveApprovalResponse)
def update_application_status(
    application_id: str,
    status_data: schemas.LeaveStatusUpdate,
    force: bool = False,
    db: Session = Depends(get_db)
):
    """
    Update the status of a leave application (Approve or Reject).
    - Validates approver roles and team availability thresholds (30% rule) unless forced.
    - Dynamically routes requests to HR if policy thresholds are met.
    - Deducts leave balance exclusively upon final approval.
    - Logs all status updates into the audit trail.
    """
    return service.update_leave_status(
        db=db,
        application_id=application_id,
        leave_status=status_data,
        force=force
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
    Initialize or allocate a digital leave balance wallet for an employee for a specific year.
    """
    return service.create_leave_balance(db=db, leave_balance=leave_balance)


@router.get("/leave-balances/{employee_id}", response_model=List[schemas.LeaveBalanceResponse])
def get_leave_balances(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve the complete leave balance wallet breakdown for a specific employee.
    """
    return service.get_leave_balances(db=db, employee_id=employee_id)

@router.delete("/test-data/clean", status_code=200)
def clean_leave_test_data(db: Session = Depends(get_db)):
    """
    DEVELOPMENT ONLY: Cleans all test leave applications and audit logs.
    Retains employees, teams, leave types, and base configurations.
    """
    service.clean_test_leave_data(db=db)
    return {
        "status": "success",
        "message": "All test leave applications and audit logs have been cleaned successfully."
    }