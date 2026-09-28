from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TrainingUnitCreate(BaseModel):
    name: str
    # A unit's position in its program - 0 or negative has no sensible
    # meaning here, so the lower bound is enforced the same way score's is.
    sequence: int = Field(ge=1)


class TrainingUnitUpdate(BaseModel):
    # Both optional - admin can fix just the name, just the order, or both
    # in one call. At least one should be set, but sending neither is a
    # harmless no-op rather than an error.
    name: Optional[str] = None
    sequence: Optional[int] = Field(default=None, ge=1)


class TrainingUnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    unit_id: int
    program_id: int
    name: str
    sequence: int


class TrainingProgramCreate(BaseModel):
    name: str


class TrainingProgramOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    program_id: int
    name: str
    units: list[TrainingUnitOut] = []


class EnrollmentCreate(BaseModel):
    program_id: int
    # Only Admin/Leadership may set this to someone other than themselves;
    # enforced in service.enroll_employee, never trusted from the client alone.
    employee_id: Optional[str] = None


class UnitCompletionCreate(BaseModel):
    # FR-LMS-02 / FR-LMS-04: optional assessment score, 0-100.
    score: Optional[int] = Field(default=None, ge=0, le=100)


class UnitCompletionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    completion_id: int
    enrollment_id: int
    unit_id: int
    completed_at: datetime
    score: Optional[int] = None


class EnrollmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    enrollment_id: int
    employee_id: str
    employee_name: Optional[str] = None
    program_id: int
    enrolled_at: datetime
    total_units: int
    completed_units: int
    completion_pct: float
    completions: list[UnitCompletionOut] = []


class CohortEmployeeProgress(BaseModel):
    employee_id: str
    employee_name: Optional[str] = None
    total_units: int
    completed_units: int
    completion_pct: float
    flagged_behind: bool


class CohortProgressOut(BaseModel):
    program_id: int
    program_name: str
    total_units: int
    median_completion_pct: float
    employees: list[CohortEmployeeProgress]
