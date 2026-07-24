"""
Calendar Management (M14) Models
================================
This module defines the SQLAlchemy ORM models for the Calendar and Events system.
It includes definitions for company holidays (national and state-specific) 
and internal company events.
"""

from sqlalchemy import Column, String, Date
from app.database import Base 

class Holiday(Base):
    """
    Represents a company holiday.
    If the holiday is national, the 'state' field remains null.
    """
    __tablename__ = "holidays"

    holiday_id = Column(
        String, 
        primary_key=True, 
        index=True, 
        nullable=False
    )
    date = Column(Date, nullable=False)
    name = Column(String, nullable=False)
    state = Column(String, nullable=True)


class CompanyEvent(Base):
    """
    Represents an internal company event (e.g., Townhalls, Team Building).
    Tracks the event title, date, and optional location or virtual link.
    """
    __tablename__ = "company_events"

    event_id = Column(
        String, 
        primary_key=True, 
        index=True, 
        nullable=False
    )
    title = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    location = Column(String, nullable=True)