from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee

# Recruiting is restricted to Admin/Leadership and HR-Restricted only —
# these are the two tiers from the FRD's official RBAC model (Section 3 /
# NFR-SEC-01) that are allowed into this module. Everyone else (Manager,
# Employee) is blocked, even if logged in.
RECRUITING_ALLOWED_TIERS = ("Admin/Leadership", "HR-Restricted")


def _is_recruiting_authorized(access_tier: str) -> bool:
    tier = (access_tier or "").strip().lower()
    # Seed/legacy data uses both "Admin" and "Admin/Leadership" for the same
    # tier, so match on prefix rather than requiring an exact string.
    return tier.startswith("admin") or tier == "hr-restricted"


def get_current_user(
    x_employee_id: Optional[str] = Header(None, alias="X-Employee-Id"),
    db: Session = Depends(get_db),
) -> Employee:
    """Simplified auth for V1 — identifies the caller from the X-Employee-Id
    header set by the frontend's logged-in session. Replace with real
    JWT/session auth in production."""
    if not x_employee_id:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    user = db.query(Employee).filter(Employee.employee_id == x_employee_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user.")
    if user.employment_status != "active":
        raise HTTPException(status_code=403, detail="User account is not active.")
    return user


def require_recruiting_access(current_user: Employee = Depends(get_current_user)) -> Employee:
    if not _is_recruiting_authorized(current_user.access_tier):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin/Leadership or HR-Restricted access required for the Recruiting module.",
        )
    return current_user