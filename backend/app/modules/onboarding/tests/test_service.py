import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.onboarding import service
from app.modules.onboarding.models import OnboardingInstance
from app.modules.onboarding.schemas import (
    OnboardingTemplateCreate,
    OnboardingTaskCreate,
    OnboardingInstanceCreate,
    TaskCompletionCreate,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # E001: the new joiner. E002: Admin. E003: HR-Restricted. E004: Manager. E005: plain Employee.
    session.add(Employee(employee_id="E001", name="New Joiner", access_tier="Employee"))
    session.add(Employee(employee_id="E002", name="Admin", access_tier="Admin/Leadership"))
    session.add(Employee(employee_id="E003", name="HR Person", access_tier="HR-Restricted"))
    session.add(Employee(employee_id="E004", name="Manager", access_tier="Manager"))
    session.add(Employee(employee_id="E005", name="Unrelated Employee", access_tier="Employee"))
    session.commit()
    yield session
    session.close()


def _make_template_with_tasks(db):
    service.create_template(
        db, OnboardingTemplateCreate(template_id="TPL1", name="Standard", requester_id="E002")
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="T_HR", template_id="TPL1", name="Collect ID proof", seq=1,
            responsible_role="hr", requester_id="E002",
        ),
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="T_IT", template_id="TPL1", name="Issue laptop", seq=2,
            responsible_role="it", requester_id="E002",
        ),
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="T_NJ", template_id="TPL1", name="Sign policy doc", seq=3,
            responsible_role="new_joiner", requester_id="E002",
        ),
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="T_MGR", template_id="TPL1", name="Team introduction", seq=4,
            responsible_role="manager", requester_id="E002",
        ),
    )


# --- only Admin/Leadership may define templates/tasks ---

def test_create_template_by_admin_succeeds(db):
    t = service.create_template(
        db, OnboardingTemplateCreate(template_id="TPL1", name="Standard", requester_id="E002")
    )
    assert t.template_id == "TPL1"


def test_create_template_by_non_admin_raises(db):
    with pytest.raises(service.NotAuthorized):
        service.create_template(
            db, OnboardingTemplateCreate(template_id="TPL1", name="Standard", requester_id="E003")
        )


def test_add_task_by_non_admin_raises(db):
    service.create_template(
        db, OnboardingTemplateCreate(template_id="TPL1", name="Standard", requester_id="E002")
    )
    with pytest.raises(service.NotAuthorized):
        service.add_task_to_template(
            db,
            OnboardingTaskCreate(
                task_id="T1", template_id="TPL1", name="Collect ID proof", seq=1,
                responsible_role="hr", requester_id="E005",
            ),
        )


# --- instance creation and progress tracking ---

def test_create_instance_requires_valid_template(db):
    with pytest.raises(service.TemplateNotFound):
        service.create_instance(
            db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="NOPE", requester_id="E002")
        )


def test_create_instance(db):
    _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    assert service.get_completion_pct(db, instance.instance_id) == 0.0


def test_create_instance_by_non_admin_raises(db):
    _make_template_with_tasks(db)
    with pytest.raises(service.NotAuthorized):
        service.create_instance(
            db, OnboardingInstanceCreate(instance_id="OI002", employee_id="E001", template_id="TPL1", requester_id="E005")
        )


# --- only the correct responsible party may complete a task ---

def test_complete_hr_task_by_hr_succeeds(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T_HR", completed_by="E003")
    )
    assert completion.completed_by == "E003"


def test_complete_hr_task_by_unrelated_employee_raises(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="OI001", task_id="T_HR", completed_by="E005")
        )


def test_complete_it_task_requires_admin(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    # HR-Restricted is not Admin - IT tasks are Admin/Leadership only.
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="OI001", task_id="T_IT", completed_by="E003")
        )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T_IT", completed_by="E002")
    )
    assert completion.completed_by == "E002"


