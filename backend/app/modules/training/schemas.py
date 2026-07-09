from typing import Optional

from pydantic import BaseModel, Field


# -------------------------
# Training Program
# -------------------------

class TrainingProgramCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class TrainingProgramResponse(BaseModel):
    program_id: int
    name: str


# -------------------------
# Training Unit
# -------------------------

class TrainingUnitCreate(BaseModel):
    program_id: int
    name: str = Field(..., min_length=2, max_length=100)
    sequence: int = Field(..., gt=0)


class TrainingUnitResponse(BaseModel):
    unit_id: int
    program_id: int
    name: str
    sequence: int


# -------------------------
# Enrollment
# -------------------------

class EnrollmentCreate(BaseModel):
    employee_id: str
    program_id: int


class EnrollmentResponse(BaseModel):
    enrollment_id: int
    employee_id: str
    program_id: int


# -------------------------
# Unit Completion
# -------------------------

class UnitCompletionCreate(BaseModel):
    enrollment_id: int
    unit_id: int
    score: Optional[float] = None


class UnitCompletionResponse(BaseModel):
    completion_id: int
    enrollment_id: int
    unit_id: int
    score: Optional[float]


# -------------------------
# Progress
# -------------------------

class ProgressResponse(BaseModel):
    employee_id: str
    completed_units: int
    total_units: int
    completion_percentage: float