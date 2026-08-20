from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
 
from app.database import get_db
from app.modules.directory.models import Employee


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Employee:
    """
    Simplified authentication for V1/local testing.

    The frontend can send the logged-in employee ID as:
        ?employee_id=ADMIN1
        ?employee_id=MGR001
        ?employee_id=EMP001

    If no employee_id is supplied, ADMIN1 is used as the
    default local Admin user.

    This should be replaced with proper JWT/session-based
    authentication in production.
    """

    employee_id = request.query_params.get(
        "employee_id",
        "ADMIN1"
    )

    user = (
        db.query(Employee)
        .filter(Employee.employee_id == employee_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.employment_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active"
        )

    return user


def require_admin(
    current_user: Employee = Depends(get_current_user)
):
    if current_user.access_tier not in [
        "Admin",
        "Admin/Leadership"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user


def require_manager(
    current_user: Employee = Depends(get_current_user)
):
    if current_user.access_tier not in [
        "Admin",
        "Admin/Leadership",
        "Manager"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )

    return current_user


def require_hr(
    current_user: Employee = Depends(get_current_user)
):
    if current_user.access_tier not in [
        "Admin",
        "Admin/Leadership",
        "HR-Restricted"
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required"
        )

    return current_user
 
 
def require_self_or_manager(
    employee_id: str,
    current_user: Employee = Depends(get_current_user)
):
    # Admin-level users can access employee data
    if current_user.access_tier in [
        "Admin",
        "Admin/Leadership"
    ]:
        return current_user

    # Employee can access their own data
    if current_user.employee_id == employee_id:
        return current_user

    # Manager can access their own reports
    if (
        current_user.access_tier == "Manager"
        and current_user.employee_id == employee_id
    ):
        return current_user

    # Check if current user is the manager of the target employee
    if (
        current_user.access_tier == "Manager"
        and current_user.manager_id == employee_id
    ):
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cannot access other employee's data"
    )