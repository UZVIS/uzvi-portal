from datetime import date

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


# ==========================================================
# M2 LEAVE MANAGEMENT INTEGRATION
# ==========================================================

# M2 Leave Management is part of this same backend.
# The actual module path is app.modules.leave.
from app.modules.leave.models import LeaveApplication, LeaveStatus

M2_AVAILABLE = True


class AttendanceService:

    def __init__(self, db: Session):
        self.db = db

    # ==========================================================
    # M2 - CHECK APPROVED LEAVE
    # ==========================================================

    def _check_employee_on_leave(
        self,
        employee_id: str,
        target_date: date,
    ) -> bool:
        """
        Check whether the employee has an approved leave
        in M2 for the given attendance date.
        """

        if not M2_AVAILABLE:
            return False

        leave = (
            self.db.query(LeaveApplication)
            .filter(
                LeaveApplication.employee_id == employee_id,
                LeaveApplication.status == LeaveStatus.APPROVED,
                LeaveApplication.start_date <= target_date,
                LeaveApplication.end_date >= target_date,
            )
            .first()
        )

        return leave is not None


    # ==========================================================
    # AUTOMATIC ABSENT CREATION
    # ==========================================================

    def _create_automatic_absent_for_date(
        self,
        target_date: date,
        employee_id: str | None = None,
        team_id: str | None = None,
    ) -> None:
        """
        Create a system-generated ABSENT record for employees who:
        1. have no attendance record for target_date, and
        2. do not have an approved M2 leave for target_date.

        The current day is never auto-marked absent. This helper is intended
        for completed/past attendance dates.
        """

        # Never create Absent for today or a future date.
        if target_date >= date.today():
            return

        query = self.db.query(Employee)

        if employee_id:
            query = query.filter(
                Employee.employee_id == employee_id
            )

        if team_id:
            query = query.filter(
                Employee.team_id == team_id
            )

        employees = query.all()

        if not employees:
            return

        created = False

        for employee in employees:
            current_employee_id = employee.employee_id

            existing = (
                self.db.query(AttendanceRecord)
                .filter(
                    AttendanceRecord.employee_id
                    == current_employee_id,
                    AttendanceRecord.attendance_date
                    == target_date,
                )
                .first()
            )

            # Attendance already exists. Do not overwrite it.
            if existing:
                continue

            # Approved M2 leave takes priority over Absent.
            if self._check_employee_on_leave(
                current_employee_id,
                target_date,
            ):
                continue

            absent_record = AttendanceRecord(
                employee_id=current_employee_id,
                attendance_date=target_date,
                status=AttendanceStatus.ABSENT,
                check_in=None,
                check_out=None,
                source="system",
            )

            self.db.add(absent_record)
            created = True

        if created:
            self.db.commit()

    def _finalize_previous_day_absence(
        self,
        employee_id: str | None = None,
        team_id: str | None = None,
    ) -> None:
        """
        Finalize yesterday as Absent when the attendance API is accessed.
        """
        yesterday = date.today()
        from datetime import timedelta

        yesterday = yesterday - timedelta(days=1)

        self._create_automatic_absent_for_date(
            target_date=yesterday,
            employee_id=employee_id,
            team_id=team_id,
        )

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

        # ======================================================
        # M2 LEAVE MANAGEMENT CHECK
        # ======================================================

        is_on_leave = self._check_employee_on_leave(
            attendance.employee_id,
            attendance.attendance_date,
        )

        attendance_status = attendance.status
        check_in = attendance.check_in
        check_out = attendance.check_out
        source = attendance.source

        # If M2 has an approved leave for this employee/date,
        # Attendance must automatically become ON_LEAVE.
        if is_on_leave:
            attendance_status = AttendanceStatus.ON_LEAVE
            check_in = None
            check_out = None
            source = "m2-leave"

        record = AttendanceRecord(
            employee_id=attendance.employee_id,
            attendance_date=attendance.attendance_date,
            status=attendance_status,
            check_in=check_in,
            check_out=check_out,
            source=source,
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

        # Automatically finalize the previous day before returning records.
        self._finalize_previous_day_absence()

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

        # Automatically finalize this employee's previous day.
        self._finalize_previous_day_absence(
            employee_id=employee_id
        )

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

        # ======================================================
        # M2 CHECK DURING UPDATE
        # ======================================================

        is_on_leave = self._check_employee_on_leave(
            attendance.employee_id,
            attendance.attendance_date,
        )

        if is_on_leave:
            attendance.status = AttendanceStatus.ON_LEAVE
            attendance.check_in = None
            attendance.check_out = None
            attendance.source = "m2-leave"

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

        # Ensure the previous day is finalized before calculating the summary.
        self._finalize_previous_day_absence(
            employee_id=employee_id
        )

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

        # Finalize yesterday for all employees before checking absences.
        self._finalize_previous_day_absence()

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

            # If M2 has an approved leave for the same
            # employee/date, it should not be treated as
            # an unexplained absence.
            if self._check_employee_on_leave(
                record.employee_id,
                record.attendance_date,
            ):
                continue

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

        # Finalize yesterday for this team before returning team attendance.
        self._finalize_previous_day_absence(
            team_id=team_id
        )
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