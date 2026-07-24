"""
Calendar Management (M14) Pydantic Schemas
==========================================
This module defines the Pydantic models used for data validation, 
request payload parsing, and response serialization for holidays and company events.
"""

from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Optional

# ==========================================
# 1. Holiday Schemas
# ==========================================

class HolidayBase(BaseModel):
    """
    Base schema for holiday data.
    If the state is omitted (None), it is considered a National Holiday.
    """
    date: date
    name: str
    state: Optional[str] = None
    description: Optional[str] = None  

class HolidayCreate(HolidayBase):
    """
    Schema for creating a new company holiday.
    """
    pass

class HolidayUpdate(BaseModel):
    """
    Schema for updating an existing company holiday. 
    All fields are optional to allow partial updates.
    """
    date: Optional[date] = None
    name: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None

class HolidayResponse(HolidayBase):
    """
    Schema for returning holiday details in API responses.
    """
    holiday_id: str
    
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. Company Event Schemas
# ==========================================

class CompanyEventBase(BaseModel):
    """
    Base schema for internal company event data.
    """
    title: str
    date: date
    location: Optional[str] = None

class CompanyEventCreate(CompanyEventBase):
    """
    Schema for creating a new company event.
    """
    pass

class CompanyEventUpdate(BaseModel):
    """
    Schema for updating an existing company event.
    All fields are optional to allow partial updates.
    """
    title: Optional[str] = None
    date: Optional[date] = None
    location: Optional[str] = None

class CompanyEventResponse(CompanyEventBase):
    """
    Schema for returning company event details in API responses.
    """
    event_id: str
    
    model_config = ConfigDict(from_attributes=True)