
# from datetime import date, timedelta

# import pytest
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.database import Base
# from app.modules.directory.models import Employee
# from app.modules.consultant_utilization import schemas, service


# @pytest.fixture
# def db():
#     engine = create_engine("sqlite:///:memory:")
#     Base.metadata.create_all(engine)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()
#     yield session
#     session.close()


# @pytest.fixture
# def employee(db):
#     emp = Employee(employee_id="E1", name="Test Consultant")
#     db.add(emp)
#     db.commit()
#     return emp


# def _log_hours(db, employee_id, project_id, day, hours, billable):
#     entry = schemas.TimeEntryCreate(
#         entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}",
#         employee_id=employee_id,
#         project_id=project_id,
#         date=day,
#         hours=hours,
#         billable_flag=billable,
#     )
#     return service.create_time_entry(db, entry)


# def test_utilization_flags_under_utilized(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 10 billable hours in a 1-week period against 40h capacity -> well under 60%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "under_utilized"
#     assert summary.utilization_pct < 0.60


# def test_utilization_flags_over_allocated(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 45 billable hours across the week (spread over multiple days since a
#     # single entry is capped at 24h/day) against 40h/week capacity -> >105%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 9, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "over_allocated"
#     assert summary.utilization_pct > 1.05


# def test_non_billable_hours_dont_count_toward_utilization(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Internal", project_type="Internal")
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 6, False)  # not billable

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.billable_hours == 0
#     assert summary.flag == "under_utilized"


# def test_project_margin_calculation(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=60)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 20, True)

#     margin = service.compute_project_margin(db, "P1")
#     assert margin.revenue == 2000
#     assert margin.cost == 1200
#     assert margin.margin == 800
#     assert margin.margin_pct == pytest.approx(0.4)


# def test_time_entry_rejects_unknown_project(db, employee):
#     with pytest.raises(service.NotFoundError):
#         _log_hours(db, "E1", "NO_SUCH_PROJECT", date(2026, 1, 5), 5, True)

# def test_time_entry_rejects_future_date(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     tomorrow = date.today() + timedelta(days=1)
#     with pytest.raises(service.FutureDateError):
#         _log_hours(db, "E1", "P1", tomorrow, 5, True)


# def test_time_entry_allows_today(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date.today(), 5, True)
#     assert entry.date == date.today()


# def test_org_dashboard_groups_bench_risk_and_over_allocated(db, employee):
#     db.add(Employee(employee_id="E2", name="Consultant Two"))
#     db.commit()
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True)    # under-utilized

#     _log_hours(db, "E2", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 9), 9, True)   # over-allocated

#     dashboard = service.compute_org_utilization(db, date(2026, 1, 5), date(2026, 1, 11))
#     assert "E1" in dashboard.bench_risk
#     assert "E2" in dashboard.over_allocated

# from datetime import date, timedelta

# import pytest
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.database import Base
# from app.modules.directory.models import Employee
# from app.modules.consultant_utilization import schemas, service


# @pytest.fixture
# def db():
#     engine = create_engine("sqlite:///:memory:")
#     Base.metadata.create_all(engine)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()
#     yield session
#     session.close()


# @pytest.fixture
# def employee(db):
#     emp = Employee(employee_id="E1", name="Test Consultant")
#     db.add(emp)
#     db.commit()
#     return emp


# def _log_hours(db, employee_id, project_id, day, hours, billable, confirm_overtime=True):
#     entry = schemas.TimeEntryCreate(
#         entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}-{hours}",
#         employee_id=employee_id,
#         project_id=project_id,
#         date=day,
#         hours=hours,
#         billable_flag=billable,
#         confirm_overtime=confirm_overtime,
#     )
#     return service.create_time_entry(db, entry)


# def test_utilization_flags_under_utilized(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 10 billable hours in a 1-week period against 40h capacity -> well under 60%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "under_utilized"
#     assert summary.utilization_pct < 0.60


