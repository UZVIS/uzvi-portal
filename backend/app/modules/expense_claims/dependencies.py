
# from fastapi import Depends, Header, HTTPException
# from sqlalchemy.orm import Session

# from app.database import get_db
# from app.modules.directory.models import Employee

# APPROVER_TIERS = {"Manager", "Admin/Leadership", "HR-Restricted"}


# def get_current_employee(
#     x_employee_id: str | None = Header(default=None, alias="X-Employee-Id"),
#     db: Session = Depends(get_db),
# ) -> Employee:
#     if not x_employee_id:
#         raise HTTPException(status_code=401, detail="Missing X-Employee-Id header - please sign in.")

#     employee = db.get(Employee, x_employee_id)
#     if employee is None:
#         raise HTTPException(status_code=401, detail="Unknown employee_id - please sign in again.")
#     if employee.employment_status != "active":
#         raise HTTPException(status_code=403, detail="This account is no longer active.")
#     return employee


# def require_approver(current_employee: Employee = Depends(get_current_employee)) -> Employee:
#     if current_employee.access_tier not in APPROVER_TIERS:
#         raise HTTPException(
#             status_code=403,
#             detail=f"{current_employee.access_tier} accounts cannot approve or reject expense claims.",
#         )
#     return current_employee


from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee


APPROVER_TIERS = {
    "Manager",
    "Admin/Leadership",
    "HR-Restricted",
}


def get_current_employee(
    x_employee_id: str | None = Header(
        default=None,
        alias="X-Employee-Id",
    ),
    db: Session = Depends(get_db),
) -> Employee:

    if not x_employee_id:
        raise HTTPException(
            status_code=401,
            detail=(
                "Missing X-Employee-Id header - "
                "please sign in."
            ),
        )

    employee = db.get(
        Employee,
        x_employee_id,
    )

    if employee is None:
        raise HTTPException(
            status_code=401,
            detail=(
                "Unknown employee_id - "
                "please sign in again."
            ),
        )

    if employee.employment_status != "active":
        raise HTTPException(
            status_code=403,
            detail=(
                "This account is no longer active."
            ),
        )

    return employee


def require_approver(
    current_employee: Employee = Depends(
        get_current_employee
    ),
) -> Employee:

    if current_employee.access_tier not in APPROVER_TIERS:
        raise HTTPException(
            status_code=403,
            detail=(
                f"{current_employee.access_tier} accounts "
                f"cannot approve or reject expense claims."
            ),
        )

    return current_employee