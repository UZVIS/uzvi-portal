from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.onboarding import service
from app.modules.onboarding.schemas import (
    OnboardingInstanceCreate,
    OnboardingInstanceResponse,
    TaskCompletionCreate,
    TaskCompletionResponse,
)

router = APIRouter(prefix="/api/v1/onboarding", tags=["M5 Onboarding"])


@router.post("/instances", response_model=OnboardingInstanceResponse, status_code=201)
def start_onboarding_pipeline(
    instance_in: OnboardingInstanceCreate, db: Session = Depends(get_db)
):
    try:
        return service.create_instance(db, instance_in)
    except service.InstanceAlreadyExists:
        raise HTTPException(status_code=400, detail="Onboarding instance ID already exists.")


@router.get("/instances/{instance_id}", response_model=OnboardingInstanceResponse)
def get_onboarding_instance(instance_id: str, db: Session = Depends(get_db)):
    instance = service.get_instance(db, instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Onboarding instance not found.")
    return instance


@router.post("/completions", response_model=TaskCompletionResponse, status_code=201)
def complete_onboarding_task(task_in: TaskCompletionCreate, db: Session = Depends(get_db)):
    try:
        return service.complete_task(db, task_in)
    except service.InstanceNotFound:
        raise HTTPException(status_code=404, detail="Parent onboarding instance not found.")
