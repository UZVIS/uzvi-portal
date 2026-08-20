from typing import Optional
 
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
 
from app.database import get_db
from app.modules.directory.models import Employee
 
# The rest of the app's access-tier values (see directory/employees):
# "Admin/Leadership", "Manager", "HR-Restricted", "Employee". This module
# used to check for a bare "Admin" tier that doesn't actually exist in the
# data, so every real admin (tier "Admin/Leadership") was being rejected.
ADMIN_TIER = "Admin/Leadership"
 
 
def get_current_user(
    x_employee_id: Optional[str] = Header(None, alias="X-Employee-Id"),
    db: Session = Depends(get_db),
) -> Employee:
    """Simplified auth for V1 - replace with JWT in production.
 
    Identifies the caller from the X-Employee-Id header set by the
    frontend's logged-in session, same as every other module. This used to
    default to a hardcoded "EMP001", which meant every request in this
    module was evaluated as EMP001 regardless of who was actually signed
    in, and requests from any other employee_id were silently ignored.
    """
    if not x_employee_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")
 
    user = db.query(Employee).filter(Employee.employee_id == x_employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.employment_status != "active":
        raise HTTPException(status_code=403, detail="User account is not active")
    return user
 
 
def require_admin(current_user: Employee = Depends(get_current_user)):
    if current_user.access_tier != ADMIN_TIER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
 
 
def require_manager(current_user: Employee = Depends(get_current_user)):
    if current_user.access_tier not in [ADMIN_TIER, "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager access required"
        )
    return current_user
 
 
def require_hr(current_user: Employee = Depends(get_current_user)):
    if current_user.access_tier not in [ADMIN_TIER, "HR-Restricted"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR access required"
        )
    return current_user
 
 
def require_self_or_manager(
    employee_id: str,
    current_user: Employee = Depends(get_current_user)
):
    if current_user.access_tier == ADMIN_TIER:
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