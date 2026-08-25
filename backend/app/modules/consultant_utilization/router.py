from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.consultant_utilization import schemas, service
from app.modules.consultant_utilization.dependencies import (
    get_current_employee,
    require_admin,
    require_ot_approver,
)
from app.modules.directory.models import Employee


router = APIRouter(
    prefix="/utilization",
    tags=["consultant-utilization"],
)


# =========================================================
# PROJECTS
# =========================================================

@router.post(
    "/projects",
    response_model=schemas.ProjectRead,
)
def create_project(
    data: schemas.ProjectCreate,
    db: Session = Depends(get_db),
):
    return service.create_project(
        db,
        data,
    )


@router.get(
    "/projects",
    response_model=List[schemas.ProjectRead],
)
def list_projects(
    db: Session = Depends(get_db),
):
    return service.list_projects(
        db,
    )


# =========================================================
# TIME ENTRIES
# =========================================================

@router.post(
    "/time-entries",
    response_model=schemas.TimeEntryRead,
)
def create_time_entry(
    data: schemas.TimeEntryCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    target_employee = db.get(
        Employee,
        data.employee_id,
    )

    if target_employee is None:
        raise HTTPException(
            status_code=404,
            detail=f"Employee {data.employee_id} not found.",
        )

    if not service.can_log_hours_for(
        current_employee,
        target_employee,
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                f"{current_employee.employee_id} cannot log hours "
                f"for {target_employee.employee_id}. "
                "You can only log hours for yourself or your direct reports."
            ),
        )

    try:
        return service.create_time_entry(
            db,
            data,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.FutureDateError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.WeekendDateError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.OnLeaveError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.DailyHoursExceededError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


# =========================================================
# EMPLOYEES AVAILABLE FOR TIME ENTRY
# =========================================================

@router.get(
    "/time-entry-employees",
    response_model=List[schemas.EmployeeRead],
)
def list_time_entry_employees(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    return service.list_time_entry_employees(
        db,
        current_employee,
    )


# =========================================================
# TIME ENTRY LIST
# =========================================================

@router.get(
    "/time-entries",
    response_model=List[schemas.TimeEntryRead],
)
def list_time_entries(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    return service.list_time_entries(
        db,
        employee_id,
        start_date,
        end_date,
    )


# =========================================================
# OT APPROVALS
# =========================================================

@router.get(
    "/time-entries/pending-ot",
    response_model=List[schemas.TimeEntryRead],
)
def list_pending_ot(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_ot_approver),
):
    return service.list_pending_ot_entries(
        db,
        current_employee,
    )


@router.post(
    "/time-entries/{entry_id}/approve-ot",
    response_model=schemas.TimeEntryRead,
)
def approve_ot(
    entry_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_ot_approver),
):
    try:
        return service.approve_ot(
            db,
            entry_id,
            current_employee,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except service.InvalidOTTransitionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.NotYourReportError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )


@router.post(
    "/time-entries/{entry_id}/reject-ot",
    response_model=schemas.TimeEntryRead,
)
def reject_ot(
    entry_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_ot_approver),
):
    try:
        return service.reject_ot(
            db,
            entry_id,
            current_employee,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except service.InvalidOTTransitionError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )

    except service.NotYourReportError as exc:
        raise HTTPException(
            status_code=403,
            detail=str(exc),
        )


# =========================================================
# PERSONAL / EMPLOYEE UTILIZATION DASHBOARD
# =========================================================

@router.get(
    "/dashboard/employee/{employee_id}",
    response_model=schemas.PersonalUtilizationDashboard,
)
def personal_dashboard(
    employee_id: str,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    """
    Access rules:

    1. Employee:
       Can view only their own utilization.

    2. Manager:
       Can view utilization of their direct-report employees.

    3. Admin/Leadership:
       Can view utilization of every employee.
    """

    # -----------------------------------------------------
    # CASE 1:
    # User is viewing their own utilization
    # -----------------------------------------------------
    if employee_id == current_employee.employee_id:
        return service.compute_personal_dashboard(
            db,
            employee_id,
            start_date,
            end_date,
            capacity_hours_per_week,
        )

    # -----------------------------------------------------
    # CASE 2:
    # Admin/Leadership can view ANY employee
    # -----------------------------------------------------
    if current_employee.access_tier == "Admin/Leadership":
        target_employee = (
            db.query(Employee)
            .filter(
                Employee.employee_id == employee_id
            )
            .first()
        )

        if target_employee is None:
            raise HTTPException(
                status_code=404,
                detail=f"Employee {employee_id} not found.",
            )

        return service.compute_personal_dashboard(
            db,
            employee_id,
            start_date,
            end_date,
            capacity_hours_per_week,
        )

    # -----------------------------------------------------
    # CASE 3:
    # Manager can view ONLY direct reports
    # -----------------------------------------------------
    if current_employee.access_tier == "Manager":

        target_employee = (
            db.query(Employee)
            .filter(
                Employee.employee_id == employee_id
            )
            .first()
        )

        if target_employee is None:
            raise HTTPException(
                status_code=404,
                detail=f"Employee {employee_id} not found.",
            )

        # Employee must directly report to this manager
        if target_employee.manager_id != current_employee.employee_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Managers can only view utilization "
                    "of their direct reports."
                ),
            )

        return service.compute_personal_dashboard(
            db,
            employee_id,
            start_date,
            end_date,
            capacity_hours_per_week,
        )

    # -----------------------------------------------------
    # CASE 4:
    # Other access tiers are not allowed
    # -----------------------------------------------------
    raise HTTPException(
        status_code=403,
        detail=(
            "You are not allowed to view "
            "this employee's utilization."
        ),
    )


# =========================================================
# ORGANIZATION DASHBOARD
# =========================================================

@router.get(
    "/dashboard/org",
    response_model=schemas.OrgUtilizationDashboard,
)
def org_dashboard(
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_admin),
):
    """
    Admin-only organization dashboard.

    Admin/Leadership can see organization-wide utilization,
    bench-risk employees, over-allocated employees,
    and project margins.
    """

    return service.compute_org_utilization(
        db,
        start_date,
        end_date,
        capacity_hours_per_week,
    )


# =========================================================
# PROJECT MARGIN
# =========================================================

@router.get(
    "/projects/{project_id}/margin",
    response_model=schemas.ProjectMargin,
)
def project_margin(
    project_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_admin),
):
    try:
        return service.compute_project_margin(
            db,
            project_id,
        )

    except service.NotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )