import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.training import schemas, service
from app.modules.training.models import TrainingUnit, UnitCompletion
from app.modules.training.dependencies import (
    get_current_employee,
    require_admin,
    require_cohort_viewer,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # EMP001: Admin. EMP002: Manager. EMP003: HR-Restricted. EMP004: plain
    # Employee (primary actor). EMP005: a second plain Employee (used as
    # "someone else" in cross-employee tests). EMP006: exited Admin.
    session.add(Employee(employee_id="EMP001", name="Alice Admin", access_tier="Admin/Leadership"))
    session.add(Employee(employee_id="EMP002", name="Mona Manager", access_tier="Manager"))
    session.add(Employee(employee_id="EMP003", name="Hana HR", access_tier="HR-Restricted"))
    session.add(Employee(employee_id="EMP004", name="Eddie Employee", access_tier="Employee"))
    session.add(Employee(employee_id="EMP005", name="Other Employee", access_tier="Employee"))
    session.add(Employee(
        employee_id="EMP006", name="Inactive Admin",
        access_tier="Admin/Leadership", employment_status="exited",
    ))
    session.commit()
    yield session
    session.close()


def _make_program_with_unit(db):
    program = service.create_program(db, "Test Program")
    unit = service.create_unit(db, program.program_id, "Unit 1", 1)
    return program, unit


# ---------- schemas.py: field validation ----------

def test_unit_create_rejects_non_positive_sequence():
    with pytest.raises(ValidationError):
        schemas.TrainingUnitCreate(name="Unit", sequence=0)


def test_unit_update_rejects_non_positive_sequence():
    with pytest.raises(ValidationError):
        schemas.TrainingUnitUpdate(sequence=-1)


# ---------- dependencies.py: role gating ----------

def test_get_current_employee_blocks_inactive(db):
    with pytest.raises(HTTPException) as exc:
        get_current_employee(x_employee_id="EMP006", db=db)
    assert exc.value.status_code == 403


def test_get_current_employee_blocks_unknown_id(db):
    with pytest.raises(HTTPException) as exc:
        get_current_employee(x_employee_id="EMP999", db=db)
    assert exc.value.status_code == 401


def test_require_admin_allows_admin(db):
    admin = db.get(Employee, "EMP001")
    assert require_admin(admin) is admin


def test_require_admin_blocks_manager(db):
    manager = db.get(Employee, "EMP002")
    with pytest.raises(HTTPException) as exc:
        require_admin(manager)
    assert exc.value.status_code == 403


def test_require_cohort_viewer_allows_manager_hr_admin(db):
    for emp_id in ("EMP001", "EMP002", "EMP003"):
        emp = db.get(Employee, emp_id)
        assert require_cohort_viewer(emp) is emp


def test_require_cohort_viewer_blocks_plain_employee(db):
    employee = db.get(Employee, "EMP004")
    with pytest.raises(HTTPException) as exc:
        require_cohort_viewer(employee)
    assert exc.value.status_code == 403


# ---------- programs / units ----------

def test_create_program_succeeds(db):
    program = service.create_program(db, "Onboarding Basics")
    assert program.program_id is not None
    assert program.name == "Onboarding Basics"


def test_create_unit_duplicate_sequence_raises(db):
    program, _ = _make_program_with_unit(db)
    with pytest.raises(HTTPException) as exc:
        service.create_unit(db, program.program_id, "Unit 2", 1)  # same sequence=1
    assert exc.value.status_code == 400


def test_get_program_not_found_raises_404(db):
    with pytest.raises(HTTPException) as exc:
        service.get_program(db, 9999)
    assert exc.value.status_code == 404


def test_delete_program_with_enrollments_raises(db):
    program, _ = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    admin = db.get(Employee, "EMP001")
    service.enroll_employee(db, program.program_id, employee.employee_id, admin, is_admin=True)
    with pytest.raises(HTTPException) as exc:
        service.delete_program(db, program.program_id)
    assert exc.value.status_code == 400


def test_delete_unit_with_completions_raises(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=None)
    with pytest.raises(HTTPException) as exc:
        service.delete_unit(db, unit.unit_id)
    assert exc.value.status_code == 400


def test_delete_unit_without_completions_succeeds(db):
    program, unit = _make_program_with_unit(db)
    service.delete_unit(db, unit.unit_id)
    assert db.get(TrainingUnit, unit.unit_id) is None


def test_update_unit_name_only_succeeds(db):
    program, unit = _make_program_with_unit(db)
    updated = service.update_unit(db, unit.unit_id, name="Renamed Unit")
    assert updated.name == "Renamed Unit"
    assert updated.sequence == 1  # unchanged


def test_update_unit_sequence_only_succeeds(db):
    program, unit = _make_program_with_unit(db)
    service.create_unit(db, program.program_id, "Unit 2", 2)
    updated = service.update_unit(db, unit.unit_id, sequence=3)
    assert updated.sequence == 3
    assert updated.name == "Unit 1"  # unchanged


def test_update_unit_duplicate_sequence_raises(db):
    program, unit = _make_program_with_unit(db)
    service.create_unit(db, program.program_id, "Unit 2", 2)
    with pytest.raises(HTTPException) as exc:
        service.update_unit(db, unit.unit_id, sequence=2)  # already used by Unit 2
    assert exc.value.status_code == 400


def test_update_unit_same_sequence_is_not_a_false_conflict(db):
    # Re-saving a unit's own current sequence must not trip the duplicate
    # check against itself.
    program, unit = _make_program_with_unit(db)
    updated = service.update_unit(db, unit.unit_id, name="Same Sequence", sequence=1)
    assert updated.sequence == 1
    assert updated.name == "Same Sequence"


def test_update_unit_unknown_raises_404(db):
    with pytest.raises(HTTPException) as exc:
        service.update_unit(db, 9999, name="Doesn't matter")
    assert exc.value.status_code == 404


# ---------- enrollments ----------

def test_enroll_self_succeeds(db):
    program, _ = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    assert enrollment.employee_id == "EMP004"


def test_enroll_duplicate_raises_409(db):
    program, _ = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    with pytest.raises(HTTPException) as exc:
        service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    assert exc.value.status_code == 409


def test_enroll_someone_else_by_non_admin_raises_403(db):
    program, _ = _make_program_with_unit(db)
    actor = db.get(Employee, "EMP004")
    with pytest.raises(HTTPException) as exc:
        service.enroll_employee(db, program.program_id, "EMP005", actor, is_admin=False)
    assert exc.value.status_code == 403


def test_enroll_someone_else_by_admin_succeeds(db):
    program, _ = _make_program_with_unit(db)
    admin = db.get(Employee, "EMP001")
    enrollment = service.enroll_employee(db, program.program_id, "EMP005", admin, is_admin=True)
    assert enrollment.employee_id == "EMP005"


def test_enroll_inactive_employee_raises_400(db):
    program, _ = _make_program_with_unit(db)
    admin = db.get(Employee, "EMP001")
    with pytest.raises(HTTPException) as exc:
        service.enroll_employee(db, program.program_id, "EMP006", admin, is_admin=True)
    assert exc.value.status_code == 400


def test_enroll_unknown_employee_raises_404(db):
    program, _ = _make_program_with_unit(db)
    admin = db.get(Employee, "EMP001")
    with pytest.raises(HTTPException) as exc:
        service.enroll_employee(db, program.program_id, "EMP999", admin, is_admin=True)
    assert exc.value.status_code == 404


# ---------- completions ----------

def test_complete_unit_self_attested_succeeds(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    completion = service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=85)
    assert completion.score == 85


def test_complete_unit_by_someone_else_raises_403_even_for_admin(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    admin = db.get(Employee, "EMP001")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    # Not even Admin/Leadership can mark someone else's unit complete.
    with pytest.raises(HTTPException) as exc:
        service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, admin, score=100)
    assert exc.value.status_code == 403


def test_complete_unit_cross_program_raises_400(db):
    program1, unit1 = _make_program_with_unit(db)
    program2 = service.create_program(db, "Other Program")
    unit2 = service.create_unit(db, program2.program_id, "Other Unit", 1)
    employee = db.get(Employee, "EMP004")
    enrollment = service.enroll_employee(db, program1.program_id, employee.employee_id, employee, is_admin=False)
    with pytest.raises(HTTPException) as exc:
        service.complete_unit(db, enrollment.enrollment_id, unit2.unit_id, employee, score=None)
    assert exc.value.status_code == 400


def test_complete_unit_duplicate_raises_409(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=None)
    with pytest.raises(HTTPException) as exc:
        service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=None)
    assert exc.value.status_code == 409


