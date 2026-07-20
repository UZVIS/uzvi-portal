from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class ReviewCycle(Base):
    __tablename__ = "review_cycles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    goals = relationship("Goal", back_populates="cycle", cascade="all, delete-orphan")


class GoalStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SELF_SUBMITTED = "self_submitted"
    MANAGER_REVIEWED = "manager_reviewed"
    COMPLETED = "completed"


class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.employee_id"), nullable=False, index=True)
    cycle_id = Column(Integer, ForeignKey("review_cycles.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    target_outcome = Column(Text, nullable=True)
    status = Column(Enum(GoalStatus), default=GoalStatus.NOT_STARTED)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    
    employee = relationship("Employee", backref="goals")
    cycle = relationship("ReviewCycle", back_populates="goals")
    self_assessment = relationship("SelfAssessment", back_populates="goal", uselist=False, cascade="all, delete-orphan")
    manager_review = relationship("ManagerReview", back_populates="goal", uselist=False, cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_goals_employee_cycle', 'employee_id', 'cycle_id'),
        Index('idx_goals_status', 'status'),
    )


class SelfAssessment(Base):
    __tablename__ = "self_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False, unique=True, index=True)
    assessment_text = Column(Text, nullable=False)
    submitted_at = Column(DateTime, server_default=func.now())
    
    goal = relationship("Goal", back_populates="self_assessment")
    
    __table_args__ = (
        Index('idx_self_assessment_goal', 'goal_id'),
    )


class ManagerReview(Base):
    __tablename__ = "manager_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False, unique=True, index=True)
    reviewer_id = Column(String(50), ForeignKey("employees.employee_id"), nullable=False, index=True)
    rating = Column(Float, nullable=False)
    review_text = Column(Text, nullable=True)
    submitted_at = Column(DateTime, server_default=func.now())
    
    goal = relationship("Goal", back_populates="manager_review")
    reviewer = relationship("Employee", foreign_keys=[reviewer_id])
    
    __table_args__ = (
        Index('idx_manager_review_goal', 'goal_id'),
    )