# def test_utilization_flags_over_allocated(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     # 45 billable hours across the week (spread over multiple days since a
#     # single entry is capped at 24h/day) against 40h/week capacity -> >105%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 9, True)

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.flag == "over_allocated"
#     assert summary.utilization_pct > 1.05


# def test_non_billable_hours_dont_count_toward_utilization(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Internal", project_type="Internal")
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 6, False)  # not billable

#     summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
#     assert summary.billable_hours == 0
#     assert summary.flag == "under_utilized"


# def test_project_margin_calculation(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=60)
#     )
#     # 20 total hours, split across two days since a single entry now caps
#     # at 16h/day - margin calc sums across all entries regardless of date.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 16, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 4, True)

#     margin = service.compute_project_margin(db, "P1")
#     assert margin.revenue == 2000
#     assert margin.cost == 1200
#     assert margin.margin == 800
#     assert margin.margin_pct == pytest.approx(0.4)


# def test_time_entry_rejects_unknown_project(db, employee):
#     with pytest.raises(service.NotFoundError):
#         _log_hours(db, "E1", "NO_SUCH_PROJECT", date(2026, 1, 5), 5, True)


# def test_time_entry_rejects_future_date(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     tomorrow = date.today() + timedelta(days=1)
#     with pytest.raises(service.FutureDateError):
#         _log_hours(db, "E1", "P1", tomorrow, 5, True)


# def test_time_entry_allows_today(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date.today(), 5, True)
#     assert entry.date == date.today()


# def test_time_entry_rejects_combined_hours_over_16_in_a_day(db, employee):
#     """A day only has 16h max (8 normal + 8 overtime) - even across
#     multiple separate entries."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)
#     with pytest.raises(service.DailyHoursExceededError):
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)


# def test_time_entry_allows_up_to_exactly_16_hours_combined(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     assert entry.hours == 6


# def test_daily_hours_cap_resets_next_day(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 16, True)
#     # Different day - shouldn't count against Jan 5th's total.
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 6), 16, True)
#     assert entry.date == date(2026, 1, 6)


# def test_hours_within_normal_budget_are_never_overtime(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, True, confirm_overtime=False)
#     assert entry.normal_hours == 6
#     assert entry.overtime_hours == 0
 
 
# def test_overtime_requires_confirmation(db, employee):
#     """Logging 10h with no confirmation should not silently succeed - the
#     caller must explicitly acknowledge the overtime portion first."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True, confirm_overtime=False)
#     assert exc_info.value.remaining_normal_hours == 8
#     assert exc_info.value.requested_hours == 10
 
 
# def test_overtime_confirmed_splits_correctly(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True, confirm_overtime=True)
#     assert entry.normal_hours == 8
#     assert entry.overtime_hours == 2
#     assert entry.hours == 10
 
 
# def test_cumulative_overtime_across_two_entries_same_day(db, employee):
#     """Exact scenario: first entry 6h (all normal, no OT needed). Second
#     entry 5h the same day - only 2h of normal budget remain, so 2h normal
#     + 3h overtime for that second entry."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     first = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, True, confirm_overtime=False)
#     assert first.normal_hours == 6
#     assert first.overtime_hours == 0
 
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True, confirm_overtime=False)
#     assert exc_info.value.remaining_normal_hours == 2
#     assert exc_info.value.requested_hours == 5
 
#     second = _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True, confirm_overtime=True)
#     assert second.normal_hours == 2
#     assert second.overtime_hours == 3
 
 
# def test_declining_overtime_can_be_resubmitted_at_remaining_normal_budget(db, employee):
#     """This is the client-side flow when the person says "No" to the OT
#     prompt: resubmit with hours capped to whatever normal budget remains,
#     rather than the original higher amount."""
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, True, confirm_overtime=False)
 
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True, confirm_overtime=False)
#     remaining = exc_info.value.remaining_normal_hours  # 2
 
