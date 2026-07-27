import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import Base

# Import models so Base.metadata can create tables
from app.modules.directory.models import Employee, Team
from app.modules.leave.models import (
    LeaveType,
    LeaveBalance,
    LeaveApplication,
    LeaveAuditLog,
)

from app.modules.leave import service
from app.modules.leave import schemas

from app.modules.directory import service as dir_service
from app.modules.directory import schemas as dir_schemas


# ==========================================
# Database Fixture
# ==========================================

@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False}
    )

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    db = TestingSessionLocal()

    yield db

    db.close()


# ==========================================
# Helper Functions
# ==========================================

def create_employee(db, emp_id="EMP001"):
    employee = dir_schemas.EmployeeCreate(
        employee_id=emp_id,
        name="Test Employee",
        designation="Software Engineer",
        access_tier="Employee",
        contact_details="test@company.com"
    )

    return dir_service.create_employee(db, employee)


def create_leave_type(db):
    leave_type = schemas.LeaveTypeCreate(
        name="Earned Leave",
        accrual_method="Monthly",
        carry_forward_limit=10,
        doc_required_threshold=2
    )

    return service.create_leave_type(db, leave_type)


# ==========================================
# Leave Type Tests
# ==========================================

def test_create_leave_type(db):
    leave = create_leave_type(db)

    assert leave is not None
    assert leave.leave_type_id.startswith("LT")
    assert leave.name == "Earned Leave"
    assert leave.accrual_method == "Monthly"


def test_get_leave_types(db):
    create_leave_type(db)

    leave_types = service.get_leave_types(db)

    assert len(leave_types) == 1
    assert leave_types[0].name == "Earned Leave"
    assert leave_types[0].carry_forward_limit == 10

# ==========================================
# Leave Balance Tests
# ==========================================

def test_create_leave_balance(db):
    employee = create_employee(db)
    leave_type = create_leave_type(db)

    balance = schemas.LeaveBalanceCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave_type.leave_type_id,
        year=2026,
        balance=12,
    )

    result = service.create_leave_balance(db, balance)

    assert result is not None
    assert result.employee_id == employee.employee_id
    assert result.leave_type_id == leave_type.leave_type_id
    assert result.balance == 12

def test_get_leave_balances(db):
    employee = create_employee(db)
    leave_type = create_leave_type(db)

    balance = schemas.LeaveBalanceCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave_type.leave_type_id,
        year=2026,
        balance=12,
    )

    service.create_leave_balance(db, balance)

    balances = service.get_leave_balances(db, employee.employee_id)

    assert len(balances) == 1
    assert balances[0].employee_id == employee.employee_id
    assert balances[0].balance == 12

from fastapi import HTTPException
import pytest

def test_create_leave_balance_employee_not_found(db):
    leave_type = create_leave_type(db)

    balance = schemas.LeaveBalanceCreate(
        employee_id="EMP999",
        leave_type_id=leave_type.leave_type_id,
        year=2026,
        balance=12,
    )

    with pytest.raises(HTTPException) as exc:
        service.create_leave_balance(db, balance)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Employee not found in Employee Directory"

# ==========================================
# Leave Application Tests
# ==========================================

def test_create_leave_application(db):
    employee = create_employee(db)
    leave = create_leave_type(db)

    application = schemas.LeaveApplicationCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=date(2026, 7, 25),
        end_date=date(2026, 7, 26)
    )

    result = service.create_leave_application(db, application)

    assert result is not None
    assert result.application_id.startswith("LA")
    assert result.employee_id == employee.employee_id
    assert result.status.value == "pending"


def test_create_leave_application_employee_not_found(db):
    leave = create_leave_type(db)

    application = schemas.LeaveApplicationCreate(
        employee_id="EMP999",
        leave_type_id=leave.leave_type_id,
        start_date=date(2026, 7, 25),
        end_date=date(2026, 7, 26)
    )

    with pytest.raises(HTTPException) as exc:
        service.create_leave_application(db, application)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Employee not found in Employee Directory"


def test_get_leave_applications(db):
    employee = create_employee(db)
    leave = create_leave_type(db)

    application = schemas.LeaveApplicationCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=date(2026, 7, 25),
        end_date=date(2026, 7, 25)
    )

    service.create_leave_application(db, application)

    applications = service.get_leave_applications(db)

    assert len(applications) == 1
    assert applications[0].employee_id == employee.employee_id


# ==========================================
# Update Leave Application Tests
# ==========================================

def test_update_leave_status_approved(db):
    employee = create_employee(db)
    leave = create_leave_type(db)

    balance = schemas.LeaveBalanceCreate(
    employee_id=employee.employee_id,
    leave_type_id=leave.leave_type_id,
    year=2026,
    balance=12,
    )
    service.create_leave_balance(db, balance)

    application = schemas.LeaveApplicationCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=date(2026, 7, 25),
        end_date=date(2026, 7, 26)
    )

    created = service.create_leave_application(db, application)

    status_update = schemas.LeaveStatusUpdate(
        status=schemas.LeaveStatusEnum.APPROVED,
        approver_id="EMP001"
    )

    updated = service.update_leave_status(
        db,
        created.application_id,
        status_update
    )

    assert updated.status == schemas.LeaveStatusEnum.APPROVED
    assert updated.approver_id == "EMP001"

def test_update_leave_status_rejected(db):
    employee = create_employee(db)
    leave = create_leave_type(db)

    application = schemas.LeaveApplicationCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=date(2026, 7, 25),
        end_date=date(2026, 7, 26)
    )

    created = service.create_leave_application(db, application)

    status_update = schemas.LeaveStatusUpdate(
        status=schemas.LeaveStatusEnum.REJECTED,
        approver_id="EMP001"
    )

    updated = service.update_leave_status(
        db,
        created.application_id,
        status_update
    )

    assert updated.status == schemas.LeaveStatusEnum.REJECTED

def test_update_leave_status_not_found(db):
    status_update = schemas.LeaveStatusUpdate(
        status=schemas.LeaveStatusEnum.APPROVED,
        approver_id="EMP001"
    )

    with pytest.raises(HTTPException) as exc:
        service.update_leave_status(
            db,
            "INVALID_ID",
            status_update
        )

    assert exc.value.status_code == 404

def test_update_leave_status_already_processed(db):
    employee = create_employee(db)
    leave = create_leave_type(db)
    # Create Leave Balance
    balance = schemas.LeaveBalanceCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave.leave_type_id,
        year=2026,
        balance=12,
    )
    service.create_leave_balance(db, balance)

    application = schemas.LeaveApplicationCreate(
        employee_id=employee.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=date(2026, 7, 25),
        end_date=date(2026, 7, 26)
    )

    created = service.create_leave_application(db, application)

    approved = schemas.LeaveStatusUpdate(
        status=schemas.LeaveStatusEnum.APPROVED,
        approver_id="EMP001"
    )

    service.update_leave_status(
        db,
        created.application_id,
        approved
    )

    with pytest.raises(HTTPException):
        service.update_leave_status(
            db,
            created.application_id,
            approved
        )