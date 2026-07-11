from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional


class TeamBase(BaseModel):
    name: str = Field(..., description="Team/department name")


class TeamCreate(TeamBase):
    team_id: str = Field(..., description="Primary unique team identifier")


class TeamResponse(TeamBase):
    team_id: str

    model_config = ConfigDict(from_attributes=True)


class EmployeeBase(BaseModel):
    name: str = Field(..., description="Full legal name of the employee")
    designation: Optional[str] = Field(
        None, description="Current corporate job title"
    )
    team_id: Optional[str] = Field(None, description="FK to the employee's Team")
    manager_id: Optional[str] = Field(
        None, description="Employee ID of the supervisor"
    )
    join_date: Optional[date] = Field(None, description="Official date of registration")
    access_tier: str = Field(
        default="Employee", description="RBAC Access Level Authorization"
    )
    contact_details: Optional[str] = Field(
        None, description="Corporate communications profile details"
    )


class EmployeeCreate(EmployeeBase):
    employee_id: str = Field(
        ..., description="Primary alpha-numeric unique registration key"
    )


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    team_id: Optional[str] = None
    manager_id: Optional[str] = None
    employment_status: Optional[str] = None
    access_tier: Optional[str] = None
    contact_details: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    employee_id: str
    employment_status: str

    model_config = ConfigDict(from_attributes=True)