#     # Person said "No" - resubmit truncated to just the remaining budget.
#     truncated = _log_hours(db, "E1", "P1", date(2026, 1, 5), remaining, True, confirm_overtime=False)
#     assert truncated.hours == 2
#     assert truncated.normal_hours == 2
#     assert truncated.overtime_hours == 0
 
 
# def test_overtime_confirmation_required_even_when_zero_normal_remains(db, employee):
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True, confirm_overtime=False)  # uses up all normal
#     with pytest.raises(service.OvertimeConfirmationRequired) as exc_info:
#         _log_hours(db, "E1", "P1", date(2026, 1, 5), 1, True, confirm_overtime=False)
#     assert exc_info.value.remaining_normal_hours == 0
 
 
# def test_org_dashboard_groups_bench_risk_and_over_allocated(db, employee):
#     db.add(Employee(employee_id="E2", name="Consultant Two"))
#     db.commit()
#     service.create_project(
#         db, schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                    billing_rate=100, cost_rate=50)
#     )
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 5, True)    # under-utilized

#     _log_hours(db, "E2", "P1", date(2026, 1, 5), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 6), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 7), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 8), 9, True)
#     _log_hours(db, "E2", "P1", date(2026, 1, 9), 9, True)   # over-allocated

#     dashboard = service.compute_org_utilization(db, date(2026, 1, 5), date(2026, 1, 11))
#     assert "E1" in dashboard.bench_risk
#     assert "E2" in dashboard.over_allocated



# from datetime import date, timedelta

# import pytest
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.database import Base
# from app.modules.directory.models import Employee
# from app.modules.consultant_utilization import schemas, service


# @pytest.fixture
# def db():
#     engine = create_engine("sqlite:///:memory:")
#     Base.metadata.create_all(engine)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()
#     yield session
#     session.close()


# @pytest.fixture
# def employee(db):
#     emp = Employee(employee_id="E1", name="Test Consultant")
#     db.add(emp)
#     db.commit()
#     return emp


# def _log_hours(db, employee_id, project_id, day, hours, billable):
#     entry = schemas.TimeEntryCreate(
#         entry_id=f"TE-{employee_id}-{day}-{project_id}-{billable}-{hours}",
#         employee_id=employee_id,
#         project_id=project_id,
#         date=day,
#         hours=hours,
#         billable_flag=billable,
#     )
#     return service.create_time_entry(db, entry)


# def test_utilization_flags_under_utilized(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     # 8 billable hours in a 1-week period against 40h capacity -> well under 60%.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True)

#     summary = service.compute_utilization(
#         db,
#         "E1",
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert summary.flag == "under_utilized"
#     assert summary.utilization_pct < 0.60


# def test_utilization_flags_over_allocated(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     # 48 billable hours during the week.
#     # Jan 10 is Saturday, so use 16 hours on Friday instead.
#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 8, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 8, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 8, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 16, True)

#     summary = service.compute_utilization(
#         db,
#         "E1",
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert summary.flag == "over_allocated"
#     assert summary.utilization_pct > 1.05


# def test_non_billable_hours_dont_count_toward_utilization(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Internal",
#             project_type="Internal",
#         ),
#     )

#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 8), 6, False)
#     _log_hours(db, "E1", "P1", date(2026, 1, 9), 6, False)

#     summary = service.compute_utilization(
#         db,
#         "E1",
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert summary.billable_hours == 0
#     assert summary.flag == "under_utilized"


# def test_project_margin_calculation(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=60,
#         ),
#     )

#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 8, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 6), 8, True)
#     _log_hours(db, "E1", "P1", date(2026, 1, 7), 4, True)

#     margin = service.compute_project_margin(db, "P1")

#     assert margin.revenue == 2000
#     assert margin.cost == 1200
#     assert margin.margin == 800
#     assert margin.margin_pct == pytest.approx(0.4)


