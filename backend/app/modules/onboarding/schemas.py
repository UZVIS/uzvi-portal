from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional


class OnboardingInstanceBase(BaseModel):
    employee_id: str = Field(..., description="Target employee tied to this checklist")


class OnboardingInstanceCreate(OnboardingInstanceBase):
    instance_id: str = Field(
        ..., description="Primary unique instance identifier tracking string"
    )


class OnboardingInstanceResponse(OnboardingInstanceBase):
    instance_id: str
    start_date: date
    completion_pct: float

    model_config = ConfigDict(from_attributes=True)


class TaskCompletionCreate(BaseModel):
    task_id: str = Field(..., description="Unique ID for this task")
    instance_id: str = Field(..., description="The parent onboarding instance ID")
    task_name: str = Field(..., description="Name of the onboarding task")
    responsible_party: str = Field(
        ..., description="Who is responsible: new_joiner / hr / it / manager"
    )
    completed_by: Optional[str] = Field(
        None, description="Employee ID of whoever completed the task"
    )


class TaskCompletionResponse(BaseModel):
    task_id: str
    instance_id: str
    task_name: str
    responsible_party: str
    is_completed: bool
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
