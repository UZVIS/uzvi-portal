from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
import datetime

from app.modules.directory.models import Base


# M6 Training Module: Stores training programs available to employees.
class TrainingProgram(Base):
    __tablename__ = "training_programs"

    program_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)

    units = relationship(
        "TrainingUnit",
        back_populates="program",
        cascade="all, delete-orphan",
    )

    enrollments = relationship(
        "Enrollment",
        back_populates="program",
        cascade="all, delete-orphan",
    )


# M6 Training Module: Stores ordered units belonging to a training program.
class TrainingUnit(Base):
    __tablename__ = "training_units"

    unit_id = Column(Integer, primary_key=True, autoincrement=True)
    program_id = Column(
        Integer,
        ForeignKey("training_programs.program_id"),
        nullable=False,
    )
    name = Column(String, nullable=False)
    sequence = Column(Integer, nullable=False)

    program = relationship(
        "TrainingProgram",
        back_populates="units",
    )

    completions = relationship(
        "UnitCompletion",
        back_populates="unit",
        cascade="all, delete-orphan",
    )


# M6 Training Module: Connects an employee to a training program.
class Enrollment(Base):
    __tablename__ = "training_enrollments"

    enrollment_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False,
    )
    program_id = Column(
        Integer,
        ForeignKey("training_programs.program_id"),
        nullable=False,
    )
    enrolled_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )

    employee = relationship(
        "Employee",
        foreign_keys=[employee_id],
    )

    program = relationship(
        "TrainingProgram",
        back_populates="enrollments",
    )

    completions = relationship(
        "UnitCompletion",
        back_populates="enrollment",
        cascade="all, delete-orphan",
    )


# M6 Training Module: Records completed units and optional assessment scores.
class UnitCompletion(Base):
    __tablename__ = "training_unit_completions"

    completion_id = Column(Integer, primary_key=True, autoincrement=True)
    enrollment_id = Column(
        Integer,
        ForeignKey("training_enrollments.enrollment_id"),
        nullable=False,
    )
    unit_id = Column(
        Integer,
        ForeignKey("training_units.unit_id"),
        nullable=False,
    )
    completed_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )
    score = Column(Float, nullable=True)

    enrollment = relationship(
        "Enrollment",
        back_populates="completions",
    )

    unit = relationship(
        "TrainingUnit",
        back_populates="completions",
    )