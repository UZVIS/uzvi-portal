from datetime import datetime, date

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    Text
)

from app.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    announcement_id = Column(Integer, primary_key=True, index=True)

    # Placeholder until M0 is integrated
    posted_by = Column(String(50), nullable=False)

    title = Column(String(200), nullable=False)

    body = Column(Text, nullable=False)

    target_type = Column(String(30), nullable=False)
    # company | team | role

    target_value = Column(String(100), nullable=True)

    requires_acknowledgement = Column(
        Boolean,
        default=False
    )

    expiry_date = Column(Date, nullable=True)

    archived = Column(Boolean, default=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class AnnouncementAck(Base):

    __tablename__ = "announcement_acknowledgements"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    announcement_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    # Future FK -> Employee.employee_id
    employee_id = Column(
        String(50),
        nullable=False,
        index=True
    )

    acknowledged_at = Column(
        DateTime,
        default=datetime.utcnow
    )