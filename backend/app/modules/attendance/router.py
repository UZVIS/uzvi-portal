"""
Attendance Tracker API Routes
M3 - Attendance tracking REST endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta

from app.database import get_db
from app.modules.attendance import service as attendance_service
from app.modules.attendance.schemas import (
    AttendanceRecordResponse,
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceBulkCreate,
    AttendanceSummaryResponse,
    MonthlyAttendanceReport,
    TeamAttendanceView,
    UnexplainedAbsenceResponse,
    UnexplainedAbsenceUpdate,
    AttendanceExportRequest,
    AttendanceStatus,
    AttendanceFilter
)
from app.modules.directory import service as employee_service
from app.core.auth import get_current_user, require_role

# ========== Main Router ==========
router = APIRouter(
    prefix="/api/v1/attendance",
    tags=["M3 - Attendance Tracker"]
)


# ========================================
# SECTION 1: CRUD OPERATIONS
# ========================================

@router.post("/records", response_model=AttendanceRecordResponse, status_code=status.HTTP_201_CREATED)
def create_attendance_record(
    record_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new attendance record for an employee.
    
    - **Employees**: Can only create records for themselves
    - **Managers/Admin**: Can create records for any employee
    """
    # Permission check: employee can only create for themselves
    if current_user.access_tier not in ['admin', 'hr-restricted', 'manager']:
        if current_user.employee_id != record_data.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create attendance records for yourself"
            )
    
    try:
        result = attendance_service.create_attendance_record(db, record_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/records/bulk", response_model=List[AttendanceRecordResponse])
def bulk_create_attendance(
    bulk_data: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(['admin', 'manager']))
):
    """
    Bulk create attendance records for multiple employees.
    
    **Restricted to:** Admin, Manager, HR-Restricted
    """
    try:
        results = attendance_service.bulk_create_attendance(db, bulk_data.records)
        return results
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/records/employee/{employee_id}", response_model=List[AttendanceRecordResponse])
def get_employee_attendance(
    employee_id: str,
    start_date: Optional[date] = Query(None, description="Filter by start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter by end date (YYYY-MM-DD)"),
    status: Optional[AttendanceStatus] = Query(None, description="Filter by status"),
    source: Optional[str] = Query(None, description="Filter by source (manual/import)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get attendance records for a specific employee with optional filters.
    
    - **Employees**: Can only view their own records
    - **Managers**: Can view their team members' records
    - **Admin/HR**: Can view any employee's records
    """
    # Permission check
    if current_user.access_tier not in ['admin', 'hr-restricted']:
        if current_user.employee_id != employee_id:
            # Check if current user is the manager of this employee
            emp = employee_service.get_employee(db, employee_id)
            if not emp or emp.manager_id != current_user.employee_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to view this employee's attendance"
                )
    
    records = attendance_service.get_employee_attendance(
        db, employee_id, start_date, end_date, status, source
    )
    return records


@router.get("/records/{record_id}", response_model=AttendanceRecordResponse)
def get_attendance_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific attendance record by ID"""
    record = attendance_service.get_attendance_record(db, record_id)
    
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    
    # Permission check
    if current_user.access_tier not in ['admin', 'hr-restricted']:
        if current_user.employee_id != record.employee_id:
            emp = employee_service.get_employee(db, record.employee_id)
            if not emp or emp.manager_id != current_user.employee_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to view this record"
                )
    
    return record


@router.put("/records/{record_id}", response_model=AttendanceRecordResponse)
def update_attendance_record(
    record_id: int,
    update_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update an existing attendance record.
    
    - **Employees**: Can update their own records (within 24 hours)
    - **Admin/Manager**: Can update any record
    """
    record = attendance_service.get_attendance_record(db, record_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    
    # Permission check
    if current_user.access_tier not in ['admin', 'hr-restricted', 'manager']:
        if current_user.employee_id != record.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own attendance records"
            )
    
    try:
        result = attendance_service.update_attendance_record(db, record_id, update_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(['admin']))
):
    """
    Delete an attendance record.
    
    **Restricted to:** Admin only
    """
    success = attendance_service.delete_attendance_record(db, record_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")


# ========================================
# SECTION 2: SUMMARY & REPORTS
# ========================================

@router.get("/summary/{employee_id}", response_model=AttendanceSummaryResponse)
def get_employee_summary(
    employee_id: str,
    year: int = Query(..., ge=2000, le=2100, description="Year (e.g., 2026)"),
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get monthly attendance summary for an employee.
    
    Shows: present days, WFH days, leave days, absent days, total working days
    """
    # Permission check
    if current_user.access_tier not in ['admin', 'hr-restricted', 'manager']:
        if current_user.employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own attendance summary"
            )
    
    summary = attendance_service.get_employee_summary(db, employee_id, year, month)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No summary found for this period"
        )
    return summary


@router.get("/report/{employee_id}", response_model=MonthlyAttendanceReport)
def get_monthly_report(
    employee_id: str,
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get comprehensive monthly attendance report.
    
    Returns: Summary + all daily records for the month
    """
    # Permission check
    if current_user.access_tier not in ['admin', 'hr-restricted', 'manager']:
        if current_user.employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own attendance report"
            )
    
    report = attendance_service.get_monthly_report(db, employee_id, year, month)
    if not report.get('summary'):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No attendance data found for this period"
        )
    return report


# ========================================
# SECTION 3: TEAM VIEW (Manager)
# ========================================

@router.get("/team/{team_name}", response_model=TeamAttendanceView)
def get_team_attendance(
    team_name: str,
    attendance_date: date = Query(..., description="Date to view (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(['admin', 'manager']))
):
    """
    Get attendance for all members of a team on a specific date.
    
    **Restricted to:** Admin and Manager roles
    """
    try:
        team_data = attendance_service.get_team_attendance(db, team_name, attendance_date)
        return {
            "team_name": team_name,
            "date": attendance_date,
            "members": team_data
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ========================================
# SECTION 4: UNEXPLAINED ABSENCES
# ========================================

@router.get("/unexplained-absences", response_model=List[UnexplainedAbsenceResponse])
def get_unexplained_absences(
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(['admin', 'manager']))
):
    """
    Get all unexplained absences in a date range.
    
    These are days where employees were absent without approved leave.
    
    **Restricted to:** Admin and Manager roles
    """
    absences = attendance_service.flag_unexplained_absences(db, start_date, end_date)
    return absences


@router.put("/unexplained-absences/{absence_id}", response_model=UnexplainedAbsenceResponse)
def resolve_unexplained_absence(
    absence_id: int,
    update_data: UnexplainedAbsenceUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(['admin', 'manager']))
):
    """
    Resolve or update an unexplained absence.
    
    **Restricted to:** Admin and Manager roles
    """
    try:
        absence = attendance_service.resolve_unexplained_absence(
            db, absence_id, current_user.employee_id, update_data
        )
        return absence
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ========================================
# SECTION 5: EXPORT
# ========================================

@router.post("/export")
def export_attendance(
    export_request: AttendanceExportRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Export attendance data for payroll or reporting.
    
    - **Employees**: Can export their own data
    - **Admin**: Can export anyone's data
    """
    # Permission check
    if current_user.access_tier != 'admin':
        if current_user.employee_id != export_request.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only export your own attendance data"
            )
    
    data = attendance_service.export_attendance_data(
        db, export_request.employee_id, export_request.year, export_request.month
    )
    
    return {
        "employee_id": export_request.employee_id,
        "year": export_request.year,
        "month": export_request.month,
        "format": export_request.format,
        "count": len(data),
        "data": data
    }


# ========================================
# SECTION 6: DASHBOARDS
# ========================================

@router.get("/dashboard/my")
def get_my_attendance_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get attendance dashboard for the current employee.
    
    Shows: current month summary + last 10 days records
    """
    today = date.today()
    
    # Get current month summary
    summary = attendance_service.get_employee_summary(
        db, current_user.employee_id, today.year, today.month
    )
    
    # Get recent records (last 30 days)
    start_date = today - timedelta(days=30)
    recent_records = attendance_service.get_employee_attendance(
        db, current_user.employee_id, start_date, today
    )
    
    # Get today's record
    today_record = None
    for record in recent_records:
        if record.date == today:
            today_record = record
            break
    
    return {
        "employee_id": current_user.employee_id,
        "employee_name": current_user.name,
        "today": today,
        "today_record": today_record,
        "current_month_summary": summary,
        "recent_records": recent_records[:10] if recent_records else []
    }


@router.get("/dashboard/team")
def get_team_attendance_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(['manager', 'admin']))
):
    """
    Get team attendance dashboard for managers.
    
    Shows: team summary for current month + attendance overview
    """
    # Get manager's team members
    team_members = employee_service.get_employees_by_manager(db, current_user.employee_id)
    
    if not team_members and current_user.access_tier != 'admin':
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No team members found"
        )
    
    today = date.today()
    team_summary = []
    total_present = 0
    total_wfh = 0
    total_absent = 0
    
    for member in team_members:
        summary = attendance_service.get_employee_summary(
            db, member.employee_id, today.year, today.month
        )
        if summary:
            total_present += summary.days_present
            total_wfh += summary.wfh_days
            total_absent += summary.absent_days
        
        # Get today's status
        today_record = attendance_service.get_employee_attendance(
            db, member.employee_id, today, today
        )
        today_status = today_record[0].status if today_record else "Not marked"
        
        team_summary.append({
            "employee_id": member.employee_id,
            "employee_name": member.name,
            "designation": member.designation,
            "summary": summary,
            "today_status": today_status
        })
    
    return {
        "manager_name": current_user.name,
        "team_size": len(team_members),
        "month": f"{today.year}-{today.month:02d}",
        "team_totals": {
            "total_present_days": total_present,
            "total_wfh_days": total_wfh,
            "total_absent_days": total_absent
        },
        "members": team_summary
    }


# ========================================
# SECTION 7: UTILITY ENDPOINTS
# ========================================

@router.get("/statuses")
def get_attendance_statuses():
    """
    Get all possible attendance status values.
    Useful for frontend dropdowns.
    """
    return {
        "statuses": [
            {"value": "in-office", "label": "In Office"},
            {"value": "wfh", "label": "Work From Home"},
            {"value": "on-leave", "label": "On Leave"},
            {"value": "absent", "label": "Absent"}
        ]
    }


@router.get("/stats/{employee_id}")
def get_attendance_stats(
    employee_id: str,
    year: int = Query(..., ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get yearly attendance statistics for an employee.
    Shows: monthly breakdown of attendance.
    """
    # Permission check
    if current_user.access_tier not in ['admin', 'hr-restricted', 'manager']:
        if current_user.employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own statistics"
            )
    
    monthly_stats = []
    for month in range(1, 13):
        summary = attendance_service.get_employee_summary(db, employee_id, year, month)
        if summary:
            monthly_stats.append({
                "month": month,
                "month_name": date(year, month, 1).strftime("%B"),
                "present": summary.days_present,
                "wfh": summary.wfh_days,
                "leave": summary.leave_days,
                "absent": summary.absent_days,
                "total_working": summary.total_working_days
            })
    
    return {
        "employee_id": employee_id,
        "year": year,
        "monthly_stats": monthly_stats
    }