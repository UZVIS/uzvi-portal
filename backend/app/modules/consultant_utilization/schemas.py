"""
M1 - Consultant Utilization Tracker
backend/app/modules/consultant_utilization/schemas.py
"""
from datetime import date
from typing import Optional, List, Dict

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    project_id: str
    name: str
    project_type: str  # real project | Bench | Training | Internal | BD/Presales | Leave
    billing_rate: Optional[float] = None
    cost_rate: Optional[float] = None


class ProjectRead(ProjectCreate):
    model_config = {"from_attributes": True}


class TimeEntryCreate(BaseModel):
    entry_id: str
    employee_id: str
    project_id: str
    date: date
    hours: float = Field(gt=0,le=24)
    billable_flag: bool = False
    source: str = "manual"  # manual | import


class TimeEntryRead(TimeEntryCreate):
    model_config = {"from_attributes": True}


class UtilizationSummary(BaseModel):
    employee_id: str
    period_start: date
    period_end: date
    billable_hours: float
    available_hours: float
    utilization_pct: float
    flag: Optional[str] = None  # "under_utilized" | "over_allocated" | None


class ProjectMargin(BaseModel):
    project_id: str
    project_name: str
    revenue: float
    cost: float
    margin: float
    margin_pct: Optional[float] = None


class OrgUtilizationDashboard(BaseModel):
    period_start: date
    period_end: date
    utilization_by_employee: List[UtilizationSummary]
    bench_risk: List[str]        # employee_ids under 60%
    over_allocated: List[str]    # employee_ids over 105%
    project_margins: List[ProjectMargin]


class PersonalUtilizationDashboard(BaseModel):
    summary: UtilizationSummary
    hours_by_project: Dict[str, float]
    weekly_trend: Dict[str, float]  # "YYYY-Www" -> hours
