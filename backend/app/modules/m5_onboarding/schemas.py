from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime


class OnboardingInstanceBase(BaseModel):
    employee_id: str = Field(..., description="Target employee tied to this checklist")
    template_name: str = Field(default="Standard Engineering Onboarding Blueprint")


class OnboardingInstanceCreate(OnboardingInstanceBase):
    instance_id: str = Field(
        ..., description="Primary unique instance identifier tracking string"
    )


class OnboardingInstanceResponse(OnboardingInstanceBase):
    instance_id: str
    current_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskCompletionCreate(BaseModel):
    task_id: str = Field(
        ..., description="The unique step ID from the roadmap template"
    )
    instance_id: str = Field(
        ..., description="The parenting tracking pipeline instance ID"
    )
    completed_by: str = Field(
        ..., description="The HR admin or manager verifying completion"
    )