# def test_time_entry_rejects_unknown_project(db, employee):
#     with pytest.raises(service.NotFoundError):
#         _log_hours(
#             db,
#             "E1",
#             "NO_SUCH_PROJECT",
#             date(2026, 1, 5),
#             5,
#             True,
#         )


# def test_time_entry_rejects_future_date(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     tomorrow = date.today() + timedelta(days=1)

#     with pytest.raises(service.FutureDateError):
#         _log_hours(db, "E1", "P1", tomorrow, 5, True)


# def test_time_entry_allows_today(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date.today(),
#         5,
#         True,
#     )

#     assert entry.date == date.today()


# def test_time_entry_rejects_combined_hours_over_16_in_a_day(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

#     with pytest.raises(service.DailyHoursExceededError):
#         _log_hours(
#             db,
#             "E1",
#             "P1",
#             date(2026, 1, 5),
#             10,
#             True,
#         )


# def test_time_entry_allows_up_to_exactly_16_hours_combined(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 10, True)

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         6,
#         False,
#     )

#     assert entry.hours == 6


# def test_daily_hours_cap_resets_next_day(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     _log_hours(db, "E1", "P1", date(2026, 1, 5), 16, True)

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 6),
#         16,
#         True,
#     )

#     assert entry.date == date(2026, 1, 6)


# def test_hours_within_normal_budget_have_no_overtime(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         6,
#         True,
#     )

#     assert entry.normal_hours == 6
#     assert entry.overtime_hours == 0
#     assert entry.ot_status is None


# def test_overtime_saves_immediately_as_pending(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         10,
#         True,
#     )

#     assert entry.hours == 10
#     assert entry.normal_hours == 8
#     assert entry.overtime_hours == 2
#     assert entry.ot_status == "Pending"


# def test_cumulative_overtime_across_two_entries_same_day(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     first = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         6,
#         True,
#     )

#     assert first.normal_hours == 6
#     assert first.overtime_hours == 0
#     assert first.ot_status is None

#     second = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         5,
#         True,
#     )

#     assert second.normal_hours == 2
#     assert second.overtime_hours == 3
#     assert second.ot_status == "Pending"


# def test_pending_overtime_excluded_from_utilization_until_approved(
#     db,
#     employee,
# ):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         10,
#         True,
#     )

#     summary = service.compute_utilization(
#         db,
#         "E1",
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert summary.billable_hours == 8


# def test_approving_overtime_makes_it_count_toward_utilization(
#     db,
#     employee,
# ):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         10,
#         True,
#     )

#     service.approve_ot(
#         db,
#         entry.entry_id,
#         decided_by_role="Admin/Leadership",
#     )

#     summary = service.compute_utilization(
#         db,
#         "E1",
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert summary.billable_hours == 10


# def test_rejecting_overtime_caps_entry_back_to_normal_hours(
#     db,
#     employee,
# ):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         10,
#         True,
#     )

#     rejected = service.reject_ot(
#         db,
#         entry.entry_id,
#         decided_by_role="HR-Restricted",
#     )

#     assert rejected.ot_status == "Rejected"
#     assert rejected.hours == 8
#     assert rejected.overtime_hours == 0

#     summary = service.compute_utilization(
#         db,
#         "E1",
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert summary.billable_hours == 8


# def test_list_pending_ot_entries(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         6,
#         True,
#     )

#     entry_with_ot = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 6),
#         10,
#         True,
#     )

#     pending = service.list_pending_ot_entries(db)

#     assert len(pending) == 1
#     assert pending[0].entry_id == entry_with_ot.entry_id


# def test_cannot_approve_ot_twice(db, employee):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         10,
#         True,
#     )

#     service.approve_ot(
#         db,
#         entry.entry_id,
#         decided_by_role="Admin/Leadership",
#     )

#     with pytest.raises(service.InvalidOTTransitionError):
#         service.approve_ot(
#             db,
#             entry.entry_id,
#             decided_by_role="Admin/Leadership",
#         )


