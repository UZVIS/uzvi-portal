"""
Attendance Tracker Service
M3 - Business logic layer (M2 Integration disabled temporarily)
"""

from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date, datetime, timedelta, time
from typing import List, Optional, Dict, Any
import calendar

from app.modules.attendance.models import AttendanceRecord, AttendanceSummary, UnexplainedAbsence
from app.modules.attendance.schemas import (
    AttendanceCreate, 
    AttendanceUpdate, 
    AttendanceSummaryResponse, 
    UnexplainedAbsenceUpdate,
    UnexplainedAbsenceCreate
)
from app.modules.directory.models import Employee

# ========================================
# M2 (Leave Management) INTEGRATION - DISABLED FOR NOW
# M2 లేకపోయినా, ఈ కోడ్ crash అవ్వదు.
# ========================================
M2_AVAILABLE = False
LeaveApplication = None

try:
    from app.modules.leave_management.models import LeaveApplication
    M2_AVAILABLE = True
    print("M2 Leave Management found. Auto-population of 'On-Leave' is ACTIVE.")
except ImportError:
    print("M2 Leave Management NOT found. 'On-Leave' auto-population is DISABLED.")
except Exception:
    print("Error loading M2. 'On-Leave' auto-population is DISABLED.")


class AttendanceService:
    """Service class for attendance operations"""

    def __init__(self, db: Session):
        self.db = db

    # ========================================
    # INTERNAL HELPERS
    # ========================================

    def _check_employee_on_leave(self, employee_id: str, target_date: date) -> bool:
        """
        Check if employee is on approved leave on a specific date.
        Currently DISABLED (returns False) if M2 is not available.
        """
        if not M2_AVAILABLE or LeaveApplication is None:
            # M2 లేనప్పుడు, ఎప్పుడూ "On-Leave" కాదు అని చెప్తుంది.
            return False

        try:
            leaves = self.db.query(LeaveApplication).filter(
                LeaveApplication.employee_id == employee_id,
                LeaveApplication.status == 'approved',  # TODO: M2 వాళ్ళు చెప్పిన exact value పెట్టాలి.
                LeaveApplication.start_date <= target_date,
                LeaveApplication.end_date >= target_date
            ).all()
            return len(leaves) > 0
        except Exception:
            # ఏదైనా technical error వచ్చినా, attendance పని చేయాలి కాబట్టి False return
            return False

    def _update_monthly_summary(self, employee_id: str, year: int, month: int):
        """Update or create monthly attendance summary"""
        # Get all records for the month
        records = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == employee_id,
            extract('year', AttendanceRecord.attendance_date) == year,
            extract('month', AttendanceRecord.attendance_date) == month
        ).all()
        
        # Calculate summary
        total_days = len(records)
        present_days = sum(1 for r in records if r.status in [AttendanceStatus.IN_OFFICE, AttendanceStatus.WFH])
        wfh_days = sum(1 for r in records if r.status == AttendanceStatus.WFH)
        leave_days = sum(1 for r in records if r.status == AttendanceStatus.ON_LEAVE)
        absent_days = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        
        # Calculate average check-in/out times
        check_in_times = [r.check_in for r in records if r.check_in]
        check_out_times = [r.check_out for r in records if r.check_out]
        
        avg_check_in = None
        avg_check_out = None
        
        if check_in_times:
            avg_seconds = sum(t.hour * 3600 + t.minute * 60 + t.second for t in check_in_times) / len(check_in_times)
            hours = int(avg_seconds // 3600)
            minutes = int((avg_seconds % 3600) // 60)
            seconds = int(avg_seconds % 60)
            avg_check_in = time(hours, minutes, seconds)
        
        if check_out_times:
            avg_seconds = sum(t.hour * 3600 + t.minute * 60 + t.second for t in check_out_times) / len(check_out_times)
            hours = int(avg_seconds // 3600)
            minutes = int((avg_seconds % 3600) // 60)
            seconds = int(avg_seconds % 60)
            avg_check_out = time(hours, minutes, seconds)
        
        # Calculate total working days (Monday-Friday)
        total_working_days = 0
        _, last_day = calendar.monthrange(year, month)
        for day in range(1, last_day + 1):
            d = date(year, month, day)
            if d.weekday() < 5:
                total_working_days += 1
        
        # Find or create summary
        summary = self.db.query(AttendanceSummary).filter(
            AttendanceSummary.employee_id == employee_id,
            AttendanceSummary.year == year,
            AttendanceSummary.month == month
        ).first()
        
        if summary:
            summary.days_present = present_days
            summary.wfh_days = wfh_days
            summary.leave_days = leave_days
            summary.absent_days = absent_days
            summary.total_working_days = total_working_days
            summary.avg_check_in_time = avg_check_in
            summary.avg_check_out_time = avg_check_out
            summary.updated_at = datetime.utcnow()
        else:
            summary_data = {
                'employee_id': employee_id,
                'year': year,
                'month': month,
                'days_present': present_days,
                'wfh_days': wfh_days,
                'leave_days': leave_days,
                'absent_days': absent_days,
                'total_working_days': total_working_days,
                'avg_check_in_time': avg_check_in,
                'avg_check_out_time': avg_check_out
            }
            summary = AttendanceSummary(**summary_data)
            self.db.add(summary)
        
        self.db.commit()

    # ========================================
    # CRUD OPERATIONS
    # ========================================

    def create_attendance_record(self, record_data: AttendanceCreate) -> AttendanceRecord:
        """Create a new attendance record"""
        # Check if record already exists
        existing = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == record_data.employee_id,
            AttendanceRecord.attendance_date == record_data.attendance_date
        ).first()
        
        if existing:
            raise ValueError(f"Attendance already exists for employee {record_data.employee_id} on {record_data.attendance_date}")
        
        # Validate employee exists (M0)
        employee = self.db.query(Employee).filter(Employee.employee_id == record_data.employee_id).first()
        if not employee:
            raise ValueError(f"Employee with ID {record_data.employee_id} not found")
        
        # Check if employee is on leave (M2 Integration - returns False if M2 is disabled)
        is_on_leave = self._check_employee_on_leave(record_data.employee_id, record_data.attendance_date)
        
        # Prepare data
        data = record_data.model_dump()
        if is_on_leave:
            data['status'] = AttendanceStatus.ON_LEAVE
        
        db_record = AttendanceRecord(**data)
        self.db.add(db_record)
        self.db.commit()
        self.db.refresh(db_record)
        
        # Update monthly summary
        self._update_monthly_summary(record_data.employee_id, record_data.attendance_date.year, record_data.attendance_date.month)
        
        return db_record

    def get_attendance_record(self, record_id: int) -> Optional[AttendanceRecord]:
        """Get attendance record by ID"""
        return self.db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()

    def get_employee_attendance(
        self,
        employee_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[AttendanceStatus] = None,
        source: Optional[str] = None
    ) -> List[AttendanceRecord]:
        """Get employee attendance with filters"""
        query = self.db.query(AttendanceRecord).filter(AttendanceRecord.employee_id == employee_id)
        
        if start_date:
            query = query.filter(AttendanceRecord.attendance_date >= start_date)
        if end_date:
            query = query.filter(AttendanceRecord.attendance_date <= end_date)
        if status:
            query = query.filter(AttendanceRecord.status == status)
        if source:
            query = query.filter(AttendanceRecord.source == source)
            
        return query.order_by(AttendanceRecord.attendance_date.desc()).all()

    def update_attendance_record(self, record_id: int, update_data: AttendanceUpdate) -> AttendanceRecord:
        """Update an existing record"""
        db_record = self.get_attendance_record(record_id)
        if not db_record:
            raise ValueError(f"Record {record_id} not found")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        # If status is being updated, check M2 leave status again (only if M2 is active)
        if 'status' in update_dict and update_dict['status'] == AttendanceStatus.ON_LEAVE:
            if not self._check_employee_on_leave(db_record.employee_id, db_record.attendance_date):
                # M2 says no leave, so override to Absent (don't allow manual On-Leave if not actually on leave)
                update_dict['status'] = AttendanceStatus.ABSENT
        
        for key, value in update_dict.items():
            setattr(db_record, key, value)
        
        db_record.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_record)
        
        self._update_monthly_summary(db_record.employee_id, db_record.attendance_date.year, db_record.attendance_date.month)
        return db_record

    def delete_attendance_record(self, record_id: int) -> bool:
        """Delete a record"""
        db_record = self.get_attendance_record(record_id)
        if not db_record:
            return False
        
        employee_id = db_record.employee_id
        year = db_record.attendance_date.year
        month = db_record.attendance_date.month
        
        self.db.delete(db_record)
        self.db.commit()
        self._update_monthly_summary(employee_id, year, month)
        return True

    # ========================================
    # BULK OPERATIONS
    # ========================================

    def bulk_create_attendance(self, records: List[AttendanceCreate]) -> List[AttendanceRecord]:
        """Bulk create records"""
        created = []
        errors = []
        for rec in records:
            try:
                result = self.create_attendance_record(rec)
                created.append(result)
            except Exception as e:
                errors.append(f"{rec.employee_id} on {rec.attendance_date}: {str(e)}")
        if errors:
            raise ValueError(f"Bulk errors: {'; '.join(errors)}")
        return created

    # ========================================
    # SUMMARY & REPORTS
    # ========================================

    def get_employee_summary(self, employee_id: str, year: int, month: int) -> Optional[AttendanceSummary]:
        return self.db.query(AttendanceSummary).filter(
            AttendanceSummary.employee_id == employee_id,
            AttendanceSummary.year == year,
            AttendanceSummary.month == month
        ).first()

    def get_monthly_report(self, employee_id: str, year: int, month: int) -> Dict[str, Any]:
        summary = self.get_employee_summary(employee_id, year, month)
        _, last_day = calendar.monthrange(year, month)
        records = self.get_employee_attendance(
            employee_id,
            start_date=date(year, month, 1),
            end_date=date(year, month, last_day)
        )
        employee = self.db.query(Employee).filter(Employee.employee_id == employee_id).first()
        return {
            'employee_id': employee_id,
            'employee_name': employee.name if employee else 'Unknown',
            'year': year,
            'month': month,
            'summary': summary,
            'daily_records': records
        }

    # ========================================
    # TEAM VIEWS
    # ========================================

    def get_team_attendance(self, team_name: str, attendance_date: date) -> List[Dict[str, Any]]:
        employees = self.db.query(Employee).filter(Employee.team == team_name).all()
        result = []
        for emp in employees:
            record = self.db.query(AttendanceRecord).filter(
                AttendanceRecord.employee_id == emp.employee_id,
                AttendanceRecord.attendance_date == attendance_date
            ).first()
            result.append({
                'employee_id': emp.employee_id,
                'employee_name': emp.name,
                'designation': emp.designation,
                'attendance': record
            })
        return result

    # ========================================
    # UNEXPLAINED ABSENCES
    # ========================================

    def flag_unexplained_absences(self, start_date: date, end_date: date) -> List[UnexplainedAbsence]:
        employees = self.db.query(Employee).filter(Employee.employment_status == 'active').all()
        flagged = []
        current = start_date
        while current <= end_date:
            if current.weekday() < 5:
                for emp in employees:
                    record = self.db.query(AttendanceRecord).filter(
                        AttendanceRecord.employee_id == emp.employee_id,
                        AttendanceRecord.attendance_date == current
                    ).first()
                    if not record or record.status == AttendanceStatus.ABSENT:
                        is_on_leave = self._check_employee_on_leave(emp.employee_id, current)
                        if not is_on_leave:
                            existing = self.db.query(UnexplainedAbsence).filter(
                                UnexplainedAbsence.employee_id == emp.employee_id,
                                UnexplainedAbsence.date == current
                            ).first()
                            if not existing:
                                absence = UnexplainedAbsence(
                                    employee_id=emp.employee_id,
                                    date=current,
                                    status='pending'
                                )
                                self.db.add(absence)
                                flagged.append(absence)
            current += timedelta(days=1)
        self.db.commit()
        return flagged

    def resolve_unexplained_absence(self, absence_id: int, resolver_id: str, update_data: UnexplainedAbsenceUpdate):
        absence = self.db.query(UnexplainedAbsence).filter(UnexplainedAbsence.id == absence_id).first()
        if not absence:
            raise ValueError(f"Absence {absence_id} not found")
        absence.status = update_data.status or 'resolved'
        absence.notes = update_data.notes or absence.notes
        absence.resolved_at = datetime.utcnow()
        absence.resolved_by = resolver_id
        self.db.commit()
        self.db.refresh(absence)
        return absence

    # ========================================
    # EXPORT
    # ========================================

    def export_attendance_data(self, employee_id: str, year: int, month: int) -> List[Dict[str, Any]]:
        _, last_day = calendar.monthrange(year, month)
        records = self.get_employee_attendance(
            employee_id,
            start_date=date(year, month, 1),
            end_date=date(year, month, last_day)
        )
        return [{
            'Date': r.attendance_date.isoformat(),
            'Status': r.status.value,
            'Check In': r.check_in.isoformat() if r.check_in else '',
            'Check Out': r.check_out.isoformat() if r.check_out else '',
            'Source': r.source
        } for r in records]