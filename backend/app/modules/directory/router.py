from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.directory import service
from app.modules.directory.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    TeamCreate,
    TeamResponse,
)

router = APIRouter(prefix="/api/v1/employees", tags=["M0 Employee Directory"])

team_router = APIRouter(prefix="/api/v1/teams", tags=["M0 Employee Directory"])


@team_router.post("/", response_model=TeamResponse, status_code=201)
def register_new_team(team_in: TeamCreate, db: Session = Depends(get_db)):
    try:
        return service.create_team(db, team_in)
    except service.TeamAlreadyExists:
        raise HTTPException(status_code=400, detail="Team ID already exists.")


@team_router.get("/", response_model=List[TeamResponse])
def list_all_teams(db: Session = Depends(get_db)):
    return service.list_teams(db)


@router.post("/", response_model=EmployeeResponse, status_code=201)
def register_new_employee(employee_in: EmployeeCreate, db: Session = Depends(get_db)):
    try:
        return service.create_employee(db, employee_in)
    except service.EmployeeAlreadyExists:
        raise HTTPException(status_code=400, detail="Employee code already exists.")


@router.get("/", response_model=List[EmployeeResponse])
def list_active_directory_profiles(db: Session = Depends(get_db)):
    return service.list_active_employees(db)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def retrieve_profile_by_id(employee_id: str, db: Session = Depends(get_db)):
    employee = service.get_employee(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")
    return employee


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def edit_employee_profile(
    employee_id: str, update_in: EmployeeUpdate, db: Session = Depends(get_db)
):
    try:
        return service.update_employee(db, employee_id, update_in)
    except service.EmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found.")


@router.post("/{employee_id}/exit", response_model=EmployeeResponse)
def mark_employee_as_exited(employee_id: str, db: Session = Depends(get_db)):
    try:
        return service.mark_employee_exited(db, employee_id)
    except service.EmployeeNotFound:
        raise HTTPException(status_code=404, detail="Employee not found.")
