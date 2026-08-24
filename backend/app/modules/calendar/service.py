"""
Calendar Management (M14) Business Logic (Services)
===================================================
This module acts as the service layer for the Calendar system.
It bridges the API routers and the database CRUD operations, handling
any necessary business logic or validation before interacting with the database.
"""

import holidays
import pandas as pd
import io
from datetime import date
from sqlalchemy.orm import Session
from typing import Optional
from fastapi import UploadFile, HTTPException

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

# --- NEW: EXCEL/CSV IMPORT LOGIC FOR HOLIDAYS ---
def import_holidays_from_file(db: Session, file: UploadFile):
    """
    Reads an uploaded CSV or Excel file and inserts the holidays into the database.
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")
        
    try:
        contents = file.file.read()
        
        # 1. Read file into a Pandas DataFrame
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # 2. Validate columns
        required_columns = ["Name", "Date", "State"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail="Missing required columns. File must have 'Name', 'Date', and 'State'.")
            
        # 3. Iterate over the rows and save to DB
        imported_count = 0
        for index, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row["Name"]) or pd.isna(row["Date"]):
                continue
                
            try:
                # Convert string date from Excel to Python Date object
                h_date = pd.to_datetime(row["Date"]).date()
            except Exception:
                continue # Skip rows with invalid date formats
                
            h_state = str(row["State"]).strip() if not pd.isna(row["State"]) else "All"
            
            # Map to Schema and save via existing CRUD operation
            holiday_data = schemas.HolidayCreate(
                name=str(row["Name"]).strip(),
                date=h_date,
                state=h_state
            )
            crud.create_holiday(db=db, holiday=holiday_data)
            imported_count += 1
            
        return {"message": f"Successfully imported {imported_count} holidays!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
    finally:
        file.file.close()

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

# --- NEW: EXCEL/CSV IMPORT LOGIC FOR EVENTS ---
def import_events_from_file(db: Session, file: UploadFile):
    """
    Reads an uploaded CSV or Excel file and inserts the events into the database.
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv or .xlsx file.")
        
    try:
        contents = file.file.read()
        
        # 1. Read file into a Pandas DataFrame
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # 2. Validate columns
        required_columns = ["Title", "Date", "Location"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail="Missing columns. File must have 'Title', 'Date', and 'Location'.")
            
        # 3. Iterate over the rows and save to DB
        imported_count = 0
        for index, row in df.iterrows():
            if pd.isna(row["Title"]) or pd.isna(row["Date"]):
                continue
                
            try:
                e_date = pd.to_datetime(row["Date"]).date()
            except Exception:
                continue # Skip rows with invalid date formats
                
            e_location = str(row["Location"]).strip() if not pd.isna(row["Location"]) else "Office"
            
            event_data = schemas.CompanyEventCreate(
                title=str(row["Title"]).strip(),
                date=e_date,
                location=e_location
            )
            crud.create_company_event(db=db, event=event_data)
            imported_count += 1
            
        return {"message": f"Successfully imported {imported_count} events!"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")
    finally:
        file.file.close()

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