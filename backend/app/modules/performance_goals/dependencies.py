from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee


def get_current_user(db: Session = Depends(get_db), employee_id: str = "EMP001") -> Employee:
    """Simplified auth for V1 - replace with JWT in production"""
    user = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.employment_status != "active":
        raise HTTPException(status_code=403, detail="User account is not active")
    return user


def require_admin(current_user: Employee = Depends(get_current_user)):
    if current_user.access_tier != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_manager(current_user: Employee = Depends(get_current_user)):
    if current_user.access_tier not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )
    return current_user


def require_hr(current_user: Employee = Depends(get_current_user)):
    if current_user.access_tier not in ["Admin", "HR-Restricted"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required"
        )
    return current_user


def require_self_or_manager(
    employee_id: str,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.access_tier == "Admin":
        return current_user
    
    if current_user.employee_id == employee_id:
        return current_user
    
    # Check if current user is the manager of the target employee
    if hasattr(current_user, 'manager_id') and current_user.manager_id == employee_id:
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cannot access other employee's data"
    )