# def test_cannot_approve_ot_on_entry_with_no_pending_ot(
#     db,
#     employee,
# ):
#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     entry = _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         6,
#         True,
#     )

#     with pytest.raises(service.InvalidOTTransitionError):
#         service.approve_ot(
#             db,
#             entry.entry_id,
#             decided_by_role="Admin/Leadership",
#         )


# def test_org_dashboard_groups_bench_risk_and_over_allocated(
#     db,
#     employee,
# ):
#     db.add(
#         Employee(
#             employee_id="E2",
#             name="Consultant Two",
#         )
#     )
#     db.commit()

#     service.create_project(
#         db,
#         schemas.ProjectCreate(
#             project_id="P1",
#             name="Client A",
#             project_type="real project",
#             billing_rate=100,
#             cost_rate=50,
#         ),
#     )

#     # E1 is under-utilized.
#     _log_hours(
#         db,
#         "E1",
#         "P1",
#         date(2026, 1, 5),
#         5,
#         True,
#     )

#     # E2 has 48 billable hours during the week.
#     # Jan 10 is Saturday, so use 16 hours on Friday instead.
#     _log_hours(
#         db,
#         "E2",
#         "P1",
#         date(2026, 1, 5),
#         8,
#         True,
#     )

#     _log_hours(
#         db,
#         "E2",
#         "P1",
#         date(2026, 1, 6),
#         8,
#         True,
#     )

#     _log_hours(
#         db,
#         "E2",
#         "P1",
#         date(2026, 1, 7),
#         8,
#         True,
#     )

#     _log_hours(
#         db,
#         "E2",
#         "P1",
#         date(2026, 1, 8),
#         8,
#         True,
#     )

#     _log_hours(
#         db,
#         "E2",
#         "P1",
#         date(2026, 1, 9),
#         16,
#         True,
#     )

#     dashboard = service.compute_org_utilization(
#         db,
#         date(2026, 1, 5),
#         date(2026, 1, 11),
#     )

#     assert "E1" in dashboard.bench_risk
#     assert "E2" in dashboard.over_allocated


from datetime import date, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.consultant_utilization import schemas, service

# Importing service already imports app.modules.leave.models (LeaveApplication,
# LeaveStatus) at module level, which registers those tables with Base -
# so Base.metadata.create_all(engine) below creates them too.
from app.modules.leave.models import LeaveApplication, LeaveStatus


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


def _make_employee(db, employee_id, name="Test", access_tier="Employee", manager_id=None):
    emp = Employee(
        employee_id=employee_id,
        name=name,
        access_tier=access_tier,
        manager_id=manager_id,
    )
    db.add(emp)
    db.commit()
    return emp


def _log_hours(db, employee_id, project_id, day, hours, billable=True):
    entry = schemas.TimeEntryCreate(
        entry_id=f"TE-{employee_id}-{day}-{project_id}-{hours}-{billable}",
        employee_id=employee_id,
        project_id=project_id,
        date=day,
        hours=hours,
        billable_flag=billable,
    )
    return service.create_time_entry(db, entry)


def _make_project(db, project_id="P1", billing_rate=100, cost_rate=50):
    return service.create_project(
        db,
        schemas.ProjectCreate(
            project_id=project_id,
            name="Client A",
            project_type="real project",
            billing_rate=billing_rate,
            cost_rate=cost_rate,
        ),
    )


# ---------------------------------------------------------------------------
# can_log_hours_for - Admin/Leadership only may log for someone else
# ---------------------------------------------------------------------------

def test_can_log_hours_for_self_always_true(db):
    e1 = _make_employee(db, "E1", access_tier="Employee")
    assert service.can_log_hours_for(e1, e1) is True


def test_can_log_hours_for_admin_can_log_for_anyone(db):
    admin = _make_employee(db, "ADM1", access_tier="Admin/Leadership")
    other = _make_employee(db, "E2", access_tier="Employee")
    assert service.can_log_hours_for(admin, other) is True


