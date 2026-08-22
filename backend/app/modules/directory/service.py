
from sqlalchemy.orm import Session

from app.modules.directory.models import Employee, Team
from app.modules.directory.schemas import EmployeeCreate, EmployeeUpdate, TeamCreate

MANAGE_TIERS = {"Admin", "Admin/Leadership", "HR-Restricted"}


class EmployeeAlreadyExists(Exception):
    pass


class EmployeeNotFound(Exception):
    pass


class TeamAlreadyExists(Exception):
    pass


class NotAuthorized(Exception):
    pass


def _check_can_manage(db: Session, requester_id: str) -> None:
    requester = get_employee(db, requester_id)
    if (
        requester is None
        or requester.employment_status != "active"
        or requester.access_tier not in MANAGE_TIERS
    ):
        raise NotAuthorized(
            "Only an active Admin/Leadership or HR-Restricted account may add, edit, or exit an employee."
        )


def _generate_next_team_id(db: Session) -> str:
    all_ids = [row[0] for row in db.query(Team.team_id).all()]
    max_num = 0
    for tid in all_ids:
        if tid.startswith("TM") and tid[2:].isdigit():
            max_num = max(max_num, int(tid[2:]))
    return f"TM{max_num + 1:03d}"


def create_team(db: Session, team_in: TeamCreate) -> Team:
    new_team_id = _generate_next_team_id(db)
    data = team_in.model_dump(exclude={"team_id"}, exclude_unset=True)
    new_team = Team(team_id=new_team_id, **data)
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


def list_teams(db: Session) -> list[Team]:
    return db.query(Team).all()


def _generate_next_employee_id(db: Session) -> str:
    # Unified sequence for every tier - Admin, HR, Manager, and Employee
    # all share one EMP### series. Access tier is a permission level, not
    # a separate identity category, per team decision.
    all_ids = [row[0] for row in db.query(Employee.employee_id).all()]
    max_num = 0
    for eid in all_ids:
        if eid.startswith("EMP") and eid[3:].isdigit():
            max_num = max(max_num, int(eid[3:]))
    return f"EMP{max_num + 1:03d}"


class InvalidManager(Exception):
    pass


def _validate_manager_id(db: Session, manager_id: str | None, employee_id: str | None) -> None:
    if manager_id is None:
        return
    if manager_id == employee_id:
        raise InvalidManager("An employee cannot be their own reporting manager.")
    manager = get_employee(db, manager_id)
    if manager is None:
        raise InvalidManager(f"Manager '{manager_id}' does not exist.")
    if manager.access_tier not in ("Manager", "Admin/Leadership"):
        raise InvalidManager(
            f"'{manager_id}' has tier '{manager.access_tier}' - only Manager or Admin/Leadership may be set as a reporting manager."
        )


def create_employee(
    db: Session, employee_in: EmployeeCreate, requester_id: str
) -> Employee:
    is_empty = db.query(Employee).count() == 0

    data = employee_in.model_dump(exclude={"employee_id"}, exclude_unset=True)

    if is_empty:
        data["access_tier"] = "Admin/Leadership"
    else:
        _check_can_manage(db, requester_id)

    _validate_manager_id(db, data.get("manager_id"), employee_id=None)

    new_employee_id = _generate_next_employee_id(db)

    new_emp = Employee(employee_id=new_employee_id, **data)
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


def get_employee(db: Session, employee_id: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()


def list_active_employees(db: Session) -> list[Employee]:
    return db.query(Employee).filter(Employee.employment_status == "active").all()


def list_exited_employees(db: Session, requester_id: str) -> list[Employee]:
    _check_can_manage(db, requester_id)
    return db.query(Employee).filter(Employee.employment_status == "exited").all()


def update_employee(
    db: Session, employee_id: str, update_in: EmployeeUpdate, requester_id: str
) -> Employee:
    _check_can_manage(db, requester_id)

    employee = get_employee(db, employee_id)
    if not employee:
        raise EmployeeNotFound(employee_id)

    update_data = update_in.model_dump(exclude_unset=True)
    if "manager_id" in update_data:
        _validate_manager_id(db, update_data["manager_id"], employee_id=employee_id)

    for field, value in update_data.items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


def mark_employee_exited(db: Session, employee_id: str, requester_id: str) -> Employee:
    _check_can_manage(db, requester_id)

    employee = get_employee(db, employee_id)
    if not employee:
        raise EmployeeNotFound(employee_id)

    employee.employment_status = "exited"
    db.commit()
    db.refresh(employee)
    return employee
