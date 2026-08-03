import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory import service
from app.modules.directory.schemas import EmployeeCreate, EmployeeUpdate, TeamCreate


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def admin(db):
    """A seed Admin/Leadership employee to act as the requester in tests.
    Bootstrapped directly since no employee can create the very first one."""
    from app.modules.directory.models import Employee

    admin = Employee(employee_id="ADMIN1", name="Seed Admin", access_tier="Admin/Leadership")
    db.add(admin)
    db.commit()
    return admin.employee_id


def test_bootstrap_first_employee_with_no_existing_admin_succeeds(db):
    # On a genuinely empty directory there's no Admin yet to authorize the
    # first employee - this must succeed anyway, or the system could never
    # be used from a clean database.
    emp_in = EmployeeCreate(
        employee_id="FIRST1", name="First Admin", access_tier="Admin/Leadership"
    )
    created = service.create_employee(db, emp_in, requester_id="FIRST1")
    assert created.employee_id == "FIRST1"


def test_second_employee_after_bootstrap_requires_authorization(db):
    service.create_employee(
        db,
        EmployeeCreate(employee_id="FIRST1", name="First Admin", access_tier="Admin/Leadership"),
        requester_id="FIRST1",
    )
    # Directory is no longer empty, so the normal check applies - a random
    # unauthorized ID must be rejected even right after bootstrap.
    with pytest.raises(service.NotAuthorized):
        service.create_employee(
            db,
            EmployeeCreate(employee_id="E002", name="Someone"),
            requester_id="NOT_REAL",
        )


def test_create_and_get_employee(db, admin):
    emp_in = EmployeeCreate(employee_id="E001", name="Asha Rao")
    created = service.create_employee(db, emp_in, admin)
    assert created.employee_id == "E001"
    assert created.employment_status == "active"

    fetched = service.get_employee(db, "E001")
    assert fetched.name == "Asha Rao"


def test_create_duplicate_employee_raises(db, admin):
    emp_in = EmployeeCreate(employee_id="E001", name="Asha Rao")
    service.create_employee(db, emp_in, admin)
    with pytest.raises(service.EmployeeAlreadyExists):
        service.create_employee(db, emp_in, admin)


def test_create_employee_unauthorized_requester_raises(db, admin):
    # A plain Employee tier may not create other employees (FR-DIR-05).
    service.create_employee(
        db, EmployeeCreate(employee_id="E001", name="Asha Rao", access_tier="Employee"), admin
    )
    with pytest.raises(service.NotAuthorized):
        service.create_employee(db, EmployeeCreate(employee_id="E002", name="Ravi"), "E001")


def test_create_employee_unknown_requester_raises(db):
    with pytest.raises(service.NotAuthorized):
        service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"), "GHOST")


def test_list_active_excludes_exited(db, admin):
    service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"), admin)
    service.create_employee(db, EmployeeCreate(employee_id="E002", name="Ravi Kumar"), admin)
    service.mark_employee_exited(db, "E002", admin)

    active = service.list_active_employees(db)
    active_ids = [e.employee_id for e in active]
    assert "E001" in active_ids
    assert "E002" not in active_ids


def test_list_exited_shows_only_exited(db, admin):
   
    service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"), admin)
    service.create_employee(db, EmployeeCreate(employee_id="E002", name="Ravi Kumar"), admin)
    service.mark_employee_exited(db, "E002", admin)

    exited = service.list_exited_employees(db, admin)
    exited_ids = [e.employee_id for e in exited]
    assert "E002" in exited_ids
    assert "E001" not in exited_ids


def test_list_exited_by_non_admin_raises(db, admin):
    service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"), admin)
    with pytest.raises(service.NotAuthorized):
        service.list_exited_employees(db, "E001")


def test_exit_unauthorized_requester_raises(db, admin):
    service.create_employee(
        db, EmployeeCreate(employee_id="E001", name="Asha Rao", access_tier="Employee"), admin
    )
    with pytest.raises(service.NotAuthorized):
        service.mark_employee_exited(db, "E001", "E001")


def test_update_employee(db, admin):
    service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"), admin)
    updated = service.update_employee(db, "E001", EmployeeUpdate(team_id="T1"), admin)
    assert updated.team_id == "T1"


def test_update_missing_employee_raises(db, admin):
    with pytest.raises(service.EmployeeNotFound):
        service.update_employee(db, "NOPE", EmployeeUpdate(team_id="T1"), admin)


def test_update_unauthorized_requester_raises(db, admin):
    service.create_employee(
        db, EmployeeCreate(employee_id="E001", name="Asha Rao", access_tier="Employee"), admin
    )
    with pytest.raises(service.NotAuthorized):
        service.update_employee(db, "E001", EmployeeUpdate(name="X"), "E001")


def test_hr_restricted_can_also_manage(db, admin):
    service.create_employee(
        db,
        EmployeeCreate(employee_id="HR1", name="HR Person", access_tier="HR-Restricted"),
        admin,
    )
    created = service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"), "HR1")
    assert created.employee_id == "E001"


def test_create_team_and_link_employee(db, admin):
    team = service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    assert team.name == "Delivery"

    emp = service.create_employee(
        db, EmployeeCreate(employee_id="E001", name="Asha Rao", team_id="T1"), admin
    )
    assert emp.team_id == "T1"


def test_create_duplicate_team_raises(db):
    service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    with pytest.raises(service.TeamAlreadyExists):
        service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
