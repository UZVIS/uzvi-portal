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

    from app.modules.directory.models import Employee

    admin = Employee(
        employee_id="EMP001", name="Seed Admin", access_tier="Admin/Leadership",
        employment_status="active",
    )
    db.add(admin)
    db.commit()
    return admin.employee_id


def test_bootstrap_first_employee_with_no_existing_admin_succeeds(db):

    emp_in = EmployeeCreate(name="First Admin", access_tier="Employee")
    created = service.create_employee(db, emp_in, requester_id="whatever")
    assert created.employee_id == "EMP001"
    assert created.access_tier == "Admin/Leadership"


def test_second_employee_after_bootstrap_requires_authorization(db):
    service.create_employee(db, EmployeeCreate(name="First Admin"), requester_id="whatever")
    with pytest.raises(service.NotAuthorized):
        service.create_employee(db, EmployeeCreate(name="Someone"), requester_id="NOT_REAL")


def test_ids_auto_generate_in_sequence(db, admin):
    a = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    b = service.create_employee(db, EmployeeCreate(name="Ravi Kumar"), admin)
    assert a.employee_id == "EMP002"
    assert b.employee_id == "EMP003"


def test_create_and_get_employee(db, admin):
    created = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    assert created.employment_status == "active"

    fetched = service.get_employee(db, created.employee_id)
    assert fetched.name == "Asha Rao"


def test_create_employee_unauthorized_requester_raises(db, admin):
    emp = service.create_employee(
        db, EmployeeCreate(name="Asha Rao", access_tier="Employee"), admin
    )
    with pytest.raises(service.NotAuthorized):
        service.create_employee(db, EmployeeCreate(name="Ravi"), emp.employee_id)


def test_create_employee_unknown_requester_raises(db, admin):
    with pytest.raises(service.NotAuthorized):
        service.create_employee(db, EmployeeCreate(name="Asha Rao"), "GHOST")


def test_exited_requester_can_no_longer_manage(db, admin):
    service.mark_employee_exited(db, admin, admin)
    with pytest.raises(service.NotAuthorized):
        service.create_employee(db, EmployeeCreate(name="Should Fail"), admin)


def test_list_active_excludes_exited(db, admin):
    a = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    b = service.create_employee(db, EmployeeCreate(name="Ravi Kumar"), admin)
    service.mark_employee_exited(db, b.employee_id, admin)

    active = service.list_active_employees(db)
    active_ids = [e.employee_id for e in active]
    assert a.employee_id in active_ids
    assert b.employee_id not in active_ids


def test_list_exited_shows_only_exited(db, admin):
    a = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    b = service.create_employee(db, EmployeeCreate(name="Ravi Kumar"), admin)
    service.mark_employee_exited(db, b.employee_id, admin)

    exited = service.list_exited_employees(db, admin)
    exited_ids = [e.employee_id for e in exited]
    assert b.employee_id in exited_ids
    assert a.employee_id not in exited_ids


def test_list_exited_by_non_admin_raises(db, admin):
    emp = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    with pytest.raises(service.NotAuthorized):
        service.list_exited_employees(db, emp.employee_id)


def test_exit_unauthorized_requester_raises(db, admin):
    emp = service.create_employee(
        db, EmployeeCreate(name="Asha Rao", access_tier="Employee"), admin
    )
    with pytest.raises(service.NotAuthorized):
        service.mark_employee_exited(db, emp.employee_id, emp.employee_id)


def test_update_employee(db, admin):
    service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    emp = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    updated = service.update_employee(db, emp.employee_id, EmployeeUpdate(team_id="T1"), admin)
    assert updated.team_id == "T1"


def test_update_missing_employee_raises(db, admin):
    with pytest.raises(service.EmployeeNotFound):
        service.update_employee(db, "NOPE", EmployeeUpdate(team_id="T1"), admin)


def test_update_unauthorized_requester_raises(db, admin):
    emp = service.create_employee(
        db, EmployeeCreate(name="Asha Rao", access_tier="Employee"), admin
    )
    with pytest.raises(service.NotAuthorized):
        service.update_employee(db, emp.employee_id, EmployeeUpdate(name="X"), emp.employee_id)


def test_hr_restricted_can_also_manage(db, admin):
    hr = service.create_employee(
        db, EmployeeCreate(name="HR Person", access_tier="HR-Restricted"), admin
    )
    created = service.create_employee(db, EmployeeCreate(name="Asha Rao"), hr.employee_id)
    assert created.employment_status == "active"


def test_create_team_and_link_employee(db, admin):
    team = service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    assert team.name == "Delivery"
    emp = service.create_employee(db, EmployeeCreate(name="Asha Rao", team_id="T1"), admin)
    assert emp.team_id == "T1"


def test_create_employee_with_invalid_manager_tier_raises(db, admin):
    plain_emp = service.create_employee(
        db, EmployeeCreate(name="Plain Employee", access_tier="Employee"), admin
    )
    with pytest.raises(service.InvalidManager):
        service.create_employee(
            db, EmployeeCreate(name="Someone", manager_id=plain_emp.employee_id), admin
        )


def test_create_employee_with_nonexistent_manager_raises(db, admin):
    with pytest.raises(service.InvalidManager):
        service.create_employee(
            db, EmployeeCreate(name="Someone", manager_id="GHOST"), admin
        )


def test_update_employee_self_referencing_manager_raises(db, admin):
    emp = service.create_employee(db, EmployeeCreate(name="Asha Rao"), admin)
    with pytest.raises(service.InvalidManager):
        service.update_employee(
            db, emp.employee_id, EmployeeUpdate(manager_id=emp.employee_id), admin
        )


def test_create_employee_with_valid_manager_succeeds(db, admin):
    mgr = service.create_employee(
        db, EmployeeCreate(name="Shaik", access_tier="Manager"), admin
    )
    emp = service.create_employee(
        db, EmployeeCreate(name="Asha Rao", manager_id=mgr.employee_id), admin
    )
    assert emp.manager_id == mgr.employee_id


def test_team_ids_auto_generate_in_sequence(db):
    a = service.create_team(db, TeamCreate(name="Delivery"))
    b = service.create_team(db, TeamCreate(name="Engineering"))
    assert a.team_id == "TM001"
    assert b.team_id == "TM002"