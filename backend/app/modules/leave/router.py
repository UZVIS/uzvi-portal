"""
Leave Management (M2) API Router
================================
This module defines the RESTful API endpoints for the Leave Management system.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import SessionLocal
from app.modules.leave import schemas, service

def get_db():
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
    return service.create_leave_type(db=db, leave_type=leave_type)

@router.get("/leave-types", response_model=List[schemas.LeaveTypeResponse])
def get_leave_types(db: Session = Depends(get_db)):
    return service.get_leave_types(db)

# ==========================================
# 2. Leave Applications Endpoints
# ==========================================
@router.post("/applications", response_model=schemas.LeaveApplicationResponse, status_code=201)
def apply_leave(
    leave: schemas.LeaveApplicationCreate, 
    db: Session = Depends(get_db),
):
    return service.create_leave_application(db=db, application_data=leave)


@router.get("/applications", response_model=List[schemas.LeaveApplicationResponse])
def get_leave_applications(
    employee_id: Optional[str] = Query(None, description="Employee ID for role-based filtering"),
    role: Optional[str] = Query(None, description="User role scoping (Employee, Manager, HR)"),
    db: Session = Depends(get_db)
):
    return service.get_leave_applications(db=db, employee_id=employee_id, role=role)


@router.put("/applications/{application_id}/status", response_model=schemas.LeaveApprovalResponse)
def update_application_status(
    application_id: str,
    status_data: schemas.LeaveStatusUpdate,
    force: bool = False,
    db: Session = Depends(get_db)
):
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
    return service.create_leave_balance(db=db, leave_balance=leave_balance)


@router.get("/leave-balances/{employee_id}", response_model=List[schemas.LeaveBalanceResponse])
def get_leave_balances(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieve the complete leave balance wallet breakdown for a specific employee.
    Automatically assigns balances if they do not exist for the current year.
    """
    # Trigger auto-assignment logic first
    service.auto_assign_leave_balances(db=db, employee_id=employee_id)
    
    return service.get_leave_balances(db=db, employee_id=employee_id)

@router.delete("/test-data/clean", status_code=200)
def clean_leave_test_data(db: Session = Depends(get_db)):
    service.clean_test_leave_data(db=db)
    return {
        "status": "success",
        "message": "All test leave applications and audit logs have been cleaned successfully."
    }