from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee

# Per FRD Section 3 / FR-LMS-01: only Admin defines training programs and units.
ADMIN_TIERS = {"Admin/Leadership"}

# Per FR-LMS-05: cohort-wide progress is a Manager/trainer/Admin view.
COHORT_VIEW_TIERS = {"Manager", "Admin/Leadership", "HR-Restricted"}


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


def require_admin(current_employee: Employee = Depends(get_current_employee)) -> Employee:
    if current_employee.access_tier not in ADMIN_TIERS:
        raise HTTPException(
            status_code=403,
            detail=f"{current_employee.access_tier} accounts cannot manage training programs.",
        )
    return current_employee


def require_cohort_viewer(current_employee: Employee = Depends(get_current_employee)) -> Employee:
    if current_employee.access_tier not in COHORT_VIEW_TIERS:
        raise HTTPException(
            status_code=403,
            detail=f"{current_employee.access_tier} accounts cannot view cohort-wide progress.",
        )
    return current_employee