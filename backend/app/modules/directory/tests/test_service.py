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


def test_create_and_get_employee(db):
    emp_in = EmployeeCreate(employee_id="E001", name="Asha Rao")
    created = service.create_employee(db, emp_in)
    assert created.employee_id == "E001"
    assert created.employment_status == "active"

    fetched = service.get_employee(db, "E001")
    assert fetched.name == "Asha Rao"


def test_create_duplicate_employee_raises(db):
    emp_in = EmployeeCreate(employee_id="E001", name="Asha Rao")
    service.create_employee(db, emp_in)
    with pytest.raises(service.EmployeeAlreadyExists):
        service.create_employee(db, emp_in)


def test_list_active_excludes_exited(db):
    service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"))
    service.create_employee(db, EmployeeCreate(employee_id="E002", name="Ravi Kumar"))
    service.mark_employee_exited(db, "E002")

    active = service.list_active_employees(db)
    assert [e.employee_id for e in active] == ["E001"]


def test_update_employee(db):
    service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    service.create_employee(db, EmployeeCreate(employee_id="E001", name="Asha Rao"))
    updated = service.update_employee(db, "E001", EmployeeUpdate(team_id="T1"))
    assert updated.team_id == "T1"


def test_update_missing_employee_raises(db):
    with pytest.raises(service.EmployeeNotFound):
        service.update_employee(db, "NOPE", EmployeeUpdate(team_id="T1"))


def test_create_team_and_link_employee(db):
    team = service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    assert team.name == "Delivery"

    emp = service.create_employee(
        db, EmployeeCreate(employee_id="E001", name="Asha Rao", team_id="T1")
    )
    assert emp.team_id == "T1"


def test_create_duplicate_team_raises(db):
    service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
    with pytest.raises(service.TeamAlreadyExists):
        service.create_team(db, TeamCreate(team_id="T1", name="Delivery"))
