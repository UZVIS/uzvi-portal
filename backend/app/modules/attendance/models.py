from sqlalchemy import Column, String, Date, DateTime, Time, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class AttendanceStatus(str, enum.Enum):
    IN_OFFICE = "in-office"
    WFH = "wfh"
    ON_LEAVE = "on-leave"
    ABSENT = "absent"


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        nullable=False,
        index=True
    )

    attendance_date = Column(Date, nullable=False, index=True)

    status = Column(
        Enum(AttendanceStatus),
        nullable=False,
        default=AttendanceStatus.ABSENT
    )

    check_in = Column(Time, nullable=True)
    check_out = Column(Time, nullable=True)

    source = Column(String(20), default="manual")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee")