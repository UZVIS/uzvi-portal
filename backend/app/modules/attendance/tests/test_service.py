"""
Attendance Tracker - Unit Tests
M3 Service Layer Tests (M2 Integration is DISABLED in these tests)
"""

import pytest
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory import service as emp_service
from app.modules.directory.schemas import EmployeeCreate
from app.modules.attendance import service as att_service
from app.modules.attendance.schemas import (
    AttendanceCreate, 
    AttendanceUpdate, 
    AttendanceStatus,
    UnexplainedAbsenceUpdate
)
from app.modules.attendance.models import AttendanceRecord, AttendanceSummary, UnexplainedAbsence


# ========================================
# FIXTURES (Test Database Setup)
# ========================================

@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def test_employee(db_session):
    """Create a test employee in M0 (required for attendance FK)"""
    emp_data = EmployeeCreate(
        employee_id="EMP001",
        name="Test User",
        designation="Software Developer",
        team="Engineering",
        manager_id=None,
        join_date=date(2025, 1, 1),
        employment_status="active",
        access_tier="employee",
        contact_details={"email": "test@uzvi.com"}
    )
    emp = emp_service.create_employee(db_session, emp_data)
    return emp


@pytest.fixture
def test_manager(db_session):
    """Create a test manager in M0"""
    emp_data = EmployeeCreate(
        employee_id="MGR001",
        name="Manager User",
        designation="Team Lead",
        team="Engineering",
        manager_id=None,
        join_date=date(2024, 1, 1),
        employment_status="active",
        access_tier="manager",
        contact_details={"email": "manager@uzvi.com"}
    )
    emp = emp_service.create_employee(db_session, emp_data)
    return emp


# ========================================
# TEST 1: CREATE ATTENDANCE RECORD
# ========================================

def test_create_attendance_record(db_session, test_employee):
    """Test creating a single attendance record"""
    # Arrange
    today = date.today()
    record_data = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=today,
        status=AttendanceStatus.IN_OFFICE,
        check_in=datetime.strptime("09:00:00", "%H:%M:%S").time(),
        check_out=datetime.strptime("18:00:00", "%H:%M:%S").time(),
        source="manual"
    )
    
    # Act
    result = att_service.create_attendance_record(db_session, record_data)
    
    # Assert
    assert result.id is not None
    assert result.employee_id == test_employee.employee_id
    assert result.status == AttendanceStatus.IN_OFFICE
    assert result.attendance_date == today
    assert result.source == "manual"
    assert result.created_at is not None


def test_create_duplicate_attendance_fails(db_session, test_employee):
    """Test that creating duplicate attendance throws error"""
    # Arrange
    today = date.today()
    record_data = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=today,
        status=AttendanceStatus.IN_OFFICE
    )
    att_service.create_attendance_record(db_session, record_data)
    
    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        att_service.create_attendance_record(db_session, record_data)
    
    assert "already exists" in str(exc_info.value)


def test_create_attendance_invalid_employee(db_session):
    """Test that creating attendance for non-existent employee fails"""
    # Arrange
    record_data = AttendanceCreate(
        employee_id="INVALID_EMP",
        attendance_date=date.today(),
        status=AttendanceStatus.IN_OFFICE
    )
    
    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        att_service.create_attendance_record(db_session, record_data)
    
    assert "not found" in str(exc_info.value)


# ========================================
# TEST 2: GET ATTENDANCE RECORDS
# ========================================

def test_get_employee_attendance(db_session, test_employee):
    """Test fetching attendance records with filters"""
    # Arrange - Create multiple records
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    rec1 = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=today,
        status=AttendanceStatus.IN_OFFICE
    )
    rec2 = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=yesterday,
        status=AttendanceStatus.WFH
    )
    
    att_service.create_attendance_record(db_session, rec1)
    att_service.create_attendance_record(db_session, rec2)
    
    # Act - Get all records
    records = att_service.get_employee_attendance(db_session, test_employee.employee_id)
    
    # Assert
    assert len(records) == 2
    
    # Act - Filter by status
    wfh_records = att_service.get_employee_attendance(
        db_session, 
        test_employee.employee_id,
        status=AttendanceStatus.WFH
    )
    assert len(wfh_records) == 1
    assert wfh_records[0].status == AttendanceStatus.WFH
    
    # Act - Filter by date range
    filtered = att_service.get_employee_attendance(
        db_session,
        test_employee.employee_id,
        start_date=today,
        end_date=today
    )
    assert len(filtered) == 1
    assert filtered[0].attendance_date == today


def test_get_single_attendance_record(db_session, test_employee):
    """Test fetching a single record by ID"""
    # Arrange
    record_data = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=date.today(),
        status=AttendanceStatus.IN_OFFICE
    )
    created = att_service.create_attendance_record(db_session, record_data)
    
    # Act
    fetched = att_service.get_attendance_record(db_session, created.id)
    
    # Assert
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.employee_id == test_employee.employee_id


