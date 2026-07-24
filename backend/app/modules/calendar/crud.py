"""
Calendar Management (M14) CRUD Operations
=========================================
This module contains the database operations (Create, Read, Update, Delete) for the Calendar system.
It interacts with the database sessions to manage company holidays and events.
"""

from sqlalchemy.orm import Session
from sqlalchemy import extract
from datetime import date
from typing import Optional

from . import models, schemas
from app.utils import generate_prefixed_id  

# ==========================================
# 1. Holiday Operations (FR-CAL-01 & 04)
# ==========================================

def create_holiday(db: Session, holiday: schemas.HolidayCreate):
    """
    Creates a new company holiday in the database.
    Automatically generates a prefixed ID (e.g., 'HOL001').
    """
    new_id = generate_prefixed_id(db, models.Holiday, "holiday_id", "HOL")
    
    db_holiday = models.Holiday(
        holiday_id=new_id,
        date=holiday.date,
        name=holiday.name,
        state=holiday.state,
        
    )
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    return db_holiday

def get_holidays(db: Session, year: Optional[int] = None, month: Optional[int] = None):
    """
    Retrieves a list of company holidays, ordered by date.
    Supports optional filtering by year and month.
    """
    query = db.query(models.Holiday)
    
    if year:
        query = query.filter(extract('year', models.Holiday.date) == year)
    if month:
        query = query.filter(extract('month', models.Holiday.date) == month)
        
    return query.order_by(models.Holiday.date).all()

def update_holiday(db: Session, holiday_id: str, holiday_update: schemas.HolidayUpdate):
    """
    Updates an existing company holiday.
    """
    db_holiday = db.query(models.Holiday).filter(models.Holiday.holiday_id == holiday_id).first()
    
    if db_holiday:
        update_data = holiday_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_holiday, key, value)
            
        db.commit()
        db.refresh(db_holiday)
        
    return db_holiday

def delete_holiday(db: Session, holiday_id: str):
    """
    Deletes a company holiday from the database.
    """
    db_holiday = db.query(models.Holiday).filter(models.Holiday.holiday_id == holiday_id).first()
    
    if db_holiday:
        db.delete(db_holiday)
        db.commit()
        return True
    return False


# ==========================================
# 2. Company Event Operations (FR-CAL-02 & 04)
# ==========================================

def create_company_event(db: Session, event: schemas.CompanyEventCreate):
    """
    Creates a new internal company event in the database.
    Automatically generates a prefixed ID (e.g., 'EVT001').
    """
    new_id = generate_prefixed_id(db, models.CompanyEvent, "event_id", "EVT")
    
    db_event = models.CompanyEvent(
        event_id=new_id,
        title=event.title,
        date=event.date,
        location=event.location,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_company_events(db: Session, year: Optional[int] = None, month: Optional[int] = None):
    """
    Retrieves a list of company events, ordered by date.
    Supports optional filtering by year and month.
    """
    query = db.query(models.CompanyEvent)
    
    if year:
        query = query.filter(extract('year', models.CompanyEvent.date) == year)
    if month:
        query = query.filter(extract('month', models.CompanyEvent.date) == month)
        
    return query.order_by(models.CompanyEvent.date).all()

def update_company_event(db: Session, event_id: str, event_update: schemas.CompanyEventUpdate):
    """
    Updates an existing internal company event.
    """
    db_event = db.query(models.CompanyEvent).filter(models.CompanyEvent.event_id == event_id).first()
    
    if db_event:
        update_data = event_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_event, key, value)
            
        db.commit()
        db.refresh(db_event)
        
    return db_event

def delete_company_event(db: Session, event_id: str):
    """
    Deletes a company event from the database.
    """
    db_event = db.query(models.CompanyEvent).filter(models.CompanyEvent.event_id == event_id).first()
    
    if db_event:
        db.delete(db_event)
        db.commit()
        return True
    return False