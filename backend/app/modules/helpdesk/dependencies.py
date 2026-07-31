from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee

# Per FR-HLP-05: assigned owners/Admin see the full queue; a plain Employee
# only sees their own tickets (FR-HLP-04).
PRIVILEGED_TIERS = {"Manager", "Admin/Leadership", "HR-Restricted"}


def get_current_employee(
    x_employee_id: str | None = Header(default=None, alias="X-Employee-Id"),
    db: Session = Depends(get_db),
) -> Employee:
    if not x_employee_id:
        raise HTTPException(status_code=401, detail="Missing X-Employee-Id header - please sign in.")

    employee = db.get(Employee, x_employee_id)
    if employee is None:
        raise HTTPException(status_code=401, detail="Unknown employee_id - please sign in again.")
    if employee.employment_status != "active":
        raise HTTPException(status_code=403, detail="This account is no longer active.")
    return employee