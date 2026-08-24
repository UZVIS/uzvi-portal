import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.onboarding import service
from app.modules.onboarding.models import OnboardingInstance
from app.modules.documents.models import EmployeeDocument
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
    # EMP001: the new joiner. EMP002: Admin. EMP003: HR-Restricted. EMP004: Manager. EMP005: plain Employee.
    session.add(Employee(employee_id="EMP001", name="New Joiner", access_tier="Employee", join_date=datetime.date(2026, 1, 15)))
    session.add(Employee(employee_id="EMP002", name="Admin", access_tier="Admin/Leadership"))
    session.add(Employee(employee_id="EMP003", name="HR Person", access_tier="HR-Restricted"))
    session.add(Employee(employee_id="EMP004", name="Manager", access_tier="Manager"))
    session.add(Employee(employee_id="EMP005", name="Unrelated Employee", access_tier="Employee"))
    session.commit()
    yield session
    session.close()


def _make_template_with_tasks(db):
    """Creates a template with one task per responsible role. IDs are
    always server-generated now, so this returns them for callers to
    use, rather than assuming fixed literals."""
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Standard", requester_id="EMP002")
    )
    hr_task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Collect ID proof", seq=1,
            responsible_role="hr", requester_id="EMP002",
        ),
    )
    it_task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Issue laptop", seq=2,
            responsible_role="it", requester_id="EMP002",
        ),
    )
    nj_task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Sign policy doc", seq=3,
            responsible_role="new_joiner", requester_id="EMP002",
        ),
    )
    mgr_task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Team introduction", seq=4,
            responsible_role="manager", requester_id="EMP002",
        ),
    )
    return {
        "template_id": template.template_id,
        "hr": hr_task.task_id,
        "it": it_task.task_id,
        "new_joiner": nj_task.task_id,
        "manager": mgr_task.task_id,
    }


# --- only Admin/Leadership may define templates/tasks ---

def test_create_template_by_admin_succeeds(db):
    t = service.create_template(
        db, OnboardingTemplateCreate(name="Standard", requester_id="EMP002")
    )
    assert t.template_id == "TPL001"


def test_create_template_by_non_admin_raises(db):
    with pytest.raises(service.NotAuthorized):
        service.create_template(
            db, OnboardingTemplateCreate(name="Standard", requester_id="EMP003")
        )


def test_add_task_by_non_admin_raises(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Standard", requester_id="EMP002")
    )
    with pytest.raises(service.NotAuthorized):
        service.add_task_to_template(
            db,
            OnboardingTaskCreate(
                template_id=template.template_id, name="Collect ID proof", seq=1,
                responsible_role="hr", requester_id="EMP005",
            ),
        )


def test_task_ids_auto_generate_in_sequence(db):
    # task_id is globally unique and always auto-generated - two tasks
    # added back to back must get distinct, sequential IDs.
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Standard", requester_id="EMP002")
    )
    a = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="First task", seq=1,
            responsible_role="hr", requester_id="EMP002",
        ),
    )
    b = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Second task", seq=2,
            responsible_role="hr", requester_id="EMP002",
        ),
    )
    assert a.task_id != b.task_id


def test_add_task_with_invalid_role_raises(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Standard", requester_id="EMP002")
    )
    with pytest.raises(service.InvalidResponsibleRole):
        service.add_task_to_template(
            db,
            OnboardingTaskCreate(
                template_id=template.template_id, name="Bad task", seq=1,
                responsible_role="xyz", requester_id="EMP002",
            ),
        )


def test_add_task_with_negative_expected_days_raises(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Standard", requester_id="EMP002")
    )
    with pytest.raises(service.InvalidExpectedDays):
        service.add_task_to_template(
            db,
            OnboardingTaskCreate(
                template_id=template.template_id, name="Bad task", seq=1,
                responsible_role="hr", expected_days=-3, requester_id="EMP002",
            ),
        )


# --- instance creation and progress tracking ---