def test_can_log_hours_for_manager_cannot_log_for_report(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    report = _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    assert service.can_log_hours_for(manager, report) is False


def test_can_log_hours_for_hr_cannot_log_for_report(db):
    hr = _make_employee(db, "HR1", access_tier="HR-Restricted")
    report = _make_employee(db, "E9", access_tier="Employee", manager_id="HR1")
    assert service.can_log_hours_for(hr, report) is False


# ---------------------------------------------------------------------------
# list_time_entry_employees
# ---------------------------------------------------------------------------

def test_admin_sees_every_employee(db):
    admin = _make_employee(db, "ADM1", access_tier="Admin/Leadership")
    _make_employee(db, "E1")
    _make_employee(db, "E2")

    result = service.list_time_entry_employees(db, admin)
    ids = {e.employee_id for e in result}
    assert ids == {"ADM1", "E1", "E2"}


def test_manager_sees_only_self_and_direct_reports(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    _make_employee(db, "E9", access_tier="Employee", manager_id="OTHER")

    result = service.list_time_entry_employees(db, manager)
    ids = {e.employee_id for e in result}
    assert ids == {"E4", "E8"}


def test_plain_employee_sees_only_self(db):
    emp = _make_employee(db, "E1", access_tier="Employee")
    result = service.list_time_entry_employees(db, emp)
    assert [e.employee_id for e in result] == ["E1"]


# ---------------------------------------------------------------------------
# create_time_entry - validation rules
# ---------------------------------------------------------------------------

def test_rejects_unknown_project(db):
    _make_employee(db, "E1")
    with pytest.raises(service.NotFoundError):
        _log_hours(db, "E1", "NO_SUCH_PROJECT", date(2026, 1, 5), 5)


def test_rejects_unknown_employee(db):
    _make_project(db)
    with pytest.raises(service.NotFoundError):
        _log_hours(db, "GHOST", "P1", date(2026, 1, 5), 5)


def test_rejects_future_date(db):
    _make_employee(db, "E1")
    _make_project(db)
    tomorrow = date.today() + timedelta(days=1)
    with pytest.raises(service.FutureDateError):
        _log_hours(db, "E1", "P1", tomorrow, 5)


def test_allows_today(db):
    _make_employee(db, "E1")
    _make_project(db)
    entry = _log_hours(db, "E1", "P1", date.today(), 5)
    assert entry.date == date.today()


def test_rejects_weekend(db):
    _make_employee(db, "E1")
    _make_project(db)
    # Jan 10, 2026 is a Saturday.
    with pytest.raises(service.WeekendDateError):
        _log_hours(db, "E1", "P1", date(2026, 1, 10), 5)


def test_rejects_logging_on_approved_leave_day(db):
    _make_employee(db, "E1")
    _make_project(db)

    # NOTE: field names here (leave_type_id, LeaveStatus.APPROVED) are
    # assumed from the ER diagram / earlier service.py reference and may
    # need adjusting to match your actual LeaveApplication model.
    leave = LeaveApplication(
        application_id="LA1",
        employee_id="E1",
        leave_type_id="LT1",
        start_date=date(2026, 1, 5),
        end_date=date(2026, 1, 6),
        status=LeaveStatus.APPROVED,
    )
    db.add(leave)
    db.commit()

    with pytest.raises(service.OnLeaveError):
        _log_hours(db, "E1", "P1", date(2026, 1, 5), 5)


def test_rejects_combined_hours_over_16_in_a_day(db):
    _make_employee(db, "E1")
    _make_project(db)
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)
    with pytest.raises(service.DailyHoursExceededError):
        _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)


def test_allows_up_to_exactly_16_hours_combined(db):
    _make_employee(db, "E1")
    _make_project(db)
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)
    entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6, billable=False)
    assert entry.hours == 6


# ---------------------------------------------------------------------------
# Overtime split
# ---------------------------------------------------------------------------