def test_get_nonexistent_record(db_session):
    """Test fetching a non-existent record returns None"""
    result = att_service.get_attendance_record(db_session, 9999)
    assert result is None


# ========================================
# TEST 3: UPDATE ATTENDANCE RECORD
# ========================================

def test_update_attendance_record(db_session, test_employee):
    """Test updating an existing attendance record"""
    # Arrange
    today = date.today()
    record_data = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=today,
        status=AttendanceStatus.IN_OFFICE,
        check_in=datetime.strptime("09:00:00", "%H:%M:%S").time()
    )
    created = att_service.create_attendance_record(db_session, record_data)
    
    # Act
    update_data = AttendanceUpdate(
        status=AttendanceStatus.WFH,
        check_out=datetime.strptime("17:00:00", "%H:%M:%S").time()
    )
    updated = att_service.update_attendance_record(db_session, created.id, update_data)
    
    # Assert
    assert updated.status == AttendanceStatus.WFH
    assert updated.check_out is not None
    assert updated.check_out.strftime("%H:%M:%S") == "17:00:00"
    assert updated.updated_at > updated.created_at  # updated_at should be newer


def test_update_nonexistent_record(db_session):
    """Test updating a non-existent record throws error"""
    update_data = AttendanceUpdate(status=AttendanceStatus.WFH)
    
    with pytest.raises(ValueError) as exc_info:
        att_service.update_attendance_record(db_session, 9999, update_data)
    
    assert "not found" in str(exc_info.value)


# ========================================
# TEST 4: DELETE ATTENDANCE RECORD
# ========================================

def test_delete_attendance_record(db_session, test_employee):
    """Test deleting an attendance record"""
    # Arrange
    record_data = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=date.today(),
        status=AttendanceStatus.IN_OFFICE
    )
    created = att_service.create_attendance_record(db_session, record_data)
    
    # Act
    result = att_service.delete_attendance_record(db_session, created.id)
    
    # Assert
    assert result is True
    # Verify it's deleted
    deleted = att_service.get_attendance_record(db_session, created.id)
    assert deleted is None


def test_delete_nonexistent_record(db_session):
    """Test deleting a non-existent record returns False"""
    result = att_service.delete_attendance_record(db_session, 9999)
    assert result is False


# ========================================
# TEST 5: MONTHLY SUMMARY
# ========================================

def test_monthly_summary_calculation(db_session, test_employee):
    """Test that monthly summary is calculated correctly"""
    # Arrange - Create records for a month
    year = 2026
    month = 6  # June 2026
    
    # Create 3 present days, 2 WFH, 1 absent, 1 on-leave
    dates = [
        (date(year, month, 1), AttendanceStatus.IN_OFFICE),
        (date(year, month, 2), AttendanceStatus.IN_OFFICE),
        (date(year, month, 3), AttendanceStatus.IN_OFFICE),
        (date(year, month, 4), AttendanceStatus.WFH),
        (date(year, month, 5), AttendanceStatus.WFH),
        (date(year, month, 6), AttendanceStatus.ABSENT),
        (date(year, month, 7), AttendanceStatus.ON_LEAVE),  # M2 disabled, so manual entry
    ]
    
    for d, status in dates:
        rec = AttendanceCreate(
            employee_id=test_employee.employee_id,
            attendance_date=d,
            status=status
        )
        att_service.create_attendance_record(db_session, rec)
    
    # Act
    summary = att_service.get_employee_summary(db_session, test_employee.employee_id, year, month)
    
    # Assert
    assert summary is not None
    assert summary.days_present == 5  # 3 in-office + 2 WFH
    assert summary.wfh_days == 2
    assert summary.leave_days == 1
    assert summary.absent_days == 1
    # June 2026 has 22 working days (Monday-Friday)
    assert summary.total_working_days == 22


def test_monthly_report(db_session, test_employee):
    """Test the full monthly report"""
    # Arrange
    year = 2026
    month = 6
    rec = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=date(year, month, 1),
        status=AttendanceStatus.IN_OFFICE
    )
    att_service.create_attendance_record(db_session, rec)
    
    # Act
    report = att_service.get_monthly_report(db_session, test_employee.employee_id, year, month)
    
    # Assert
    assert report['employee_id'] == test_employee.employee_id
    assert report['employee_name'] == "Test User"
    assert report['year'] == year
    assert report['month'] == month
    assert report['summary'] is not None
    assert len(report['daily_records']) == 1


# ========================================
# TEST 6: UNEXPLAINED ABSENCES
# ========================================

def test_flag_unexplained_absences(db_session, test_employee):
    """Test that unexplained absences are flagged correctly"""
    # Arrange - Create a date range
    start_date = date.today() - timedelta(days=5)
    end_date = date.today()
    
    # Create attendance for one day (today)
    rec = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=date.today(),
        status=AttendanceStatus.IN_OFFICE
    )
    att_service.create_attendance_record(db_session, rec)
    
    # Act
    absences = att_service.flag_unexplained_absences(db_session, start_date, end_date)
    
    # Assert
    # Should flag all weekdays except today (since M2 is disabled, all absences are "unexplained")
    # Get weekdays in range excluding today
    current = start_date
    expected_count = 0
    while current <= end_date:
        if current.weekday() < 5 and current != date.today():  # weekday and not today
            expected_count += 1
        current += timedelta(days=1)
    
    # The actual count might be less if weekends are excluded
    assert len(absences) == expected_count


