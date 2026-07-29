from datetime import datetime

from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(String, primary_key=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    resume_details = Column(Text, nullable=True)
    applied_role = Column(String, nullable=False)
    source = Column(String, nullable=True)
    stage = Column(String, default="Applied", nullable=False)

    # FR-REC-05 / ER diagram cross-module FK: on hire, converts into an Employee (M0) record
    converted_emp_id = Column(
        String, ForeignKey("employees.employee_id"), nullable=True
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    interview_stages = relationship(
        "InterviewStage",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="InterviewStage.timestamp",
    )
    converted_employee = relationship("Employee")


class InterviewStage(Base):
    __tablename__ = "interview_stages"

    stage_id = Column(String, primary_key=True, index=True, nullable=False)
    candidate_id = Column(
        String, ForeignKey("candidates.candidate_id"), nullable=False
    )
    stage_name = Column(String, nullable=False)
    interviewer_id = Column(
        String, ForeignKey("employees.employee_id"), nullable=True
    )
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    candidate = relationship("Candidate", back_populates="interview_stages")
    interviewer = relationship("Employee")
    scorecards = relationship(
        "Scorecard", back_populates="stage", cascade="all, delete-orphan"
    )


class Scorecard(Base):
    __tablename__ = "scorecards"

    scorecard_id = Column(String, primary_key=True, index=True, nullable=False)
    stage_id = Column(
        String, ForeignKey("interview_stages.stage_id"), nullable=False
    )
    # FR-REC-03: questions tied to resume content + behavioral questions grounded in real projects
    questions = Column(Text, nullable=True)
    score = Column(Float, nullable=True)

    stage = relationship("InterviewStage", back_populates="scorecards")