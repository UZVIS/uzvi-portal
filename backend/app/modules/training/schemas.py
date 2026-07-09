from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# -------------------------
# Training Program
# -------------------------


class TrainingProgramCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class TrainingProgramResponse(BaseModel):
    program_id: int
    name: str

    # Allows Pydantic to create a response from a SQLAlchemy model object.
    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Training Unit
# -------------------------


class TrainingUnitCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    sequence: int = Field(..., gt=0)


class TrainingUnitResponse(BaseModel):
    unit_id: int
    program_id: int
    name: str
    sequence: int

    # Allows conversion from the TrainingUnit SQLAlchemy model.
    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Enrollment
# -------------------------


class EnrollmentCreate(BaseModel):
    employee_id: str = Field(..., min_length=1)
    program_id: int = Field(..., gt=0)


class EnrollmentResponse(BaseModel):
    enrollment_id: int
    employee_id: str
    program_id: int
    enrolled_at: datetime

    # Allows conversion from the Enrollment SQLAlchemy model.
    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Unit Completion
# -------------------------


class UnitCompletionCreate(BaseModel):
    enrollment_id: int = Field(..., gt=0)
    unit_id: int = Field(..., gt=0)
    score: Optional[float] = Field(default=None, ge=0, le=100)


class UnitCompletionResponse(BaseModel):
    completion_id: int
    enrollment_id: int
    unit_id: int
    completed_at: datetime
    score: Optional[float]

    # Allows conversion from the UnitCompletion SQLAlchemy model.
    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Progress
# -------------------------


class ProgressResponse(BaseModel):
    employee_id: str
    completed_units: int
    total_units: int
    completion_percentage: float