from datetime import date, datetime, timezone
from typing import List, Optional
from collections import defaultdict

from sqlalchemy.orm import Session

from app.modules.consultant_utilization import models, schemas
from app.modules.directory.models import Employee
from app.modules.leave.models import LeaveApplication, LeaveStatus

DEFAULT_CAPACITY_HOURS_PER_WEEK = 40.0
UNDER_UTILIZED_THRESHOLD = 0.60   # FR-UTL-03
OVER_ALLOCATED_THRESHOLD = 1.05  # FR-UTL-03
NORMAL_HOURS_PER_DAY = 8.0
MAX_HOURS_PER_DAY = 16.0  # 8 normal + 8 overtime

MANAGER_SCOPED_TIER = "Manager"
OT_APPROVER_TIERS = {"Admin/Leadership", "HR-Restricted", "Manager"}


class NotFoundError(Exception):
    pass


class FutureDateError(Exception):
    pass


class WeekendDateError(Exception):
    pass


class OnLeaveError(Exception):
    pass


class DailyHoursExceededError(Exception):
    pass


class InvalidOTTransitionError(Exception):
    pass


class NotYourReportError(Exception):

    pass




def create_project(
    db: Session,
    data: schemas.ProjectCreate,
) -> models.Project:
    project = models.Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(
    db: Session,
) -> List[models.Project]:
    return db.query(models.Project).all()


def get_project(
    db: Session,
    project_id: str,
) -> models.Project:
    project = db.get(
        models.Project,
        project_id,
    )

    if project is None:
        raise NotFoundError(
            f"Project {project_id} not found"
        )

    return project

def can_log_hours_for(
    current_employee: Employee,
    target_employee: Employee,
) -> bool:

    if current_employee.employee_id == target_employee.employee_id:
        return True

    # Company decision: only Admin/Leadership may log hours on behalf
    # of another employee. Manager and HR-Restricted can each SEE
    # their own direct reports (list_time_entry_employees), but
    # logging hours for someone else is Admin-only.
    if current_employee.access_tier == "Admin/Leadership":
        return True

    return False

def list_time_entry_employees(
    db: Session,
    current_employee: Employee,
) -> List[Employee]:

    # =====================================================
    # ADMIN / LEADERSHIP
    # =====================================================
    # Admin can log hours for EVERY employee in the directory.
    if current_employee.access_tier == "Admin/Leadership":
        return (
            db.query(Employee)
            .order_by(Employee.employee_id)
            .all()
        )

    # =====================================================
    # MANAGER
    # =====================================================
    # Manager should NOT use the admin log-hours form.
    # If this endpoint is called, only return the manager
    # and direct reports as a safe fallback.
    if current_employee.access_tier == "Manager":
        direct_reports = (
            db.query(Employee)
            .filter(
                Employee.manager_id == current_employee.employee_id
            )
            .order_by(Employee.employee_id)
            .all()
        )

        return [current_employee] + direct_reports

    # =====================================================
    # HR-RESTRICTED
    # =====================================================
    if current_employee.access_tier == "HR-Restricted":
        direct_reports = (
            db.query(Employee)
            .filter(
                Employee.manager_id == current_employee.employee_id
            )
            .order_by(Employee.employee_id)
            .all()
        )

        return [current_employee] + direct_reports

    # =====================================================
    # NORMAL EMPLOYEE
    # =====================================================
    return [current_employee]



def _is_employee_on_approved_leave(
    db: Session,
    employee_id: str,
    entry_date: date,
) -> bool:
    approved_leave = (
        db.query(LeaveApplication)
        .filter(
            LeaveApplication.employee_id == employee_id,
            LeaveApplication.status == LeaveStatus.APPROVED,
            LeaveApplication.start_date <= entry_date,
            LeaveApplication.end_date >= entry_date,
        )
        .first()
    )

    return approved_leave is not None


# --- Time entries ---

