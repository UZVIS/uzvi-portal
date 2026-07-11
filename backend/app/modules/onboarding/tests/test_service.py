import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
import app.modules.directory.models  # noqa: F401 - registers Employee for the FK
from app.modules.directory import service as directory_service
from app.modules.directory.schemas import EmployeeCreate
from app.modules.onboarding import service
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
    directory_service.create_employee(session, EmployeeCreate(employee_id="E001", name="Asha Rao"))
    yield session
    session.close()


def _make_template_with_two_tasks(db):
    service.create_template(db, OnboardingTemplateCreate(template_id="TPL1", name="Standard"))
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="T1", template_id="TPL1", name="Collect ID proof", seq=1, responsible_role="hr"
        ),
    )
    service.add_task_to_template(
        db,
        OnboardingTaskCreate(
            task_id="T2", template_id="TPL1", name="Issue laptop", seq=2, responsible_role="it"
        ),
    )


def test_create_instance_requires_valid_template(db):
    with pytest.raises(service.TemplateNotFound):
        service.create_instance(
            db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="NOPE")
        )


def test_create_instance(db):
    _make_template_with_two_tasks(db)
    instance = service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1")
    )
    assert service.get_completion_pct(db, instance.instance_id) == 0.0


def test_complete_task_updates_completion_pct(db):
    _make_template_with_two_tasks(db)
    service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001", template_id="TPL1")
    )

    service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T1", completed_by="E001")
    )
    assert service.get_completion_pct(db, "OI001") == 50.0

    service.complete_task(
        db, TaskCompletionCreate(instance_id="OI001", task_id="T2", completed_by="E001")
    )
    assert service.get_completion_pct(db, "OI001") == 100.0


def test_complete_task_missing_instance_raises(db):
    _make_template_with_two_tasks(db)
    with pytest.raises(service.InstanceNotFound):
        service.complete_task(
            db, TaskCompletionCreate(instance_id="DOES_NOT_EXIST", task_id="T1")
        )
