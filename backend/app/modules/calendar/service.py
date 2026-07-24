"""
Calendar Management (M14) Business Logic (Services)
===================================================
This module acts as the service layer for the Calendar system.
It bridges the API routers and the database CRUD operations, handling
any necessary business logic or validation before interacting with the database.
"""

from sqlalchemy.orm import Session
from typing import Optional

from . import crud, schemas

# ==========================================
# 1. Holiday Services
# ==========================================

def create_holiday(db: Session, holiday: schemas.HolidayCreate):
    """
    Processes the creation of a new company holiday.
    Passes the validated schema data to the CRUD layer.
    """
    return crud.create_holiday(db=db, holiday=holiday)

def get_holidays(db: Session, year: Optional[int] = None, month: Optional[int] = None):
    """
    Retrieves company holidays, delegating optional year and month filters to the CRUD layer.
    """
    return crud.get_holidays(db=db, year=year, month=month)

def update_holiday(db: Session, holiday_id: int, holiday_update: schemas.HolidayUpdate):
    """
    Processes the update of an existing company holiday.
    """
    return crud.update_holiday(db=db, holiday_id=holiday_id, holiday_update=holiday_update)

def delete_holiday(db: Session, holiday_id: int):
    """
    Processes the deletion of a company holiday.
    """
    return crud.delete_holiday(db=db, holiday_id=holiday_id)


# ==========================================
# 2. Company Event Services
# ==========================================

def create_company_event(db: Session, event: schemas.CompanyEventCreate):
    """
    Processes the creation of a new internal company event.
    """
    return crud.create_company_event(db=db, event=event)

def get_company_events(db: Session, year: Optional[int] = None, month: Optional[int] = None):
    """
    Retrieves company events, delegating optional year and month filters to the CRUD layer.
    """
    return crud.get_company_events(db=db, year=year, month=month)

def update_company_event(db: Session, event_id: int, event_update: schemas.CompanyEventUpdate):
    """
    Processes the update of an existing internal company event.
    """
    return crud.update_company_event(db=db, event_id=event_id, event_update=event_update)

def delete_company_event(db: Session, event_id: int):
    """
    Processes the deletion of a company event.
    """
    return crud.delete_company_event(db=db, event_id=event_id)