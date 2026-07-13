
from sqlalchemy.orm import Session

from app.modules.directory.models import Employee, Team
from app.modules.directory.schemas import EmployeeCreate, EmployeeUpdate, TeamCreate


class EmployeeAlreadyExists(Exception):
    pass


class EmployeeNotFound(Exception):
    pass


class TeamAlreadyExists(Exception):
    pass


def create_team(db: Session, team_in: TeamCreate) -> Team:
    existing = db.query(Team).filter(Team.team_id == team_in.team_id).first()
    if existing:
        raise TeamAlreadyExists(team_in.team_id)

    new_team = Team(**team_in.model_dump())
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


def list_teams(db: Session) -> list[Team]:
    return db.query(Team).all()


def create_employee(db: Session, employee_in: EmployeeCreate) -> Employee:
    existing = get_employee(db, employee_in.employee_id)
    if existing:
        raise EmployeeAlreadyExists(employee_in.employee_id)

    new_emp = Employee(**employee_in.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


def get_employee(db: Session, employee_id: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()


def list_active_employees(db: Session) -> list[Employee]:
  
    return db.query(Employee).filter(Employee.employment_status == "active").all()


def update_employee(db: Session, employee_id: str, update_in: EmployeeUpdate) -> Employee:
    employee = get_employee(db, employee_id)
    if not employee:
        raise EmployeeNotFound(employee_id)

    for field, value in update_in.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


def mark_employee_exited(db: Session, employee_id: str) -> Employee:
    employee = get_employee(db, employee_id)
    if not employee:
        raise EmployeeNotFound(employee_id)

    employee.employment_status = "exited"
    db.commit()
    db.refresh(employee)
    return employee
