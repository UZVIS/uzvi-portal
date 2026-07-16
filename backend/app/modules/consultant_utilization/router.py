
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.consultant_utilization import schemas, service

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
def create_time_entry(data: schemas.TimeEntryCreate, db: Session = Depends(get_db)):
    try:
        return service.create_time_entry(db, data)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@router.get("/time-entries", response_model=List[schemas.TimeEntryRead])
def list_time_entries(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    return service.list_time_entries(db, employee_id, start_date, end_date)


# --- Dashboards ---

@router.get("/dashboard/employee/{employee_id}", response_model=schemas.PersonalUtilizationDashboard)
def personal_dashboard(
    employee_id: str,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
    db: Session = Depends(get_db),
):
    """FR-UTL-06. Restrict to the employee themselves + their manager/Admin (NFR-SEC-02) once auth exists."""
    return service.compute_personal_dashboard(db, employee_id, start_date, end_date, capacity_hours_per_week)


@router.get("/dashboard/org", response_model=schemas.OrgUtilizationDashboard)
def org_dashboard(
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = service.DEFAULT_CAPACITY_HOURS_PER_WEEK,
    db: Session = Depends(get_db),
):
    """FR-UTL-05. Restrict to Admin/Leadership tier (NFR-SEC-01) once auth exists."""
    return service.compute_org_utilization(db, start_date, end_date, capacity_hours_per_week)


@router.get("/projects/{project_id}/margin", response_model=schemas.ProjectMargin)
def project_margin(project_id: str, db: Session = Depends(get_db)):
    try:
        return service.compute_project_margin(db, project_id)
    except service.NotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
