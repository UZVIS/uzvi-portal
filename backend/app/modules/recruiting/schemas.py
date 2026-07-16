from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------- Scorecard ----------

class ScorecardBase(BaseModel):
    questions: Optional[str] = Field(
        None, description="Interview questions tied to resume content / behavioral questions"
    )
    score: Optional[float] = Field(None, description="Score awarded at this interview stage")


class ScorecardCreate(ScorecardBase):
    scorecard_id: str = Field(..., description="Primary unique scorecard identifier")


class ScorecardResponse(ScorecardBase):
    scorecard_id: str
    stage_id: str

    model_config = ConfigDict(from_attributes=True)


# ---------- Interview Stage ----------

class InterviewStageBase(BaseModel):
    stage_name: str = Field(
        ..., description="e.g. Screened, Technical Round 1, Offer"
    )
    interviewer_id: Optional[str] = Field(None, description="Employee ID of the interviewer")
    notes: Optional[str] = Field(None, description="Interviewer notes for this stage")


class InterviewStageCreate(InterviewStageBase):
    stage_id: str = Field(..., description="Primary unique interview stage identifier")


class InterviewStageResponse(InterviewStageBase):
    stage_id: str
    candidate_id: str
    timestamp: datetime
    scorecards: list[ScorecardResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ---------- Candidate ----------

class CandidateBase(BaseModel):
    name: str = Field(..., description="Candidate full name")
    resume_details: Optional[str] = Field(
        None, description="Resume details/summary used for FR-REC-03/04"
    )
    applied_role: str = Field(..., description="Role applied for")
    source: Optional[str] = Field(None, description="Sourcing channel")


class CandidateCreate(CandidateBase):
    candidate_id: str = Field(..., description="Primary unique candidate identifier")


class CandidateStageUpdate(BaseModel):
    stage: str = Field(
        ..., description="Applied | Screened | Interview | Offer | Hired | Rejected"
    )


class CandidateResponse(CandidateBase):
    candidate_id: str
    stage: str
    converted_emp_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateDetailResponse(CandidateResponse):
    interview_stages: list[InterviewStageResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ---------- FR-REC-04: duplicate detection ----------

class DuplicateFlag(BaseModel):
    candidate_id: str
    other_candidate_id: str
    similarity: float


# ---------- FR-REC-06: funnel stats ----------

class FunnelStageCount(BaseModel):
    stage: str
    count: int


class FunnelStats(BaseModel):
    by_stage: list[FunnelStageCount]
    by_role: dict[str, int]
    by_source: dict[str, int]


# ---------- FR-REC-05: hire conversion ----------

class HireConversionRequest(BaseModel):
    employee_id: str = Field(..., description="New Employee Directory (M0) ID to create")
    designation: Optional[str] = Field(
        None, description="Defaults to the candidate's applied_role if omitted"
    )
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    join_date: Optional[date] = None