def test_complete_unit_unknown_enrollment_raises_404(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    with pytest.raises(HTTPException) as exc:
        service.complete_unit(db, 9999, unit.unit_id, employee, score=None)
    assert exc.value.status_code == 404


# ---------- undo completion ----------

def test_delete_completion_by_owner_succeeds(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    completion = service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=None)
    completion_id = completion.completion_id

    service.delete_completion(db, completion_id, employee)
    assert db.get(UnitCompletion, completion_id) is None

    # Deleting the completion allows completing the same unit again - the
    # duplicate check in complete_unit only looks at rows that still exist.
    # (Note: SQLite may legitimately reuse the same integer id here since
    # these tables use plain INTEGER PRIMARY KEY, not AUTOINCREMENT - that's
    # not something the business logic promises either way.)
    second = service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=None)
    assert second.enrollment_id == enrollment.enrollment_id
    assert second.unit_id == unit.unit_id


def test_delete_completion_by_someone_else_raises_403_even_for_admin(db):
    program, unit = _make_program_with_unit(db)
    employee = db.get(Employee, "EMP004")
    admin = db.get(Employee, "EMP001")
    enrollment = service.enroll_employee(db, program.program_id, employee.employee_id, employee, is_admin=False)
    completion = service.complete_unit(db, enrollment.enrollment_id, unit.unit_id, employee, score=None)
    with pytest.raises(HTTPException) as exc:
        service.delete_completion(db, completion.completion_id, admin)
    assert exc.value.status_code == 403


