from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.onboarding import service
from app.modules.onboarding.schemas import (
    OnboardingTemplateCreate,
    OnboardingTemplateResponse,
    OnboardingTaskCreate,
    OnboardingTaskResponse,
    OnboardingInstanceCreate,
    OnboardingInstanceResponse,
    OnboardingProgressResponse,
    TaskCompletionCreate,
    TaskCompletionResponse,
)

router = APIRouter(prefix="/api/v1/onboarding", tags=["M5 Onboarding"])


@router.get("/templates", response_model=List[OnboardingTemplateResponse])
def list_onboarding_templates(db: Session = Depends(get_db)):
    return service.list_templates(db)


@router.get("/templates/{template_id}/tasks", response_model=List[OnboardingTaskResponse])
def list_tasks_for_template(template_id: str, db: Session = Depends(get_db)):
    return service.list_tasks_for_template(db, template_id)


@router.post("/templates", response_model=OnboardingTemplateResponse, status_code=201)
def create_onboarding_template(
    template_in: OnboardingTemplateCreate, db: Session = Depends(get_db)
):
    try:
        return service.create_template(db, template_in)
    except service.TemplateAlreadyExists:
        raise HTTPException(status_code=400, detail="Template ID already exists.")
    except service.NotAuthorized as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/tasks", response_model=OnboardingTaskResponse, status_code=201)
def add_task_to_template(task_in: OnboardingTaskCreate, db: Session = Depends(get_db)):
    try:
        return service.add_task_to_template(db, task_in)
    except service.TemplateNotFound:
        raise HTTPException(status_code=404, detail="Parent template not found.")
    except service.TaskAlreadyExists as e:
        raise HTTPException(status_code=400, detail=f"Task ID '{e}' already exists — please choose a different one.")
    except service.NotAuthorized as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/instances", response_model=OnboardingInstanceResponse, status_code=201)
def start_onboarding_pipeline(
    instance_in: OnboardingInstanceCreate, db: Session = Depends(get_db)
):
    try:
        return service.create_instance(db, instance_in)
    except service.InstanceAlreadyExists:
        raise HTTPException(status_code=400, detail="Onboarding instance ID already exists.")
    except service.TemplateNotFound:
        raise HTTPException(status_code=404, detail="Referenced template not found.")
    except service.EmployeeNotFoundForOnboarding:
        raise HTTPException(status_code=404, detail="Referenced employee not found.")
    except service.NotAuthorized as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/instances/{instance_id}", response_model=OnboardingInstanceResponse)
def get_onboarding_instance(instance_id: str, db: Session = Depends(get_db)):
    instance = service.get_instance(db, instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Onboarding instance not found.")
    return instance


@router.get("/instances/{instance_id}/progress", response_model=OnboardingProgressResponse)
def get_onboarding_progress(instance_id: str, db: Session = Depends(get_db)):
    try:
        pct = service.get_completion_pct(db, instance_id)
    except service.InstanceNotFound:
        raise HTTPException(status_code=404, detail="Onboarding instance not found.")
    return {"instance_id": instance_id, "completion_pct": pct}


@router.get("/instances/{instance_id}/completions")
def get_onboarding_completions(instance_id: str, db: Session = Depends(get_db)):
    try:
        task_ids = service.get_completed_task_ids(db, instance_id)
    except service.InstanceNotFound:
        raise HTTPException(status_code=404, detail="Onboarding instance not found.")
    return {"instance_id": instance_id, "completed_task_ids": task_ids}


@router.get("/instances/{instance_id}/completion-details", response_model=List[TaskCompletionResponse])
def get_onboarding_completion_details(instance_id: str, db: Session = Depends(get_db)):
    try:
        return service.get_completion_details(db, instance_id)
    except service.InstanceNotFound:
        raise HTTPException(status_code=404, detail="Onboarding instance not found.")


@router.get("/instances/{instance_id}/overdue")
def get_onboarding_overdue(instance_id: str, db: Session = Depends(get_db)):
    try:
        task_ids = service.get_overdue_task_ids(db, instance_id)
    except service.InstanceNotFound:
        raise HTTPException(status_code=404, detail="Onboarding instance not found.")
    return {"instance_id": instance_id, "overdue_task_ids": task_ids}


@router.get("/cohort")
def get_onboarding_cohort(requester_id: str, db: Session = Depends(get_db)):
    try:
        return service.list_instances_for_cohort(db, requester_id)
    except service.NotAuthorized as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/completions", response_model=TaskCompletionResponse, status_code=201)
def complete_onboarding_task(task_in: TaskCompletionCreate, db: Session = Depends(get_db)):
    try:
        return service.complete_task(db, task_in)
    except service.InstanceNotFound:
        raise HTTPException(status_code=404, detail="Parent onboarding instance not found.")
    except service.TaskNotFound:
        raise HTTPException(status_code=404, detail="Referenced template task not found.")
    except service.RequiredDocumentMissing as e:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot complete this task: no {e.doc_type} document found for this employee. Please upload it first.",
        )
    except service.NotAuthorized as e:
        raise HTTPException(status_code=403, detail=str(e))
