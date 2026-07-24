"""
Calendar Management (M14) API Router
====================================
This module defines the RESTful API endpoints for the Calendar system.
It handles routing for retrieving and creating company holidays and internal events.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from . import schemas, service

router = APIRouter(
    prefix="/api/v1/calendar",
    tags=["Calendar (M14)"]
)

# ==========================================
# 1. Holiday Endpoints
# ==========================================

@router.post("/holidays", response_model=schemas.HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(holiday: schemas.HolidayCreate, db: Session = Depends(get_db)):
    """
    Create a new company holiday.
    Typically used by administrators or HR to populate the company calendar.
    """
    return service.create_holiday(db=db, holiday=holiday)

@router.get("/holidays", response_model=List[schemas.HolidayResponse])
def get_holidays(year: Optional[int] = None, month: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Retrieve a list of company holidays.
    Supports optional query parameters to filter the results by a specific year and month.
    """
    return service.get_holidays(db=db, year=year, month=month)


# ==========================================
# 2. Company Event Endpoints
# ==========================================

@router.post("/events", response_model=schemas.CompanyEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(event: schemas.CompanyEventCreate, db: Session = Depends(get_db)):
    """
    Create a new internal company event.
    Typically used by administrators to schedule townhalls, meetings, or team-building activities.
    """
    return service.create_company_event(db=db, event=event)

@router.get("/events", response_model=List[schemas.CompanyEventResponse])
def get_events(year: Optional[int] = None, month: Optional[int] = None, db: Session = Depends(get_db)):
    """
    Retrieve a list of company events.
    Supports optional query parameters to filter the results by a specific year and month.
    """
    return service.get_company_events(db=db, year=year, month=month)

# ==========================================
# Missing Holiday Endpoints (Update & Delete)
# ==========================================

@router.put("/holidays/{holiday_id}", response_model=schemas.HolidayResponse)
def update_holiday(holiday_id: int, holiday_update: schemas.HolidayUpdate, db: Session = Depends(get_db)):
    """
    Update an existing company holiday.
    """
    return service.update_holiday(db=db, holiday_id=holiday_id, holiday_update=holiday_update)

@router.delete("/holidays/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    """
    Delete a company holiday.
    """
    service.delete_holiday(db=db, holiday_id=holiday_id)
    return None

# ==========================================
# Missing Event Endpoints (Update & Delete)
# ==========================================

@router.put("/events/{event_id}", response_model=schemas.CompanyEventResponse)
def update_event(event_id: int, event_update: schemas.CompanyEventUpdate, db: Session = Depends(get_db)):
    """
    Update an existing internal company event.
    """
    return service.update_company_event(db=db, event_id=event_id, event_update=event_update)

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    """
    Delete a company event.
    """
    service.delete_company_event(db=db, event_id=event_id)
    return None