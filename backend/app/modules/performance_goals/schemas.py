from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from enum import Enum


class GoalStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SELF_SUBMITTED = "self_submitted"
    MANAGER_REVIEWED = "manager_reviewed"
    COMPLETED = "completed"


# ==================== Review Cycle Schemas ====================

class ReviewCycleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    period_start: datetime
    period_end: datetime


class ReviewCycleCreate(ReviewCycleBase):
    pass


class ReviewCycleResponse(ReviewCycleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ==================== Goal Schemas ====================

class GoalBase(BaseModel):
    description: str = Field(..., min_length=1)
    target_outcome: Optional[str] = None


class GoalCreate(GoalBase):
    cycle_id: int


class GoalUpdate(BaseModel):
    description: Optional[str] = None
    target_outcome: Optional[str] = None
    status: Optional[GoalStatusEnum] = None


class GoalResponse(GoalBase):
    id: int
    employee_id: str
    cycle_id: int
    status: GoalStatusEnum
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


# ==================== Self Assessment Schemas ====================

class SelfAssessmentBase(BaseModel):
    assessment_text: str = Field(..., min_length=1)


class SelfAssessmentCreate(SelfAssessmentBase):
    pass


class SelfAssessmentResponse(SelfAssessmentBase):
    id: int
    goal_id: int
    submitted_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== Manager Review Schemas ====================

class ManagerReviewBase(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: Optional[str] = None


class ManagerReviewCreate(ManagerReviewBase):
    pass


class ManagerReviewResponse(ManagerReviewBase):
    id: int
    goal_id: int
    reviewer_id: str
    submitted_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ==================== Combined Response Schemas ====================

class GoalWithAssessmentsResponse(GoalResponse):
    self_assessment: Optional[SelfAssessmentResponse] = None
    manager_review: Optional[ManagerReviewResponse] = None


# ==================== Status Response Schemas ====================

class ReviewStatusResponse(BaseModel):
    employee_id: str
    employee_name: str
    goals_count: int
    status: GoalStatusEnum
    self_assessment_submitted: bool
    manager_review_completed: bool
    completion_percentage: float = Field(..., ge=0, le=100)


class OrgReviewStatusResponse(BaseModel):
    cycle_id: int
    cycle_name: str
    employees: List[ReviewStatusResponse]
    total_employees: int
    completed_count: int
    pending_self_assessment_count: int
    pending_manager_review_count: int