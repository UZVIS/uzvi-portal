from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
import datetime

from app.database import Base


class OnboardingInstance(Base):
    __tablename__ = "onboarding_instances"

    instance_id = Column(String, primary_key=True, index=True, nullable=False)
    employee_id = Column(
        String, ForeignKey("employees.employee_id"), unique=True, nullable=False
    )
    start_date = Column(Date, default=datetime.date.today, nullable=False)
    completion_pct = Column(Float, default=0.0, nullable=False)

    employee = relationship("Employee", foreign_keys=[employee_id])
    tasks = relationship(
        "OnboardingTaskCompletion",
        back_populates="instance",
        cascade="all, delete-orphan",
    )


class OnboardingTaskCompletion(Base):
    __tablename__ = "onboarding_task_completions"

    task_id = Column(String, primary_key=True, index=True, nullable=False)
    instance_id = Column(
        String, ForeignKey("onboarding_instances.instance_id"), nullable=False
    )
    task_name = Column(String, nullable=False)
    responsible_party = Column(String, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)

    completed_by = Column(String, ForeignKey("employees.employee_id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)

    instance = relationship("OnboardingInstance", back_populates="tasks")
    completer = relationship("Employee", foreign_keys=[completed_by])
