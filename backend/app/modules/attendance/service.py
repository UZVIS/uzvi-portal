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

    # ==========================================================
    # CREATE ATTENDANCE
    # ==========================================================

    def create_attendance(
        self,
        attendance: AttendanceCreate,
    ) -> AttendanceRecord:

        existing = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id
                == attendance.employee_id,
                AttendanceRecord.attendance_date
                == attendance.attendance_date,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Attendance already exists for "
                    "this employee and date."
                ),
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

    # ==========================================================
    # GET ATTENDANCE BY ID
    # ==========================================================

    def get_attendance(
        self,
        attendance_id: int,
    ):

        attendance = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.id
                == attendance_id
            )
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        return attendance

    # ==========================================================
    # GET ALL ATTENDANCE
    # ==========================================================

    def get_all_attendance(self):

        return (
            self.db.query(AttendanceRecord)
            .order_by(
                AttendanceRecord.attendance_date.desc()
            )
            .all()
        )

    # ==========================================================
    # GET EMPLOYEE ATTENDANCE
    # ==========================================================

    def get_employee_attendance(
        self,
        employee_id: str,
    ):

        return (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id
                == employee_id
            )
            .order_by(
                AttendanceRecord.attendance_date.desc()
            )
            .all()
        )

    # ==========================================================
    # UPDATE ATTENDANCE
    # ==========================================================

    def update_attendance(
        self,
        attendance_id: int,
        attendance_update: AttendanceUpdate,
    ):

        attendance = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.id
                == attendance_id
            )
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        update_data = attendance_update.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():
            setattr(
                attendance,
                key,
                value,
            )

        self.db.commit()
        self.db.refresh(attendance)

        return attendance

    # ==========================================================
    # DELETE ATTENDANCE
    # ==========================================================

    def delete_attendance(
        self,
        attendance_id: int,
    ):

        attendance = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.id
                == attendance_id
            )
            .first()
        )

        if attendance is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found.",
            )

        self.db.delete(attendance)
        self.db.commit()

        return {
            "message": (
                "Attendance deleted successfully"
            )
        }

    # ==========================================================
    # MONTHLY SUMMARY
    # ==========================================================

    def get_monthly_summary(
        self,
        employee_id: str,
        year: int,
        month: int,
    ):

        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id
                == employee_id
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
                and record.attendance_date.month
                == month
            ):

                if (
                    record.status
                    == AttendanceStatus.IN_OFFICE
                ):
                    summary["present"] += 1

                elif (
                    record.status
                    == AttendanceStatus.WFH
                ):
                    summary["wfh"] += 1

                elif (
                    record.status
                    == AttendanceStatus.ON_LEAVE
                ):
                    summary["leave"] += 1

                elif (
                    record.status
                    == AttendanceStatus.ABSENT
                ):
                    summary["absent"] += 1

        return summary

    # ==========================================================
    # UNEXPLAINED ABSENCES
    # ==========================================================

    def get_unexplained_absences(self):

        absent_records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.status
                == AttendanceStatus.ABSENT
            )
            .order_by(
                AttendanceRecord.attendance_date.desc()
            )
            .all()
        )

        result = []

        for record in absent_records:

            employee = (
                self.db.query(Employee)
                .filter(
                    Employee.employee_id
                    == record.employee_id
                )
                .first()
            )

            employee_name = "-"

            if employee:
                employee_name = (
                    getattr(
                        employee,
                        "name",
                        None,
                    )
                    or getattr(
                        employee,
                        "full_name",
                        None,
                    )
                    or getattr(
                        employee,
                        "employee_name",
                        None,
                    )
                    or "-"
                )

            result.append(
                {
                    "id": record.id,
                    "employee_id": record.employee_id,
                    "employee_name": employee_name,
                    "attendance_date": (
                        record.attendance_date
                    ),
                    "status": record.status,
                    "check_in": record.check_in,
                    "check_out": record.check_out,
                    "source": record.source,
                    "created_at": record.created_at,
                    "updated_at": record.updated_at,
                }
            )

        return result

    # ==========================================================
    # EXPORT ATTENDANCE
    # ==========================================================

    def export_attendance(
        self,
        employee_id: str,
    ):

        records = (
            self.db.query(AttendanceRecord)
            .filter(
                AttendanceRecord.employee_id
                == employee_id
            )
            .order_by(
                AttendanceRecord.attendance_date.desc()
            )
            .all()
        )

        return records

    # ==========================================================
    # TEAM ATTENDANCE
    # ==========================================================

    def get_team_attendance(
        self,
        team_id: str,
    ):
        """
        Return team attendance together with
        employee details.

        Sorted by employee_id ascending and then
        attendance date descending.
        """

        records = (
            self.db.query(
                AttendanceRecord,
                Employee,
            )
            .join(
                Employee,
                AttendanceRecord.employee_id
                == Employee.employee_id,
            )
            .filter(
                Employee.team_id
                == team_id
            )
            .order_by(
                Employee.employee_id.asc(),
                AttendanceRecord.attendance_date.desc(),
            )
            .all()
        )

        result = []

        for attendance, employee in records:

            result.append(
                {
                    "employee_id": (
                        employee.employee_id
                    ),

                    "employee_name": (
                        employee.name
                        or "-"
                    ),

                    "designation": (
                        getattr(
                            employee,
                            "designation",
                            None,
                        )
                    ),

                    "department": (
                        getattr(
                            employee,
                            "department",
                            None,
                        )
                    ),

                    "attendance_date": (
                        attendance.attendance_date
                    ),

                    "status": (
                        attendance.status
                    ),

                    "check_in": (
                        attendance.check_in
                    ),

                    "check_out": (
                        attendance.check_out
                    ),

                    "source": (
                        attendance.source
                    ),
                }
            )

        return result