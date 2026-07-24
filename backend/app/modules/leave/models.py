"""
Leave Management (M2) Models
============================
This module defines the SQLAlchemy ORM models for the Leave Management system.
It includes definitions for leave types, employee leave balances, leave applications,
and audit logs to track the approval workflow.
"""

import enum
from datetime import datetime

from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database import Base


class LeaveStatus(str, enum.Enum):
    """
    Enum representing the possible states of a leave application.
    """
    PENDING = "pending"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class LeaveType(Base):
    """
    Represents a category of leave (e.g., Casual Leave, Sick Leave).
    Defines the rules for accrual, carry forward limits, and documentation requirements.
    """
    __tablename__ = "leave_types"

    leave_type_id = Column(
        String,
        primary_key=True,
        index=True,
        nullable=False
    )
    name = Column(String, nullable=False)
    accrual_method = Column(String, nullable=False)
    carry_forward_limit = Column(Integer, nullable=False)
    doc_required_threshold = Column(Integer, nullable=True)

    leave_applications = relationship(
        "LeaveApplication",
        back_populates="leave_type"
    )


class LeaveApplication(Base):
    """
    Records an employee's request for time off.
    Tracks the dates, requested leave type, and the current approval status.
    """
    __tablename__ = "leave_applications"

    application_id = Column(
        String,
        primary_key=True,
        index=True,
        nullable=False
    )
    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False
    )
    leave_type_id = Column(
        String,
        ForeignKey("leave_types.leave_type_id"),
        nullable=False
    )
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    status = Column(
        Enum(LeaveStatus),
        default=LeaveStatus.PENDING,
        nullable=False
    )

    approver_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    employee = relationship("Employee", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approver_id])
    leave_type = relationship("LeaveType", back_populates="leave_applications")


class LeaveBalance(Base):
    """
    Acts as a digital wallet for an employee's leaves.
    Tracks how many days of a specific leave type an employee has left for a given year.
    """
    __tablename__ = "leave_balances"

    id = Column(
        String,
        primary_key=True,
        index=True,
        nullable=False
    )
    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False
    )
    leave_type_id = Column(
        String,
        ForeignKey("leave_types.leave_type_id"),
        nullable=False
    )
    year = Column(Integer, nullable=False)
    balance = Column(Integer, nullable=False)

    employee = relationship("Employee")
    leave_type = relationship("LeaveType")


class LeaveAuditLog(Base):
    """
    Maintains a historical record of actions taken on a leave application.
    Used for compliance and tracking who approved or rejected a request and when.
    """
    __tablename__ = "leave_audit_logs"

    log_id = Column(
        String,
        primary_key=True,
        index=True,
        nullable=False
    )
    application_id = Column(
        String,
        ForeignKey("leave_applications.application_id"),
        nullable=False
    )
    actor_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False
    )
    action = Column(String, nullable=False)

    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    application = relationship("LeaveApplication")
    actor = relationship("Employee")