from sqlalchemy import Column, String, Integer, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    leave_type_id = Column(
        String,
        primary_key=True,
        index=True,
        nullable=False
    )

    name = Column(
        String,
        nullable=False
    )

    accrual_method = Column(
        String,
        nullable=False
    )

    carry_forward_limit = Column(
        Integer,
        nullable=False
    )

    doc_required_threshold = Column(
        Integer,
        nullable=True
    )

    leave_applications = relationship(
        "LeaveApplication",
        back_populates="leave_type"
    )


class LeaveApplication(Base):
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

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )

    reason = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="pending",
        nullable=False
    )

    approver_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=True
    )

    employee = relationship(
        "Employee",
        foreign_keys=[employee_id]
    )

    approver = relationship(
        "Employee",
        foreign_keys=[approver_id]
    )

    leave_type = relationship(
        "LeaveType",
        back_populates="leave_applications"
    )


class LeaveBalance(Base):
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

    year = Column(
        Integer,
        nullable=False
    )

    balance = Column(
        Integer,
        nullable=False
    )

    employee = relationship(
        "Employee"
    )

    leave_type = relationship(
        "LeaveType"
    )


class LeaveAuditLog(Base):
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

    action = Column(
        String,
        nullable=False
    )

    timestamp = Column(
        DateTime,
        nullable=False
    )

    application = relationship(
        "LeaveApplication"
    )

    actor = relationship(
        "Employee"
    )