from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Date, Integer
from sqlalchemy.orm import relationship
import datetime

from app.database import Base


class OnboardingTemplate(Base):
    __tablename__ = "onboarding_templates"

    template_id = Column(String, primary_key=True, index=True, nullable=False)
    name = Column(String, nullable=False)

    tasks = relationship(
        "OnboardingTask", back_populates="template", cascade="all, delete-orphan"
    )
    instances = relationship("OnboardingInstance", back_populates="template")


class OnboardingTask(Base):
    __tablename__ = "onboarding_tasks"

    task_id = Column(String, primary_key=True, index=True, nullable=False)
    template_id = Column(
        String, ForeignKey("onboarding_templates.template_id"), nullable=False
    )
    name = Column(String, nullable=False)
    seq = Column(Integer, nullable=False)
    responsible_role = Column(String, nullable=False)

    template = relationship("OnboardingTemplate", back_populates="tasks")


class OnboardingInstance(Base):
    __tablename__ = "onboarding_instances"

    instance_id = Column(String, primary_key=True, index=True, nullable=False)
    employee_id = Column(
        String, ForeignKey("employees.employee_id"), unique=True, nullable=False
    )
    template_id = Column(
        String, ForeignKey("onboarding_templates.template_id"), nullable=False
    )
    start_date = Column(Date, default=datetime.date.today, nullable=False)

    employee = relationship("Employee", foreign_keys=[employee_id])
    template = relationship("OnboardingTemplate", back_populates="instances")
    completions = relationship(
        "TaskCompletion", back_populates="instance", cascade="all, delete-orphan"
    )


class TaskCompletion(Base):
    __tablename__ = "task_completions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    instance_id = Column(
        String, ForeignKey("onboarding_instances.instance_id"), nullable=False
    )
    task_id = Column(String, ForeignKey("onboarding_tasks.task_id"), nullable=False)
    completed_by = Column(String, ForeignKey("employees.employee_id"), nullable=True)
    completed_at = Column(DateTime, nullable=True)

    instance = relationship("OnboardingInstance", back_populates="completions")
    task = relationship("OnboardingTask")
    completer = relationship("Employee", foreign_keys=[completed_by])
