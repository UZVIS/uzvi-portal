import datetime

from sqlalchemy.orm import Session

from app.modules.onboarding.models import OnboardingInstance, OnboardingTaskCompletion
from app.modules.onboarding.schemas import OnboardingInstanceCreate, TaskCompletionCreate


class InstanceAlreadyExists(Exception):
    pass


class InstanceNotFound(Exception):
    pass


def create_instance(db: Session, instance_in: OnboardingInstanceCreate) -> OnboardingInstance:
    existing = get_instance(db, instance_in.instance_id)
    if existing:
        raise InstanceAlreadyExists(instance_in.instance_id)

    new_instance = OnboardingInstance(**instance_in.model_dump())
    db.add(new_instance)
    db.commit()
    db.refresh(new_instance)
    return new_instance


def get_instance(db: Session, instance_id: str) -> OnboardingInstance | None:
    return (
        db.query(OnboardingInstance)
        .filter(OnboardingInstance.instance_id == instance_id)
        .first()
    )


def complete_task(db: Session, task_in: TaskCompletionCreate) -> OnboardingTaskCompletion:
    instance = get_instance(db, task_in.instance_id)
    if not instance:
        raise InstanceNotFound(task_in.instance_id)

    new_completion = OnboardingTaskCompletion(
        **task_in.model_dump(),
        is_completed=True,
        completed_at=datetime.datetime.utcnow(),
    )
    db.add(new_completion)
    db.flush()  

    _recalculate_completion_pct(db, instance)

    db.commit()
    db.refresh(new_completion)
    return new_completion


def _recalculate_completion_pct(db: Session, instance: OnboardingInstance) -> None:
    total = (
        db.query(OnboardingTaskCompletion)
        .filter(OnboardingTaskCompletion.instance_id == instance.instance_id)
        .count()
    )
    if total == 0:
        instance.completion_pct = 0.0
        return

    done = (
        db.query(OnboardingTaskCompletion)
        .filter(
            OnboardingTaskCompletion.instance_id == instance.instance_id,
            OnboardingTaskCompletion.is_completed.is_(True),
        )
        .count()
    )
    instance.completion_pct = round((done / total) * 100, 2)
