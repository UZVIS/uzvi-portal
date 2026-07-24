"""
M1 - Consultant Utilization Tracker
backend/app/modules/consultant_utilization/service.py

Business logic layer, per the layering convention in the dev quickstart:
Python business logic -> storage layer -> FastAPI routes -> React frontend.
"""
from datetime import date
from typing import List, Optional
from collections import defaultdict

from sqlalchemy.orm import Session

from app.modules.consultant_utilization import models, schemas

DEFAULT_CAPACITY_HOURS_PER_WEEK = 40.0
UNDER_UTILIZED_THRESHOLD = 0.60   # FR-UTL-03
OVER_ALLOCATED_THRESHOLD = 1.05  # FR-UTL-03


class NotFoundError(Exception):
    pass


# --- Projects ---

def create_project(db: Session, data: schemas.ProjectCreate) -> models.Project:
    project = models.Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session) -> List[models.Project]:
    return db.query(models.Project).all()


def get_project(db: Session, project_id: str) -> models.Project:
    project = db.get(models.Project, project_id)
    if project is None:
        raise NotFoundError(f"Project {project_id} not found")
    return project


# --- Time entries ---

def create_time_entry(db: Session, data: schemas.TimeEntryCreate) -> models.TimeEntry:
    # FR-UTL-01: confirm the project exists before logging hours against it.
    get_project(db, data.project_id)
    entry = models.TimeEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def list_time_entries(
    db: Session,
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[models.TimeEntry]:
    query = db.query(models.TimeEntry)
    if employee_id:
        query = query.filter(models.TimeEntry.employee_id == employee_id)
    if start_date:
        query = query.filter(models.TimeEntry.date >= start_date)
    if end_date:
        query = query.filter(models.TimeEntry.date <= end_date)
    return query.all()


def _weeks_in_period(start_date: date, end_date: date) -> float:
    days = (end_date - start_date).days
    return max(days / 7.0, 1 / 7.0)


# --- Utilization (FR-UTL-02, FR-UTL-03) ---

def compute_utilization(
    db: Session,
    employee_id: str,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = DEFAULT_CAPACITY_HOURS_PER_WEEK,
) -> schemas.UtilizationSummary:
    entries = list_time_entries(db, employee_id=employee_id, start_date=start_date, end_date=end_date)
    billable_hours = sum(e.hours for e in entries if e.billable_flag)
    available_hours = capacity_hours_per_week * _weeks_in_period(start_date, end_date)
    utilization_pct = (billable_hours / available_hours) if available_hours else 0.0

    flag = None
    if utilization_pct < UNDER_UTILIZED_THRESHOLD:
        flag = "under_utilized"
    elif utilization_pct > OVER_ALLOCATED_THRESHOLD:
        flag = "over_allocated"

    return schemas.UtilizationSummary(
        employee_id=employee_id,
        period_start=start_date,
        period_end=end_date,
        billable_hours=billable_hours,
        available_hours=available_hours,
        utilization_pct=round(utilization_pct, 4),
        flag=flag,
    )


def compute_org_utilization(
    db: Session,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = DEFAULT_CAPACITY_HOURS_PER_WEEK,
) -> schemas.OrgUtilizationDashboard:
    """FR-UTL-05: org-wide utilization, bench-risk list, over-allocation list, project margins."""
    entries = list_time_entries(db, start_date=start_date, end_date=end_date)
    employee_ids = sorted({e.employee_id for e in entries})

    summaries = [
        compute_utilization(db, emp_id, start_date, end_date, capacity_hours_per_week)
        for emp_id in employee_ids
    ]
    bench_risk = [s.employee_id for s in summaries if s.flag == "under_utilized"]
    over_allocated = [s.employee_id for s in summaries if s.flag == "over_allocated"]
    margins = compute_all_project_margins(db)

    return schemas.OrgUtilizationDashboard(
        period_start=start_date,
        period_end=end_date,
        utilization_by_employee=summaries,
        bench_risk=bench_risk,
        over_allocated=over_allocated,
        project_margins=margins,
    )


def compute_personal_dashboard(
    db: Session,
    employee_id: str,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = DEFAULT_CAPACITY_HOURS_PER_WEEK,
) -> schemas.PersonalUtilizationDashboard:
    """FR-UTL-06: own utilization %, hours-by-project breakdown, weekly trend."""
    summary = compute_utilization(db, employee_id, start_date, end_date, capacity_hours_per_week)
    entries = list_time_entries(db, employee_id=employee_id, start_date=start_date, end_date=end_date)

    hours_by_project: dict = defaultdict(float)
    weekly_trend: dict = defaultdict(float)
    for e in entries:
        hours_by_project[e.project_id] += e.hours
        iso_year, iso_week, _ = e.date.isocalendar()
        weekly_trend[f"{iso_year}-W{iso_week:02d}"] += e.hours

    return schemas.PersonalUtilizationDashboard(
        summary=summary,
        hours_by_project=dict(hours_by_project),
        weekly_trend=dict(weekly_trend),
    )


# --- Margins (FR-UTL-04) ---

def compute_project_margin(db: Session, project_id: str) -> schemas.ProjectMargin:
    project = get_project(db, project_id)
    entries = db.query(models.TimeEntry).filter(models.TimeEntry.project_id == project_id).all()

    billing_rate = project.billing_rate or 0.0
    cost_rate = project.cost_rate or 0.0

    revenue = sum(e.hours * billing_rate for e in entries if e.billable_flag)
    cost = sum(e.hours * cost_rate for e in entries)
    margin = revenue - cost
    margin_pct = (margin / revenue) if revenue else None

    return schemas.ProjectMargin(
        project_id=project.project_id,
        project_name=project.name,
        revenue=round(revenue, 2),
        cost=round(cost, 2),
        margin=round(margin, 2),
        margin_pct=round(margin_pct, 4) if margin_pct is not None else None,
    )


def compute_all_project_margins(db: Session) -> List[schemas.ProjectMargin]:
    projects = list_projects(db)
    return [compute_project_margin(db, p.project_id) for p in projects]
