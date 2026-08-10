
# from datetime import date
# from typing import List, Optional

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session

# from app.database import get_db
# from app.modules.consultant_utilization import schemas, service

# router = APIRouter(prefix="/utilization", tags=["consultant-utilization"])


# # --- Projects ---

# @router.post("/projects", response_model=schemas.ProjectRead)
# def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db)):
#     return service.create_project(db, data)


# @router.get("/projects", response_model=List[schemas.ProjectRead])
# def list_projects(db: Session = Depends(get_db)):
#     return service.list_projects(db)


# # --- Time entries ---

# @router.post("/time-entries", response_model=schemas.TimeEntryRead)
# def create_time_entry(data: schemas.TimeEntryCreate, db: Session = Depends(get_db)):
#     try:
#         return service.create_time_entry(db, data)
#     except service.NotFoundError as exc:
#         raise HTTPException(status_code=422, detail=str(exc))


# @router.get("/time-entries", response_model=List[schemas.TimeEntryRead])
# def list_time_entries(
#     employee_id: Optional[str] = None,
#     start_date: Optional[date] = None,
#     end_date: Optional[date] = None,
#     db: Session = Depends(get_db),
# ):
#     return service.list_time_entries(db, employee_id, start_date, end_date)


# # --- Dashboards ---

# @router.get("/dashboard/employee/{employee_id}", response_model=schemas.PersonalUtilizationDashboard)
# def personal_dashboard(
#     employee_id: str,
#     start_date: date,
#     end_date: date,
#     capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
#     db: Session = Depends(get_db),
# ):
#     """FR-UTL-06. Restrict to the employee themselves + their manager/Admin (NFR-SEC-02) once auth exists."""
#     return service.compute_personal_dashboard(db, employee_id, start_date, end_date, capacity_hours_per_week)


# @router.get("/dashboard/org", response_model=schemas.OrgUtilizationDashboard)
# def org_dashboard(
#     start_date: date,
#     end_date: date,
#     capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
#     db: Session = Depends(get_db),
# ):
#     """FR-UTL-05. Restrict to Admin/Leadership tier (NFR-SEC-01) once auth exists."""
#     return service.compute_org_utilization(db, start_date, end_date, capacity_hours_per_week)


# @router.get("/projects/{project_id}/margin", response_model=schemas.ProjectMargin)
# def project_margin(project_id: str, db: Session = Depends(get_db)):
#     try:
#         return service.compute_project_margin(db, project_id)
#     except service.NotFoundError as exc:
#         raise HTTPException(status_code=404, detail=str(exc))

# from datetime import date
# from typing import List, Optional

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session

# from app.database import get_db
# from app.modules.consultant_utilization import schemas, service
# from app.modules.consultant_utilization.dependencies import get_current_employee, require_admin
# from app.modules.directory.models import Employee

# router = APIRouter(prefix="/utilization", tags=["consultant-utilization"])


# # --- Projects ---

# @router.post("/projects", response_model=schemas.ProjectRead)
# def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db)):
#     return service.create_project(db, data)


# @router.get("/projects", response_model=List[schemas.ProjectRead])
# def list_projects(db: Session = Depends(get_db)):
#     return service.list_projects(db)


# # --- Time entries ---

# @router.post("/time-entries", response_model=schemas.TimeEntryRead)
# def create_time_entry(
#     data: schemas.TimeEntryCreate,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(get_current_employee),
# ):
 
#     if current_employee.access_tier != "Admin/Leadership":
#         data.employee_id = current_employee.employee_id
#     try:
#         return service.create_time_entry(db, data)
#     except service.NotFoundError as exc:
#         raise HTTPException(status_code=422, detail=str(exc))
#     except service.FutureDateError as exc:
#         raise HTTPException(status_code=422, detail=str(exc))
#     except service.DailyHoursExceededError as exc:
#         raise HTTPException(status_code=422, detail=str(exc))
#     except service.OvertimeConfirmationRequired as exc:
#         raise HTTPException(
#             status_code=409,
#             detail={
#                 "message": str(exc),
#                 "remaining_normal_hours": exc.remaining_normal_hours,
#                 "requested_hours": exc.requested_hours,
#             },
#         )


# @router.get("/time-entries", response_model=List[schemas.TimeEntryRead])
# def list_time_entries(
#     employee_id: Optional[str] = None,
#     start_date: Optional[date] = None,
#     end_date: Optional[date] = None,
#     db: Session = Depends(get_db),
# ):
#     return service.list_time_entries(db, employee_id, start_date, end_date)


# # --- Dashboards ---

