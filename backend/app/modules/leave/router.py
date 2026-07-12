from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.modules.leave.schemas import (
    LeaveApplicationCreate,
    LeaveApplicationResponse,
)
from app.modules.leave import service

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

@router.post(
    "/applications",
    response_model=LeaveApplicationResponse,
    status_code=201,
)
def apply_leave(
    leave: LeaveApplicationCreate,
    db: Session = Depends(get_db),
):
    return service.apply_leave(
        db=db,
        leave=leave,
    )