def test_create_instance_requires_valid_template(db):
    with pytest.raises(service.TemplateNotFound):
        service.create_instance(
            db, OnboardingInstanceCreate(employee_id="EMP001", template_id="NOPE", requester_id="EMP002")
        )


def test_create_instance_for_exited_employee_raises(db):
    ids = _make_template_with_tasks(db)
    db.query(Employee).filter(Employee.employee_id == "EMP001").update(
        {"employment_status": "exited"}
    )
    db.commit()
    with pytest.raises(service.EmployeeExitedForOnboarding):
        service.create_instance(
            db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
        )


def test_create_instance_without_join_date_raises(db):

    ids = _make_template_with_tasks(db)
    db.query(Employee).filter(Employee.employee_id == "EMP001").update(
        {"join_date": None}
    )
    db.commit()
    with pytest.raises(service.MissingJoinDate):
        service.create_instance(
            db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
        )


def test_create_instance(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    assert service.get_completion_pct(db, instance.instance_id) == 0.0


def test_create_instance_by_non_admin_raises(db):
    ids = _make_template_with_tasks(db)
    with pytest.raises(service.NotAuthorized):
        service.create_instance(
            db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP005")
        )


def test_create_instance_by_hr_raises(db):
    ids = _make_template_with_tasks(db)
    with pytest.raises(service.NotAuthorized):
        service.create_instance(
            db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP003")
        )


# --- an employee may only ever look up their own instance, never another's ---

def test_get_instance_for_employee_self_succeeds(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    found = service.get_instance_for_employee(db, "EMP001", requester_id="EMP001")
    assert found.instance_id == instance.instance_id


def test_get_instance_for_employee_by_unrelated_employee_raises(db):
    ids = _make_template_with_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    # EMP005 is a plain Employee, not EMP001 - must be rejected.
    with pytest.raises(service.NotAuthorized):
        service.get_instance_for_employee(db, "EMP001", requester_id="EMP005")


def test_get_instance_for_employee_by_admin_succeeds(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    found = service.get_instance_for_employee(db, "EMP001", requester_id="EMP002")
    assert found.instance_id == instance.instance_id


# --- only the correct responsible party may complete a task ---

def test_complete_hr_task_by_hr_succeeds(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["hr"], completed_by="EMP003")
    )
    assert completion.completed_by == "EMP003"


def test_complete_hr_task_by_unrelated_employee_raises(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["hr"], completed_by="EMP005")
        )


def test_exited_admin_cannot_complete_it_task(db):
    db.add(Employee(employee_id="EMP006", name="Exited Admin", access_tier="Admin/Leadership", employment_status="exited"))
    db.commit()
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["it"], completed_by="EMP006")
        )


def test_complete_it_task_requires_admin(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["it"], completed_by="EMP003")
        )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["it"], completed_by="EMP002")
    )
    assert completion.completed_by == "EMP002"


def test_complete_new_joiner_task_requires_that_specific_employee(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["new_joiner"], completed_by="EMP005")
        )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["new_joiner"], completed_by="EMP001")
    )
    assert completion.completed_by == "EMP001"


def test_complete_manager_task_requires_manager_tier(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    with pytest.raises(service.NotAuthorized):
        service.complete_task(
            db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["manager"], completed_by="EMP005")
        )
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["manager"], completed_by="EMP004")
    )
    assert completion.completed_by == "EMP004"


def test_complete_task_updates_completion_pct(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["hr"], completed_by="EMP003")
    )
    assert service.get_completion_pct(db, instance.instance_id) == 25.0


def test_overdue_task_is_flagged(db):
    # FR-ONB-04: "flag overdue tasks past an expected completion window."
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Overdue Test", requester_id="EMP002")
    )
    task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Overdue task", seq=1,
            responsible_role="hr", expected_days=0, requester_id="EMP002",
        ),
    )
    # Instance built directly via the model, bypassing service.create_instance,
    # so start_date can be controlled precisely - a plain literal instance_id
    # is fine here since it never goes through auto-generation.
    instance = OnboardingInstance(
        instance_id="OI_OD", employee_id="EMP001", template_id=template.template_id,
        start_date=datetime.date.today() - datetime.timedelta(days=5),
    )
    db.add(instance)
    db.commit()
    assert service.get_overdue_task_ids(db, "OI_OD") == [task.task_id]