# @router.get("/dashboard/employee/{employee_id}", response_model=schemas.PersonalUtilizationDashboard)
# def personal_dashboard(
#     employee_id: str,
#     start_date: date,
#     end_date: date,
#     capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(get_current_employee),
# ):
#     """FR-UTL-06 / NFR-SEC-02: only the employee themselves, or an
#     Admin/Leadership account, may view a personal utilization dashboard."""
#     if employee_id != current_employee.employee_id and current_employee.access_tier != "Admin/Leadership":
#         raise HTTPException(
#             status_code=403,
#             detail="You can only view your own utilization dashboard.",
#         )
#     return service.compute_personal_dashboard(db, employee_id, start_date, end_date, capacity_hours_per_week)


# @router.get("/dashboard/org", response_model=schemas.OrgUtilizationDashboard)
# def org_dashboard(
#     start_date: date,
#     end_date: date,
#     capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_admin),
# ):
#     """FR-UTL-05: org-wide utilization view is Admin/Leadership only."""
#     return service.compute_org_utilization(db, start_date, end_date, capacity_hours_per_week)


# @router.get("/projects/{project_id}/margin", response_model=schemas.ProjectMargin)
# def project_margin(
#     project_id: str,
#     db: Session = Depends(get_db),
#     current_employee: Employee = Depends(require_admin),
# ):
    
#     try:
#         return service.compute_project_margin(db, project_id)
#     except service.NotFoundError as exc:
#         raise HTTPException(status_code=404, detail=str(exc))

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.consultant_utilization import schemas, service
from app.modules.consultant_utilization.dependencies import get_current_employee, require_admin, require_ot_approver
from app.modules.directory.models import Employee

router = APIRouter(prefix="/utilization", tags=["consultant-utilization"])


# --- Projects ---

@router.post("/projects", response_model=schemas.ProjectRead)
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db)):
    return service.create_project(db, data)


@router.get("/projects", response_model=List[schemas.ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    return service.list_projects(db)


# --- Time entries ---

@router.post("/time-entries", response_model=schemas.TimeEntryRead)
def create_time_entry(
    data: schemas.TimeEntryCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    # NFR-SEC-02: a time entry is attributed to whoever is actually signed
    # in - UNLESS that signed-in account is Admin/Leadership, which has a
    # legitimate "log hours on behalf of an employee" feature (Org
    # Dashboard). Any other tier can never claim to be someone else.
    if current_employee.access_tier != "Admin/Leadership":
        data.employee_id = current_employee.employee_id
    try:
        return service.create_time_entry(db, data)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except service.FutureDateError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except service.DailyHoursExceededError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/time-entries", response_model=List[schemas.TimeEntryRead])
def list_time_entries(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    return service.list_time_entries(db, employee_id, start_date, end_date)


# --- Overtime approvals ---

@router.get("/time-entries/pending-ot", response_model=List[schemas.TimeEntryRead])
def list_pending_ot(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_ot_approver),
):
    """Admin/HR approval queue for pending overtime."""
    return service.list_pending_ot_entries(db)


@router.post("/time-entries/{entry_id}/approve-ot", response_model=schemas.TimeEntryRead)
def approve_ot(
    entry_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_ot_approver),
):
    try:
        return service.approve_ot(db, entry_id, current_employee.access_tier)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.InvalidOTTransitionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.post("/time-entries/{entry_id}/reject-ot", response_model=schemas.TimeEntryRead)
def reject_ot(
    entry_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_ot_approver),
):
    try:
        return service.reject_ot(db, entry_id, current_employee.access_tier)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except service.InvalidOTTransitionError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


# --- Dashboards ---

@router.get("/dashboard/employee/{employee_id}", response_model=schemas.PersonalUtilizationDashboard)
def personal_dashboard(
    employee_id: str,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    """FR-UTL-06 / NFR-SEC-02: only the employee themselves, or an
    Admin/Leadership account, may view a personal utilization dashboard."""
    if employee_id != current_employee.employee_id and current_employee.access_tier != "Admin/Leadership":
        raise HTTPException(
            status_code=403,
            detail="You can only view your own utilization dashboard.",
        )
    return service.compute_personal_dashboard(db, employee_id, start_date, end_date, capacity_hours_per_week)


@router.get("/dashboard/org", response_model=schemas.OrgUtilizationDashboard)
def org_dashboard(
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_admin),
):
    """FR-UTL-05: org-wide utilization view is Admin/Leadership only."""
    return service.compute_org_utilization(db, start_date, end_date, capacity_hours_per_week)


@router.get("/projects/{project_id}/margin", response_model=schemas.ProjectMargin)
def project_margin(
    project_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_admin),
):
    """FR-UTL-05: project margin is Admin/Leadership only (revenue/cost data)."""
    try:
        return service.compute_project_margin(db, project_id)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))