from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional


class OnboardingTemplateBase(BaseModel):
    name: str = Field(..., description="Template name, e.g. 'Standard Consultant Onboarding'")


class OnboardingTemplateCreate(OnboardingTemplateBase):
    template_id: str = Field(..., description="Primary unique template identifier")


class OnboardingTemplateResponse(OnboardingTemplateBase):
    template_id: str

    model_config = ConfigDict(from_attributes=True)


class OnboardingTaskBase(BaseModel):
    template_id: str = Field(..., description="Parent template this task belongs to")
    name: str = Field(..., description="Task name, e.g. 'Collect ID proof'")
    seq: int = Field(..., description="Ordering position within the template")
    responsible_role: str = Field(
        ..., description="Who completes this task: new_joiner / hr / it / manager"
    )


class OnboardingTaskCreate(OnboardingTaskBase):
    task_id: str = Field(..., description="Primary unique task identifier")


class OnboardingTaskResponse(OnboardingTaskBase):
    task_id: str

    model_config = ConfigDict(from_attributes=True)


class OnboardingInstanceBase(BaseModel):
    employee_id: str = Field(..., description="Target employee tied to this checklist")
    template_id: str = Field(..., description="Which template this instance is built from")


class OnboardingInstanceCreate(OnboardingInstanceBase):
    instance_id: str = Field(..., description="Primary unique instance identifier")


class OnboardingInstanceResponse(OnboardingInstanceBase):
    instance_id: str
    start_date: date

    model_config = ConfigDict(from_attributes=True)


class OnboardingProgressResponse(BaseModel):
    instance_id: str
    completion_pct: float


class TaskCompletionCreate(BaseModel):
    instance_id: str = Field(..., description="The parent onboarding instance ID")
    task_id: str = Field(..., description="Which template task was completed")
    completed_by: Optional[str] = Field(
        None, description="Employee ID of whoever completed the task"
    )


class TaskCompletionResponse(BaseModel):
    id: int
    instance_id: str
    task_id: str
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