def test_task_with_no_expected_days_is_never_overdue(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="No Deadline", requester_id="EMP002")
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="No deadline task", seq=1,
            responsible_role="hr", requester_id="EMP002",
        ),
    )
    instance = OnboardingInstance(
        instance_id="OI_OD2", employee_id="EMP001", template_id=template.template_id,
        start_date=datetime.date.today() - datetime.timedelta(days=365),
    )
    db.add(instance)
    db.commit()
    assert service.get_overdue_task_ids(db, "OI_OD2") == []


def test_completed_overdue_task_is_not_flagged(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Done Overdue", requester_id="EMP002")
    )
    task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Overdue but done", seq=1,
            responsible_role="hr", expected_days=0, requester_id="EMP002",
        ),
    )
    instance = OnboardingInstance(
        instance_id="OI_OD3", employee_id="EMP001", template_id=template.template_id,
        start_date=datetime.date.today() - datetime.timedelta(days=5),
    )
    db.add(instance)
    db.commit()
    service.complete_task(
        db, TaskCompletionCreate(instance_id="OI_OD3", task_id=task.task_id, completed_by="EMP003")
    )
    assert service.get_overdue_task_ids(db, "OI_OD3") == []


def test_complete_task_missing_instance_raises(db):
    ids = _make_template_with_tasks(db)
    with pytest.raises(service.InstanceNotFound):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="DOES_NOT_EXIST", task_id=ids["hr"], completed_by="EMP003")
        )


def test_cohort_view_by_admin_succeeds(db):
    # "Admin/HR shall have a cohort view showing all current
    # joiners' onboarding progress side by side."
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    cohort = service.list_instances_for_cohort(db, "EMP002")
    instance_ids = [row["instance_id"] for row in cohort]
    assert instance.instance_id in instance_ids


def test_cohort_view_by_non_admin_raises(db):
    _make_template_with_tasks(db)
    with pytest.raises(service.NotAuthorized):
        service.list_instances_for_cohort(db, "EMP001")


def test_completion_details_includes_timestamp(db):
    ids = _make_template_with_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=ids["template_id"], requester_id="EMP002")
    )
    service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=ids["hr"], completed_by="EMP003")
    )
    details = service.get_completion_details(db, instance.instance_id)
    assert len(details) == 1
    assert details[0].task_id == ids["hr"]
    assert details[0].completed_by == "EMP003"
    assert details[0].completed_at is not None


def test_task_requiring_document_blocks_completion_without_it(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Doc Required", requester_id="EMP002")
    )
    task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Upload ID proof", seq=1,
            responsible_role="new_joiner", required_doc_type="id_proof", requester_id="EMP002",
        ),
    )
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=template.template_id, requester_id="EMP002")
    )
    with pytest.raises(service.RequiredDocumentMissing):
        service.complete_task(
            db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=task.task_id, completed_by="EMP001")
        )


def test_task_requiring_document_succeeds_once_uploaded(db):
    template = service.create_template(
        db, OnboardingTemplateCreate(name="Doc Required 2", requester_id="EMP002")
    )
    task = service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            template_id=template.template_id, name="Upload ID proof", seq=1,
            responsible_role="new_joiner", required_doc_type="id_proof", requester_id="EMP002",
        ),
    )
    instance = service.create_instance(
        db, OnboardingInstanceCreate(employee_id="EMP001", template_id=template.template_id, requester_id="EMP002")
    )
    db.add(EmployeeDocument(
        document_id="D_TEST", employee_id="EMP001", uploaded_by="EMP001", doc_type="id_proof",
    ))
    db.commit()
    completion = service.complete_task(
        db, TaskCompletionCreate(instance_id=instance.instance_id, task_id=task.task_id, completed_by="EMP001")
    )
    assert completion.task_id == task.task_id