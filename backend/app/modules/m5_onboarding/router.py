from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import os

from app.modules.m5_onboarding.models import (
    OnboardingInstance,
    OnboardingTaskCompletion,
)
from app.modules.m5_onboarding.schemas import (
    OnboardingInstanceCreate,
    OnboardingInstanceResponse,
    TaskCompletionCreate,
)


def get_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    database_url = os.getenv("DATABASE_URL", "sqlite:///uzvi_portal.db")
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(
    prefix="/api/v1/onboarding", tags=["M5 Onboarding Progress Operations"]
)


@router.post("/instances", response_model=OnboardingInstanceResponse, status_code=201)
def start_onboarding_pipeline(
    instance_in: OnboardingInstanceCreate, db: Session = Depends(get_db)
):
    existing = (
        db.query(OnboardingInstance)
        .filter(OnboardingInstance.instance_id == instance_in.instance_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Onboarding tracker instance ID already active."
        )

    new_instance = OnboardingInstance(**instance_in.model_dump())
    db.add(new_instance)
    db.commit()
    db.refresh(new_instance)
    return new_instance


@router.post("/completions", status_code=201)
def complete_onboarding_task(
    task_in: TaskCompletionCreate, db: Session = Depends(get_db)
):
    instance = (
        db.query(OnboardingInstance)
        .filter(OnboardingInstance.instance_id == task_in.instance_id)
        .first()
    )
    if not instance:
        raise HTTPException(
            status_code=404, detail="Parent onboarding instance tracker not found."
        )

    new_completion = OnboardingTaskCompletion(**task_in.model_dump())
    db.add(new_completion)
    db.commit()

    return {
        "message": f"Task '{task_in.task_id}' marked complete for onboarding tracker '{task_in.instance_id}'."
    }