def test_resolve_unexplained_absence(db_session, test_employee, test_manager):
    """Test resolving an unexplained absence"""
    # Arrange - Create an unexplained absence
    absence = UnexplainedAbsence(
        employee_id=test_employee.employee_id,
        date=date.today() - timedelta(days=1),
        status='pending'
    )
    db_session.add(absence)
    db_session.commit()
    db_session.refresh(absence)
    
    # Act
    update_data = UnexplainedAbsenceUpdate(
        status='resolved',
        notes='Manager verified'
    )
    resolved = att_service.resolve_unexplained_absence(
        db_session, 
        absence.id, 
        test_manager.employee_id, 
        update_data
    )
    
    # Assert
    assert resolved.status == 'resolved'
    assert resolved.notes == 'Manager verified'
    assert resolved.resolved_by == test_manager.employee_id
    assert resolved.resolved_at is not None


# ========================================
# TEST 7: TEAM ATTENDANCE VIEW
# ========================================

def test_get_team_attendance(db_session, test_employee, test_manager):
    """Test getting attendance for a team"""
    # Arrange - Create another employee in same team
    emp2_data = EmployeeCreate(
        employee_id="EMP002",
        name="Team Member 2",
        designation="Developer",
        team="Engineering",  # Same team
        manager_id=test_manager.employee_id,
        join_date=date(2025, 2, 1),
        employment_status="active",
        access_tier="employee"
    )
    emp2 = emp_service.create_employee(db_session, emp2_data)
    
    # Create attendance for both
    today = date.today()
    rec1 = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=today,
        status=AttendanceStatus.IN_OFFICE
    )
    rec2 = AttendanceCreate(
        employee_id=emp2.employee_id,
        attendance_date=today,
        status=AttendanceStatus.WFH
    )
    att_service.create_attendance_record(db_session, rec1)
    att_service.create_attendance_record(db_session, rec2)
    
    # Act
    team_data = att_service.get_team_attendance(db_session, "Engineering", today)
    
    # Assert
    assert len(team_data) == 2  # Both employees in Engineering team
    assert team_data[0]['employee_name'] in ["Test User", "Team Member 2"]
    assert team_data[0]['attendance'] is not None


# ========================================
# TEST 8: EXPORT
# ========================================

def test_export_attendance_data(db_session, test_employee):
    """Test exporting attendance data"""
    # Arrange
    year = 2026
    month = 6
    rec = AttendanceCreate(
        employee_id=test_employee.employee_id,
        attendance_date=date(year, month, 1),
        status=AttendanceStatus.IN_OFFICE,
        check_in=datetime.strptime("09:30:00", "%H:%M:%S").time(),
        check_out=datetime.strptime("18:30:00", "%H:%M:%S").time()
    )
    att_service.create_attendance_record(db_session, rec)
    
    # Act
    export_data = att_service.export_attendance_data(db_session, test_employee.employee_id, year, month)
    
    # Assert
    assert len(export_data) == 1
    assert export_data[0]['Date'] == date(year, month, 1).isoformat()
    assert export_data[0]['Status'] == 'in-office'
    assert export_data[0]['Check In'] == "09:30:00"
    assert export_data[0]['Check Out'] == "18:30:00"
    assert export_data[0]['Source'] == "manual"


# ========================================
# TEST 9: BULK CREATE
# ========================================

def test_bulk_create_attendance(db_session, test_employee):
    """Test bulk creation of attendance records"""
    # Arrange
    today = date.today()
    records = [
        AttendanceCreate(
            employee_id=test_employee.employee_id,
            attendance_date=today - timedelta(days=i),
            status=AttendanceStatus.IN_OFFICE if i % 2 == 0 else AttendanceStatus.WFH
        )
        for i in range(3)
    ]
    
    # Act
    created = att_service.bulk_create_attendance(db_session, records)
    
    # Assert
    assert len(created) == 3
    # Verify all are saved
    all_records = att_service.get_employee_attendance(db_session, test_employee.employee_id)
    assert len(all_records) == 3


def test_bulk_create_with_error(db_session, test_employee):
    """Test bulk create with one invalid record"""
    # Arrange
    today = date.today()
    records = [
        AttendanceCreate(
            employee_id=test_employee.employee_id,
            attendance_date=today,
            status=AttendanceStatus.IN_OFFICE
        ),
        AttendanceCreate(
            employee_id="INVALID_EMP",  # This will fail
            attendance_date=today,
            status=AttendanceStatus.IN_OFFICE
        )
    ]
    
    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        att_service.bulk_create_attendance(db_session, records)
    
    assert "error" in str(exc_info.value).lower() or "not found" in str(exc_info.value)