def test_hours_within_normal_budget_have_no_overtime(db):
    _make_employee(db, "E1")
    _make_project(db)
    entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6)
    assert entry.normal_hours == 6
    assert entry.overtime_hours == 0
    assert entry.ot_status is None


def test_overtime_saves_immediately_as_pending(db):
    _make_employee(db, "E1")
    _make_project(db)
    entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)
    assert entry.normal_hours == 8
    assert entry.overtime_hours == 2
    assert entry.ot_status == "Pending"


def test_cumulative_overtime_across_two_entries_same_day(db):
    _make_employee(db, "E1")
    _make_project(db)
    first = _log_hours(db, "E1", "P1", date(2026, 1, 5), 6)
    assert first.ot_status is None

    second = _log_hours(db, "E1", "P1", date(2026, 1, 5), 5)
    assert second.normal_hours == 2
    assert second.overtime_hours == 3
    assert second.ot_status == "Pending"


def test_top_of_chain_admin_with_no_manager_auto_approves_own_ot(db):
    _make_employee(db, "ADM1", access_tier="Admin/Leadership", manager_id=None)
    _make_project(db)
    entry = _log_hours(db, "ADM1", "P1", date(2026, 1, 5), 10)
    assert entry.ot_status == "Approved"
    assert entry.ot_decided_by_role == "No approval required"


def test_admin_with_a_manager_still_goes_pending(db):
    _make_employee(db, "ADM2", access_tier="Admin/Leadership", manager_id="BOARD1")
    _make_project(db)
    entry = _log_hours(db, "ADM2", "P1", date(2026, 1, 5), 10)
    assert entry.ot_status == "Pending"


# ---------------------------------------------------------------------------
# OT approval - scoped strictly by manager_id chain
# ---------------------------------------------------------------------------

