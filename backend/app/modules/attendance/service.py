from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.modules.directory.models import Employee

from app.modules.attendance.models import (
    AttendanceRecord,
    AttendanceStatus,
)
from app.modules.attendance.schemas import (
    AttendanceCreate,
    AttendanceUpdate,
)

class AttendanceService:

    def __init__(self, db: Session):
        self.db = db

    # -----------------------------
    # Create Attendance
    # -----------------------------
    def create_attendance(
        self,
        attendance: AttendanceCreate,
    ) -> AttendanceRecord:

        existing = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id == attendance.employee_id,
                AttendanceRecord.attendance_date == attendance.attendance_date,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance already exists for this employee and date.",
            )

        record = AttendanceRecord(
            employee_id=attendance.employee_id,
            attendance_date=attendance.attendance_date,
            status=attendance.status,
            check_in=attendance.check_in,
            check_out=attendance.check_out,
            source=attendance.source,
        )

        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        return record

    # -----------------------------
    # Get Attendance By Id
    # -----------------------------
    def get_attendance(
        self,
        attendance_id: int,
    ):

        attendance = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.id == attendance_id
            )
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        return attendance

    # -----------------------------
    # Get All Attendance
    # -----------------------------
    def get_all_attendance(self):

        return (
            self.db.query(AttendanceRecord)
            .order_by(
                AttendanceRecord.attendance_date.desc()
            )
            .all()
        )

    # -----------------------------
    # Get Employee Attendance
    # -----------------------------
    def get_employee_attendance(
        self,
        employee_id: str,
    ):

        return (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id == employee_id
            )
            .order_by(
                AttendanceRecord.attendance_date.desc()
            )
            .all()
        )

            # -----------------------------
    # Update Attendance
    # -----------------------------
    def update_attendance(
        self,
        attendance_id: int,
        attendance_update: AttendanceUpdate,
    ):

        attendance = (
            self.db.query(AttendanceRecord)
            .filter(AttendanceRecord.id == attendance_id)
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        update_data = attendance_update.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(attendance, key, value)

        self.db.commit()
        self.db.refresh(attendance)

        return attendance

    # -----------------------------
    # Delete Attendance
    # -----------------------------
    def delete_attendance(
        self,
        attendance_id: int,
    ):

        attendance = (
            self.db.query(AttendanceRecord)
            .filter(AttendanceRecord.id == attendance_id)
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        self.db.delete(attendance)
        self.db.commit()

        return {"message": "Attendance deleted successfully"}

    # -----------------------------
    # Monthly Summary
    # -----------------------------
    def get_monthly_summary(
        self,
        employee_id: str,
        year: int,
        month: int,
    ):

        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id == employee_id
            )
            .all()
        )

        summary = {
            "present": 0,
            "wfh": 0,
            "leave": 0,
            "absent": 0,
        }

        for record in records:

            if (
                record.attendance_date.year == year
                and record.attendance_date.month == month
            ):

                if record.status == AttendanceStatus.IN_OFFICE:
                    summary["present"] += 1

                elif record.status == AttendanceStatus.WFH:
                    summary["wfh"] += 1

                elif record.status == AttendanceStatus.ON_LEAVE:
                    summary["leave"] += 1

                elif record.status == AttendanceStatus.ABSENT:
                    summary["absent"] += 1

        return summary

    # -----------------------------
    # Unexplained Absence
    # -----------------------------
    def get_unexplained_absences(self):

        return (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.status == AttendanceStatus.ABSENT
            )
            .all()
        )

    # -----------------------------
    # Export Attendance
    # -----------------------------
    def export_attendance(
        self,
        employee_id: str,
    ):

        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id == employee_id
            )
            .all()
        )

        return records



    # -----------------------------
    # Team Attendance
    # -----------------------------
    def get_team_attendance(
        self,
        team_id: str,
    ):

        records = (
        self.db.query(AttendanceRecord)
        .join(
            Employee,
            AttendanceRecord.employee_id == Employee.employee_id
        )
        .filter(
            Employee.team_id == team_id
        )
        .all()
    )

        return records

    

