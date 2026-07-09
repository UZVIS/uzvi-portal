from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os

from app.modules.m0_employee.models import Employee
from app.modules.m0_employee.schemas import (
    EmployeeCreate,
    EmployeeResponse,
)


def get_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    database_url = os.getenv("DATABASE_URL", "sqlite:///uzvi_portal.db")
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(
    prefix="/api/v1/employees", tags=["M0 Employee Directory Operations"]
)


@router.post("/", response_model=EmployeeResponse, status_code=201)
def register_new_employee(employee_in: EmployeeCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(Employee)
        .filter(Employee.employee_id == employee_in.employee_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Employee code already allocated to a profile."
        )

    new_emp = Employee(**employee_in.model_dump())
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp


@router.get("/", response_model=List[EmployeeResponse])
def list_active_directory_profiles(db: Session = Depends(get_db)):
    return db.query(Employee).filter(Employee.employment_status == "active").all()


@router.get("/{employee_id}", response_model=EmployeeResponse)
def retrieve_profile_by_id(employee_id: str, db: Session = Depends(get_db)):
    profile = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not profile:
        raise HTTPException(
            status_code=404, detail="Requested identity does not exist in registry."
        )
    return profile
