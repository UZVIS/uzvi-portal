from sqlalchemy.orm import Session

from app.modules.directory.models import Employee
from app.modules.directory.schemas import EmployeeCreate, EmployeeUpdate


class EmployeeAlreadyExists(Exception):
    pass


class EmployeeNotFound(Exception):
    pass


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
