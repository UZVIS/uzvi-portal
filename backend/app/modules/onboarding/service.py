
import datetime

from sqlalchemy.orm import Session

from app.modules.directory.models import Employee
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


class EmployeeNotFoundForOnboarding(Exception):
    pass


class InstanceNotFound(Exception):
    pass


class TaskNotFound(Exception):
    pass


class NotAuthorized(Exception):
    pass


def _get_employee(db: Session, employee_id: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()


def list_templates(db: Session) -> list[OnboardingTemplate]:
    return db.query(OnboardingTemplate).all()


def list_tasks_for_template(db: Session, template_id: str) -> list[OnboardingTask]:
    return (
        db.query(OnboardingTask)
        .filter(OnboardingTask.template_id == template_id)
        .order_by(OnboardingTask.seq)
        .all()
    )


def create_template(db: Session, template_in: OnboardingTemplateCreate) -> OnboardingTemplate:
    # Admin shall define an onboarding checklist template.
    requester = _get_employee(db, template_in.requester_id)
    if requester is None or requester.access_tier != "Admin/Leadership":
        raise NotAuthorized("Only Admin/Leadership may define onboarding templates.")

    existing = (
        db.query(OnboardingTemplate)
        .filter(OnboardingTemplate.template_id == template_in.template_id)
        .first()
    )
    if existing:
        raise TemplateAlreadyExists(template_in.template_id)

    new_template = OnboardingTemplate(
        template_id=template_in.template_id, name=template_in.name
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template


def add_task_to_template(db: Session, task_in: OnboardingTaskCreate) -> OnboardingTask:
    # task composition is part of defining the template - Admin only.
    requester = _get_employee(db, task_in.requester_id)
    if requester is None or requester.access_tier != "Admin/Leadership":
        raise NotAuthorized("Only Admin/Leadership may add tasks to a template.")

    template = (
        db.query(OnboardingTemplate)
        .filter(OnboardingTemplate.template_id == task_in.template_id)
        .first()
    )
    if not template:
        raise TemplateNotFound(task_in.template_id)

    new_task = OnboardingTask(
        task_id=task_in.task_id,
        template_id=task_in.template_id,
        name=task_in.name,
        seq=task_in.seq,
        responsible_role=task_in.responsible_role,
        expected_days=task_in.expected_days,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


def create_instance(db: Session, instance_in: OnboardingInstanceCreate) -> OnboardingInstance:
   
    requester = _get_employee(db, instance_in.requester_id)
    if requester is None or requester.access_tier not in ("Admin/Leadership", "HR-Restricted"):
        raise NotAuthorized("Only Admin/Leadership or HR-Restricted may start an onboarding instance.")

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

    employee = (
        db.query(Employee)
        .filter(Employee.employee_id == instance_in.employee_id)
        .first()
    )
    if not employee:
        raise EmployeeNotFoundForOnboarding(instance_in.employee_id)

    # FR-ONB-02: "assigned a checklist instance on their join date" - use
    # the employee's real Directory join_date, falling back to today only
    # if it was never set (join_date is optional in Directory).
    start_date = employee.join_date or datetime.date.today()

    new_instance = OnboardingInstance(
        instance_id=instance_in.instance_id,
        employee_id=instance_in.employee_id,
        template_id=instance_in.template_id,
        start_date=start_date,
    )
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


def _authorize_completion(
    db: Session, instance: OnboardingInstance, task: OnboardingTask, completed_by: str
) -> None:
    # "responsible party (new joiner, HR, IT, or manager,
    # depending on task type)". IT has no dedicated tier in Section 3's
    # role model - confirmed with Dhruva: IT tasks are Admin/Leadership only.
    completer = _get_employee(db, completed_by)
    if completer is None:
        raise NotAuthorized("Unknown completer.")

    role = task.responsible_role
    if role == "new_joiner":
        authorized = completed_by == instance.employee_id
    elif role == "hr":
        authorized = completer.access_tier == "HR-Restricted"
    elif role == "manager":
        authorized = completer.access_tier == "Manager"
    elif role == "it":
        authorized = completer.access_tier == "Admin/Leadership"
    else:
        authorized = False

    if not authorized:
        raise NotAuthorized(f"Only the {role} responsible party may complete this task.")


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

    _authorize_completion(db, instance, task, task_in.completed_by)

    new_completion = TaskCompletion(
        **task_in.model_dump(),
        completed_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(new_completion)
    db.commit()
    db.refresh(new_completion)
    return new_completion


def get_completion_pct(db: Session, instance_id: str) -> float:
    # completion % is computed on read, not stored, since it's
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


def get_completed_task_ids(db: Session, instance_id: str) -> list[str]:
    # lets a looked-up instance show real per-task checkmarks
    # instead of "unknown" - purely additive, read-only, no schema change.
    instance = get_instance(db, instance_id)
    if not instance:
        raise InstanceNotFound(instance_id)

    rows = (
        db.query(TaskCompletion.task_id)
        .filter(TaskCompletion.instance_id == instance_id)
        .distinct()
        .all()
    )
    return [row[0] for row in rows]


def get_overdue_task_ids(db: Session, instance_id: str) -> list[str]:
    # "flag overdue tasks past an expected completion window."
    # A task is overdue if it has an expected_days value, that many days
    # have passed since start_date, and it isn't completed yet. Tasks with
    # no expected_days set have no overdue concept and are never flagged.
    instance = get_instance(db, instance_id)
    if not instance:
        raise InstanceNotFound(instance_id)

    tasks = (
        db.query(OnboardingTask)
        .filter(
            OnboardingTask.template_id == instance.template_id,
            OnboardingTask.expected_days.isnot(None),
        )
        .all()
    )
    if not tasks:
        return []

    completed_ids = set(get_completed_task_ids(db, instance_id))
    today = datetime.date.today()

    overdue = []
    for task in tasks:
        if task.task_id in completed_ids:
            continue
        deadline = instance.start_date + datetime.timedelta(days=task.expected_days)
        if today > deadline:
            overdue.append(task.task_id)
    return overdue


def list_instances_for_cohort(db: Session, requester_id: str) -> list[dict]:
    # "Admin/HR shall have a cohort view showing all current
    # joiners' onboarding progress side by side."
    requester = _get_employee(db, requester_id)
    if requester is None or requester.access_tier not in ("Admin/Leadership", "HR-Restricted"):
        raise NotAuthorized("Only Admin/Leadership or HR-Restricted may view the cohort.")

    instances = db.query(OnboardingInstance).all()
    result = []
    for instance in instances:
        employee = _get_employee(db, instance.employee_id)
        result.append({
            "instance_id": instance.instance_id,
            "employee_id": instance.employee_id,
            "employee_name": employee.name if employee else instance.employee_id,
            "template_id": instance.template_id,
            "start_date": instance.start_date,
            "completion_pct": get_completion_pct(db, instance.instance_id),
            "has_overdue_tasks": len(get_overdue_task_ids(db, instance.instance_id)) > 0,
        })
    return result