def test_complete_new_joiner_task_requires_that_specific_employee(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    # E005 is a plain Employee but not THIS new joiner - must be rejected.
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="OI001", task_id="T_NJ", completed_by="E005")
        )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T_NJ", completed_by="E001")
    )
    assert completion.completed_by == "E001"


def test_complete_manager_task_requires_manager_tier(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="OI001", task_id="T_MGR", completed_by="E005")
        )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T_MGR", completed_by="E004")
    )
    assert completion.completed_by == "E004"


def test_complete_task_updates_completion_pct(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T_HR", completed_by="E003")
    )
    assert service.get_completion_pct(db, "OI001") == 25.0


def test_overdue_task_is_flagged(db):
    # FR-ONB-04: "flag overdue tasks past an expected completion window."
    service.create_template(
        db, OnboardingTemplateCreate(template_id="TPL_OD", name="Overdue Test", requester_id="E002")
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="OD1", template_id="TPL_OD", name="Overdue task", seq=1,
            responsible_role="hr", expected_days=0, requester_id="E002",
        ),
    )
    instance = OnboardingInstance(
        instance_id="OI_OD", employee_id="E001", template_id="TPL_OD",
        start_date=datetime.date.today() - datetime.timedelta(days=5),
    )
    db.add(instance)
    db.commit()

    assert service.get_overdue_task_ids(db, "OI_OD") == ["OD1"]


def test_task_with_no_expected_days_is_never_overdue(db):
    service.create_template(
        db, OnboardingTemplateCreate(template_id="TPL_OD2", name="No Deadline", requester_id="E002")
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="OD2", template_id="TPL_OD2", name="No deadline task", seq=1,
            responsible_role="hr", requester_id="E002",
        ),
    )
    instance = OnboardingInstance(
        instance_id="OI_OD2", employee_id="E001", template_id="TPL_OD2",
        start_date=datetime.date.today() - datetime.timedelta(days=365),
    )
    db.add(instance)
    db.commit()

    assert service.get_overdue_task_ids(db, "OI_OD2") == []


def test_completed_overdue_task_is_not_flagged(db):
    service.create_template(
        db, OnboardingTemplateCreate(template_id="TPL_OD3", name="Done Overdue", requester_id="E002")
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="OD3", template_id="TPL_OD3", name="Overdue but done", seq=1,
            responsible_role="hr", expected_days=0, requester_id="E002",
        ),
    )
    instance = OnboardingInstance(
        instance_id="OI_OD3", employee_id="E001", template_id="TPL_OD3",
        start_date=datetime.date.today() - datetime.timedelta(days=5),
    )
    db.add(instance)
    db.commit()

    service.complete_task(
        db, TaskCompletionCreate(instance_id="OI_OD3", task_id="OD3", completed_by="E003")
    )

    assert service.get_overdue_task_ids(db, "OI_OD3") == []


def test_complete_task_missing_instance_raises(db):
    _make_template_with_tasks(db)
    with pytest.raises(service.InstanceNotFound):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="DOES_NOT_EXIST", task_id="T_HR", completed_by="E003")
        )


def test_cohort_view_by_admin_succeeds(db):
    # "Admin/HR shall have a cohort view showing all current
    # joiners' onboarding progress side by side."
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI_COHORT", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    cohort = service.list_instances_for_cohort(db, "E002")
    instance_ids = [row["instance_id"] for row in cohort]
    assert "OI_COHORT" in instance_ids


def test_cohort_view_by_non_admin_raises(db):
    _make_template_with_tasks(db)
    with pytest.raises(service.NotAuthorized):
        service.list_instances_for_cohort(db, "E001")


def test_completion_details_includes_timestamp(db):
    _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI_TS", employee_id="E001", template_id="TPL1", requester_id="E002")
    )
    service.complete_task(
        db, TaskCompletionCreate(instance_id="OI_TS", task_id="T_HR", completed_by="E003")
    )
    details = service.get_completion_details(db, "OI_TS")
    assert len(details) == 1
    assert details[0].task_id == "T_HR"
    assert details[0].completed_by == "E003"
    assert details[0].completed_at is not None
