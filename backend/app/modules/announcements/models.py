from sqlalchemy import Column, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    announcement_id = Column(String, primary_key=True, index=True, nullable=False)
    posted_by = Column(String, ForeignKey("employees.employee_id"), nullable=False)

    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)

    # company_wide | team | role
    target_type = Column(String, nullable=False)
    # team_id or access_tier name; null when target_type is company_wide
    target_value = Column(String, nullable=True)

    requires_ack = Column(Boolean, default=False, nullable=False)
    expiry_date = Column(Date, nullable=True)

    # active | archived (FR-ANN-04: archived, not deleted, after expiry)
    status = Column(String, default="active", nullable=False)

    posted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    poster = relationship("Employee", foreign_keys=[posted_by])
    acknowledgments = relationship(
        "AnnouncementAck", back_populates="announcement", cascade="all, delete-orphan"
    )


class AnnouncementAck(Base):
    __tablename__ = "announcement_acks"

    id = Column(String, primary_key=True, index=True, nullable=False)
    announcement_id = Column(
        String, ForeignKey("announcements.announcement_id"), nullable=False
    )
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    acknowledged_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    announcement = relationship("Announcement", back_populates="acknowledgments")
    employee = relationship("Employee", foreign_keys=[employee_id])