def test_delete_completion_unknown_raises_404(db):
    employee = db.get(Employee, "EMP004")
    with pytest.raises(HTTPException) as exc:
        service.delete_completion(db, 9999, employee)
    assert exc.value.status_code == 404


# ---------- cohort progress ----------

def test_cohort_progress_computes_percentages(db):
    program, unit = _make_program_with_unit(db)
    emp1 = db.get(Employee, "EMP004")
    emp2 = db.get(Employee, "EMP005")
    e1 = service.enroll_employee(db, program.program_id, emp1.employee_id, emp1, is_admin=False)
    service.enroll_employee(db, program.program_id, emp2.employee_id, emp2, is_admin=False)
    service.complete_unit(db, e1.enrollment_id, unit.unit_id, emp1, score=None)

    result = service.get_cohort_progress(db, program.program_id)
    by_id = {row["employee_id"]: row for row in result["employees"]}
    assert by_id["EMP004"]["completion_pct"] == 100.0
    assert by_id["EMP005"]["completion_pct"] == 0.0


def test_cohort_progress_flags_employee_below_median(db):
    program = service.create_program(db, "Multi-unit Program")
    unit1 = service.create_unit(db, program.program_id, "Unit 1", 1)
    unit2 = service.create_unit(db, program.program_id, "Unit 2", 2)
    emp1 = db.get(Employee, "EMP004")  # completes both units: 100%
    emp2 = db.get(Employee, "EMP005")  # completes zero: 0%
    e1 = service.enroll_employee(db, program.program_id, emp1.employee_id, emp1, is_admin=False)
    service.enroll_employee(db, program.program_id, emp2.employee_id, emp2, is_admin=False)
    service.complete_unit(db, e1.enrollment_id, unit1.unit_id, emp1, score=None)
    service.complete_unit(db, e1.enrollment_id, unit2.unit_id, emp1, score=None)

    result = service.get_cohort_progress(db, program.program_id)
    by_id = {row["employee_id"]: row for row in result["employees"]}
    # median of [100, 0] = 50; emp2 at 0% is 50 points below median (> 20 margin)
    assert by_id["EMP005"]["flagged_behind"] is True
    assert by_id["EMP004"]["flagged_behind"] is False