def test_list_pending_ot_entries_scoped_to_direct_reports_only(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    report = _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    stranger = _make_employee(db, "E9", access_tier="Employee", manager_id="OTHER")
    _make_project(db)

    _log_hours(db, "E8", "P1", date(2026, 1, 5), 10)  # report's OT
    _log_hours(db, "E9", "P1", date(2026, 1, 5), 10)  # stranger's OT

    pending = service.list_pending_ot_entries(db, manager)
    assert len(pending) == 1
    assert pending[0].employee_id == "E8"


def test_manager_with_no_reports_sees_empty_queue(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    result = service.list_pending_ot_entries(db, manager)
    assert result == []


def test_manager_can_approve_direct_reports_ot(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    _make_project(db)
    entry = _log_hours(db, "E8", "P1", date(2026, 1, 5), 10)

    approved = service.approve_ot(db, entry.entry_id, manager)
    assert approved.ot_status == "Approved"
    assert approved.ot_decided_by_role == "Manager"


def test_manager_cannot_approve_ot_for_non_report(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E9", access_tier="Employee", manager_id="OTHER")
    _make_project(db)
    entry = _log_hours(db, "E9", "P1", date(2026, 1, 5), 10)

    with pytest.raises(service.NotYourReportError):
        service.approve_ot(db, entry.entry_id, manager)


def test_admin_cannot_approve_ot_unless_literally_the_manager(db):
    admin = _make_employee(db, "ADM1", access_tier="Admin/Leadership")
    _make_employee(db, "E1", access_tier="Employee", manager_id="SOMEONE_ELSE")
    _make_project(db)
    entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)

    with pytest.raises(service.NotYourReportError):
        service.approve_ot(db, entry.entry_id, admin)


def test_reject_ot_caps_entry_back_to_normal_hours(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    _make_project(db)
    entry = _log_hours(db, "E8", "P1", date(2026, 1, 5), 10)

    rejected = service.reject_ot(db, entry.entry_id, manager)
    assert rejected.ot_status == "Rejected"
    assert rejected.hours == 8
    assert rejected.overtime_hours == 0


def test_cannot_approve_ot_twice(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    _make_project(db)
    entry = _log_hours(db, "E8", "P1", date(2026, 1, 5), 10)

    service.approve_ot(db, entry.entry_id, manager)
    with pytest.raises(service.InvalidOTTransitionError):
        service.approve_ot(db, entry.entry_id, manager)


def test_cannot_approve_entry_with_no_pending_ot(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E8", access_tier="Employee", manager_id="E4")
    _make_project(db)
    entry = _log_hours(db, "E8", "P1", date(2026, 1, 5), 6)  # no OT

    with pytest.raises(service.InvalidOTTransitionError):
        service.approve_ot(db, entry.entry_id, manager)


# ---------------------------------------------------------------------------
# Utilization math
# ---------------------------------------------------------------------------

def test_utilization_flags_under_utilized(db):
    _make_employee(db, "E1")
    _make_project(db)
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 8)

    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.flag == "under_utilized"


def test_utilization_flags_over_allocated(db):
    manager = _make_employee(
        db,
        "E4",
        access_tier="Manager",
    )

    _make_employee(
        db,
        "E1",
        access_tier="Employee",
        manager_id="E4",
    )

    _make_project(db)

    # Monday-Friday = 40 normal hours
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 8)
    _log_hours(db, "E1", "P1", date(2026, 1, 6), 8)
    _log_hours(db, "E1", "P1", date(2026, 1, 7), 8)
    _log_hours(db, "E1", "P1", date(2026, 1, 8), 8)

    # 16 hours on Friday:
    # 8 normal + 8 overtime
    entry = _log_hours(
        db,
        "E1",
        "P1",
        date(2026, 1, 9),
        16,
    )

    # Pending overtime does not count until approved.
    service.approve_ot(
        db,
        entry.entry_id,
        manager,
    )

    summary = service.compute_utilization(
        db,
        "E1",
        date(2026, 1, 5),
        date(2026, 1, 11),
    )

    assert summary.billable_hours == 48
    assert summary.available_hours == 40
    assert summary.utilization_pct == pytest.approx(1.20)
    assert summary.flag == "over_allocated"


def test_seven_day_inclusive_range_gives_full_40h_available(db):
    """
    Regression test for the _weeks_in_period off-by-one: a 7-day
    inclusive range (e.g. Aug 13-19) must count as exactly 1 week,
    not 6/7 of a week.
    """
    _make_employee(db, "E1")
    _make_project(db)
    # Jan 5-9, 2026 are Mon-Fri; Jan 5 to Jan 11 is a 7-day inclusive span.
    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.available_hours == pytest.approx(40.0)


def test_pending_ot_excluded_from_utilization_until_approved(db):
    _make_employee(db, "E1")
    _make_project(db)
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)

    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.billable_hours == 8


def test_approved_ot_counts_toward_utilization(db):
    manager = _make_employee(db, "E4", access_tier="Manager")
    _make_employee(db, "E1", access_tier="Employee", manager_id="E4")
    _make_project(db)
    entry = _log_hours(db, "E1", "P1", date(2026, 1, 5), 10)
    service.approve_ot(db, entry.entry_id, manager)

    summary = service.compute_utilization(db, "E1", date(2026, 1, 5), date(2026, 1, 11))
    assert summary.billable_hours == 10


# ---------------------------------------------------------------------------
# Project margins
# ---------------------------------------------------------------------------

def test_project_margin_calculation(db):
    _make_employee(db, "E1")
    _make_project(db, billing_rate=100, cost_rate=60)
    _log_hours(db, "E1", "P1", date(2026, 1, 5), 8)
    _log_hours(db, "E1", "P1", date(2026, 1, 6), 8)
    _log_hours(db, "E1", "P1", date(2026, 1, 7), 4)

    margin = service.compute_project_margin(db, "P1")
    assert margin.revenue == 2000
    assert margin.cost == 1200
    assert margin.margin == 800
    assert margin.margin_pct == pytest.approx(0.4)