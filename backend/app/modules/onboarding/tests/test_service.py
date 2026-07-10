import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
import app.modules.directory.models  # noqa: F401 - registers Employee for the FK
from app.modules.directory import service as directory_service
from app.modules.directory.schemas import EmployeeCreate
from app.modules.onboarding import service
from app.modules.onboarding.schemas import OnboardingInstanceCreate, TaskCompletionCreate


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    directory_service.create_employee(session, EmployeeCreate(employee_id="E001", name="Asha Rao"))
    yield session
    session.close()


def test_create_instance(db):
    instance = service.create_instance(
        db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001")
    )
    assert instance.completion_pct == 0.0


def test_complete_task_updates_completion_pct(db):
    service.create_instance(db, OnboardingInstanceCreate(instance_id="OI001", employee_id="E001"))

    service.complete_task(
        db,
        TaskCompletionCreate(
            task_id="T1",
            instance_id="OI001",
            task_name="Collect ID proof",
            responsible_party="hr",
            completed_by="E001",
        ),
    )
    instance = service.get_instance(db, "OI001")
    assert instance.completion_pct == 100.0


def test_complete_task_missing_instance_raises(db):
    with pytest.raises(service.InstanceNotFound):
        service.complete_task(
            db,
            TaskCompletionCreate(
                task_id="T1",
                instance_id="DOES_NOT_EXIST",
                task_name="Collect ID proof",
                responsible_party="hr",
            ),
        )