def create_time_entry(
    db: Session,
    data: schemas.TimeEntryCreate,
) -> models.TimeEntry:

    get_project(
        db,
        data.project_id,
    )

    employee = db.get(
        Employee,
        data.employee_id,
    )

    if employee is None:
        raise NotFoundError(
            f"Employee {data.employee_id} not found."
        )

    if data.date > date.today():
        raise FutureDateError(
            f"Cannot log hours for {data.date} - it's in the future. "
            "Log hours for today or an earlier date."
        )

    if data.date.weekday() >= 5:
        raise WeekendDateError(
            f"{data.date} is a weekend. "
            "Hours can only be logged on weekdays (Monday-Friday)."
        )

    if _is_employee_on_approved_leave(
        db,
        data.employee_id,
        data.date,
    ):
        raise OnLeaveError(
            f"You're on approved leave on {data.date}. "
            "Log hours against the 'Leave' project instead, "
            "or pick a different date."
        )

    same_day_entries = (
        db.query(models.TimeEntry)
        .filter(
            models.TimeEntry.employee_id == data.employee_id,
            models.TimeEntry.date == data.date,
        )
        .all()
    )

    hours_already_logged = sum(
        e.hours for e in same_day_entries
    )

    normal_already_logged = sum(
        e.normal_hours for e in same_day_entries
    )

    if hours_already_logged + data.hours > MAX_HOURS_PER_DAY:
        raise DailyHoursExceededError(
            f"You've already logged {hours_already_logged}h on {data.date}. "
            f"Adding {data.hours}h would bring the day's total to "
            f"{hours_already_logged + data.hours}h, which exceeds the "
            f"{MAX_HOURS_PER_DAY:g}h daily maximum "
            f"({NORMAL_HOURS_PER_DAY:g}h normal + "
            f"{MAX_HOURS_PER_DAY - NORMAL_HOURS_PER_DAY:g}h overtime)."
        )

    remaining_normal = max(
        0.0,
        NORMAL_HOURS_PER_DAY - normal_already_logged,
    )


    if data.hours <= remaining_normal:
        normal_hours = data.hours
        overtime_hours = 0.0

        ot_status = None
        ot_decided_by_role = None
        ot_decided_at = None

    else:
        normal_hours = remaining_normal
        overtime_hours = data.hours - remaining_normal

        ot_status = "Pending"
        ot_decided_by_role = None
        ot_decided_at = None

        if (
            employee.access_tier == "Admin/Leadership"
            and employee.manager_id is None
        ):
            ot_status = "Approved"
            ot_decided_by_role = "No approval required"
            ot_decided_at = datetime.now(timezone.utc)


    entry = models.TimeEntry(
        entry_id=data.entry_id,
        employee_id=data.employee_id,
        project_id=data.project_id,
        date=data.date,
        hours=data.hours,
        billable_flag=data.billable_flag,
        source=data.source,
        notes=data.notes,
        normal_hours=normal_hours,
        overtime_hours=overtime_hours,
        ot_status=ot_status,
        ot_decided_by_role=ot_decided_by_role,
        ot_decided_at=ot_decided_at,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


def get_time_entry(
    db: Session,
    entry_id: str,
) -> models.TimeEntry:
    entry = db.get(
        models.TimeEntry,
        entry_id,
    )

    if entry is None:
        raise NotFoundError(
            f"Time entry {entry_id} not found"
        )

    return entry

def list_time_entries(
    db: Session,
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[models.TimeEntry]:

    query = db.query(models.TimeEntry)

    # Filter by employee
    if employee_id:
        query = query.filter(
            models.TimeEntry.employee_id == employee_id
        )

    # Filter by start date
    if start_date:
        query = query.filter(
            models.TimeEntry.date >= start_date
        )

    # Filter by end date
    if end_date:
        query = query.filter(
            models.TimeEntry.date <= end_date
        )

    # Ignore old/invalid zero-hour records.
    # TimeEntryCreate already requires hours > 0,
    # but this protects existing database records.
    query = query.filter(
        models.TimeEntry.hours > 0
    )

    # Newest entries first
    query = query.order_by(
        models.TimeEntry.date.desc()
    )

    return query.all()




def _manager_report_ids(
    db: Session,
    manager_employee_id: str,
) -> List[str]:

    reports = (
        db.query(Employee.employee_id)
        .filter(
            Employee.manager_id == manager_employee_id
        )
        .all()
    )

    return [
        employee_id
        for (employee_id,) in reports
    ]


def list_pending_ot_entries(
    db: Session,
    current_employee: Employee,
) -> List[models.TimeEntry]:

    report_ids = _manager_report_ids(
        db,
        current_employee.employee_id,
    )

    if not report_ids:
        return []

    return (
        db.query(models.TimeEntry)
        .filter(
            models.TimeEntry.ot_status == "Pending",
            models.TimeEntry.employee_id.in_(
                report_ids
            ),
        )
        .order_by(
            models.TimeEntry.date.desc()
        )
        .all()
    )


def _assert_can_decide_ot(
    db: Session,
    entry: models.TimeEntry,
    current_employee: Employee,
) -> None:

    owner = db.get(
        Employee,
        entry.employee_id,
    )

    if owner is None:
        raise NotYourReportError(
            "The employee who submitted this overtime could not be found."
        )

    if owner.manager_id != current_employee.employee_id:
        raise NotYourReportError(
            "You can only approve or reject overtime for your own direct reports."
        )


def approve_ot(
    db: Session,
    entry_id: str,
    current_employee: Employee,
) -> models.TimeEntry:

    entry = get_time_entry(
        db,
        entry_id,
    )

    if entry.ot_status != "Pending":
        raise InvalidOTTransitionError(
            f"Time entry {entry_id} has no pending "
            "overtime to approve."
        )

    _assert_can_decide_ot(
        db,
        entry,
        current_employee,
    )

    entry.ot_status = "Approved"

    entry.ot_decided_by_role = (
        current_employee.access_tier
    )

    entry.ot_decided_at = (
        datetime.now(timezone.utc)
    )

    db.commit()
    db.refresh(entry)

    return entry


def reject_ot(
    db: Session,
    entry_id: str,
    current_employee: Employee,
) -> models.TimeEntry:

    entry = get_time_entry(
        db,
        entry_id,
    )

    if entry.ot_status != "Pending":
        raise InvalidOTTransitionError(
            f"Time entry {entry_id} has no pending "
            "overtime to reject."
        )

    _assert_can_decide_ot(
        db,
        entry,
        current_employee,
    )

    entry.hours = entry.normal_hours
    entry.overtime_hours = 0.0
    entry.ot_status = "Rejected"

    entry.ot_decided_by_role = (
        current_employee.access_tier
    )

    entry.ot_decided_at = (
        datetime.now(timezone.utc)
    )

    db.commit()
    db.refresh(entry)

    return entry


def _effective_hours(
    entry: models.TimeEntry,
) -> float:

    if entry.ot_status == "Approved":
        return entry.hours

    return entry.normal_hours


def _weeks_in_period(
    start_date: date,
    end_date: date,
) -> float:

    days = (end_date - start_date).days +1

    return max(
        days / 7.0,
        1 / 7.0,
    )


# --- Utilization (FR-UTL-02, FR-UTL-03) ---

def compute_utilization(
    db: Session,
    employee_id: str,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = DEFAULT_CAPACITY_HOURS_PER_WEEK,
) -> schemas.UtilizationSummary:

    entries = list_time_entries(
        db,
        employee_id=employee_id,
        start_date=start_date,
        end_date=end_date,
    )

    billable_hours = sum(
        _effective_hours(e)
        for e in entries
        if e.billable_flag
    )

    available_hours = (
        capacity_hours_per_week
        * _weeks_in_period(
            start_date,
            end_date,
        )
    )

    utilization_pct = (
        billable_hours / available_hours
        if available_hours
        else 0.0
    )

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
        utilization_pct=round(
            utilization_pct,
            4,
        ),
        flag=flag,
    )


def compute_org_utilization(
    db: Session,
    start_date: date,
    end_date: date,
    capacity_hours_per_week: float = DEFAULT_CAPACITY_HOURS_PER_WEEK,
) -> schemas.OrgUtilizationDashboard:
    """FR-UTL-05: org-wide utilization, bench-risk list, over-allocation list, project margins."""

    entries = list_time_entries(
        db,
        start_date=start_date,
        end_date=end_date,
    )

    employee_ids = sorted(
        {
            e.employee_id
            for e in entries
        }
    )

    summaries = [
        compute_utilization(
            db,
            emp_id,
            start_date,
            end_date,
            capacity_hours_per_week,
        )
        for emp_id in employee_ids
    ]

    bench_risk = [
        s.employee_id
        for s in summaries
        if s.flag == "under_utilized"
    ]

    over_allocated = [
        s.employee_id
        for s in summaries
        if s.flag == "over_allocated"
    ]

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

    summary = compute_utilization(
        db,
        employee_id,
        start_date,
        end_date,
        capacity_hours_per_week,
    )

    entries = list_time_entries(
        db,
        employee_id=employee_id,
        start_date=start_date,
        end_date=end_date,
    )

    hours_by_project: dict = defaultdict(float)
    weekly_trend: dict = defaultdict(float)

    for e in entries:
        effective = _effective_hours(e)

        hours_by_project[e.project_id] += effective

        iso_year, iso_week, _ = e.date.isocalendar()

        weekly_trend[
            f"{iso_year}-W{iso_week:02d}"
        ] += effective

    return schemas.PersonalUtilizationDashboard(
        summary=summary,
        hours_by_project=dict(hours_by_project),
        weekly_trend=dict(weekly_trend),
    )


# --- Margins (FR-UTL-04) ---

def compute_project_margin(
    db: Session,
    project_id: str,
) -> schemas.ProjectMargin:

    project = get_project(
        db,
        project_id,
    )

    entries = (
        db.query(models.TimeEntry)
        .filter(
            models.TimeEntry.project_id == project_id
        )
        .all()
    )

    billing_rate = project.billing_rate or 0.0
    cost_rate = project.cost_rate or 0.0

    revenue = sum(
        _effective_hours(e) * billing_rate
        for e in entries
        if e.billable_flag
    )

    cost = sum(
        _effective_hours(e) * cost_rate
        for e in entries
    )

    margin = revenue - cost

    margin_pct = (
        margin / revenue
        if revenue
        else None
    )

    return schemas.ProjectMargin(
        project_id=project.project_id,
        project_name=project.name,
        revenue=round(revenue, 2),
        cost=round(cost, 2),
        margin=round(margin, 2),
        margin_pct=(
            round(margin_pct, 4)
            if margin_pct is not None
            else None
        ),
    )


def compute_all_project_margins(
    db: Session,
) -> List[schemas.ProjectMargin]:

    projects = list_projects(db)

    return [
        compute_project_margin(
            db,
            p.project_id,
        )
        for p in projects
    ]