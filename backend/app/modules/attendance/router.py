from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.attendance.service import AttendanceService
from app.modules.attendance.schemas import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse,
)

router = APIRouter(
    prefix="/attendance",
    tags=["M3 Attendance"],
)


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.create_attendance(attendance)


@router.get("/", response_model=List[AttendanceResponse])
def get_all_attendance(
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.get_all_attendance()


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.get_attendance(attendance_id)


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance: AttendanceUpdate,
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.update_attendance(
        attendance_id,
        attendance,
    )


@router.delete("/{attendance_id}", status_code=status.HTTP_200_OK)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.delete_attendance(attendance_id)


@router.get("/employee/{employee_id}")
def employee_attendance(
    employee_id: str,
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.get_employee_attendance(employee_id)


@router.get("/summary/{employee_id}")
def monthly_summary(
    employee_id: str,
    year: int,
    month: int,
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.get_monthly_summary(
        employee_id,
        year,
        month,
    )


@router.get("/unexplained-absences")
def unexplained_absences(
    db: Session = Depends(get_db),
):
    attendance_service = AttendanceService(db)
    return attendance_service.get_unexplained_absences()