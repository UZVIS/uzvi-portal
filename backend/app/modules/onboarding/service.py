
import datetime

from sqlalchemy.orm import Session

from app.modules.onboarding.models import (
    OnboardingTemplate,
    OnboardingTask,
    OnboardingInstance,
    TaskCompletion,
)
from app.modules.onboarding.schemas import (
    OnboardingTemplateCreate,
    OnboardingTaskCreate,
    OnboardingInstanceCreate,
    TaskCompletionCreate,
)


class TemplateAlreadyExists(Exception):
    pass


class TemplateNotFound(Exception):
    pass


class InstanceAlreadyExists(Exception):
    pass


class InstanceNotFound(Exception):
    pass


class TaskNotFound(Exception):
    pass


def create_template(db: Session, template_in: OnboardingTemplateCreate) -> OnboardingTemplate:
    existing = (
        db.query(OnboardingTemplate)
        .filter(OnboardingTemplate.template_id == template_in.template_id)
        .first()
    )
    if existing:
        raise TemplateAlreadyExists(template_in.template_id)

    new_template = OnboardingTemplate(**template_in.model_dump())
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template


def add_task_to_template(db: Session, task_in: OnboardingTaskCreate) -> OnboardingTask:
    template = (
        db.query(OnboardingTemplate)
        .filter(OnboardingTemplate.template_id == task_in.template_id)
        .first()
    )
    if not template:
        raise TemplateNotFound(task_in.template_id)

    new_task = OnboardingTask(**task_in.model_dump())
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def create_instance(db: Session, instance_in: OnboardingInstanceCreate) -> OnboardingInstance:
    existing = get_instance(db, instance_in.instance_id)
    if existing:
        raise InstanceAlreadyExists(instance_in.instance_id)

    template = (
        db.query(OnboardingTemplate)
        .filter(OnboardingTemplate.template_id == instance_in.template_id)
        .first()
    )
    if not template:
        raise TemplateNotFound(instance_in.template_id)

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


def complete_task(db: Session, task_in: TaskCompletionCreate) -> TaskCompletion:
    instance = get_instance(db, task_in.instance_id)
    if not instance:
        raise InstanceNotFound(task_in.instance_id)

    task = (
        db.query(OnboardingTask)
        .filter(OnboardingTask.task_id == task_in.task_id)
        .first()
    )
    if not task:
        raise TaskNotFound(task_in.task_id)

    new_completion = TaskCompletion(
        **task_in.model_dump(),
        completed_at=datetime.datetime.utcnow(),
    )
    db.add(new_completion)
    db.commit()
    db.refresh(new_completion)
    return new_completion


def get_completion_pct(db: Session, instance_id: str) -> float:
    # FR-ONB-04: completion % is computed on read, not stored, since it's
    # not a column in the ER diagram's OnboardingInstance table.
    instance = get_instance(db, instance_id)
    if not instance:
        raise InstanceNotFound(instance_id)

    total = (
        db.query(OnboardingTask)
        .filter(OnboardingTask.template_id == instance.template_id)
        .count()
    )
    if total == 0:
        return 0.0

    done = (
        db.query(TaskCompletion.task_id)
        .filter(TaskCompletion.instance_id == instance_id)
        .distinct()
        .count()
    )
    return round((done / total) * 100, 2)
