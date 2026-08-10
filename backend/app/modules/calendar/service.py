"""
Calendar Management (M14) Business Logic (Services)
===================================================
This module acts as the service layer for the Calendar system.
It bridges the API routers and the database CRUD operations, handling
any necessary business logic or validation before interacting with the database.
"""

import holidays
from datetime import date
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
    Retrieves company holidays from DB and dynamically integrates 
    Indian public holidays using the `holidays` package.
    """
    # 1. Fetch Admin-configured custom holidays from Database
    db_holidays = crud.get_holidays(db=db, year=year, month=month)
    
    # 2. Determine target year for public holidays
    target_year = year if year else date.today().year
    
    # 3. Fetch standard Indian public holidays automatically
    in_holidays = holidays.country_holidays('IN', years=target_year)
    
    # Track existing dates to avoid duplicating holidays
    db_dates = set()
    for h in db_holidays:
        h_date = getattr(h, 'date', None)
        if h_date:
            db_dates.add(h_date.isoformat() if hasattr(h_date, 'isoformat') else str(h_date))

    # 4. Combine DB holidays with Public holidays
    combined_holidays = list(db_holidays)
    
    for h_date, h_name in in_holidays.items():
        # Apply month filter if requested via API
        if month and h_date.month != month:
            continue
            
        formatted_date = h_date.isoformat()
        
        # If this public holiday is not already in the DB, add it dynamically
        if formatted_date not in db_dates:
            combined_holidays.append({
                "holiday_id": f"auto_pub_{formatted_date}",
                "name": h_name,
                "date": h_date,
                "state": "National" # Default tag for India public holidays
            })
            db_dates.add(formatted_date)
            
    # Sort all combined holidays sequentially by date
    def get_date(item):
        if isinstance(item, dict):
            return item.get('date')
        return getattr(item, 'date', None)
        
    combined_holidays.sort(key=get_date)

    return combined_holidays

def update_holiday(db: Session, holiday_id: str, holiday_update: schemas.HolidayUpdate):
    """
    Processes the update of an existing company holiday.
    """
    return crud.update_holiday(db=db, holiday_id=holiday_id, holiday_update=holiday_update)

def delete_holiday(db: Session, holiday_id: str):
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

def update_company_event(db: Session, event_id: str, event_update: schemas.CompanyEventUpdate):
    """
    Processes the update of an existing internal company event.
    """
    return crud.update_company_event(db=db, event_id=event_id, event_update=event_update)

def delete_company_event(db: Session, event_id: str):
    """
    Processes the deletion of a company event.
    """
    return crud.delete_company_event(db=db, event_id=event_id)