from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional


class EmployeeBase(BaseModel):
    name: str = Field(..., description="Full legal name of the employee")
    role_designation: Optional[str] = Field(
        None, description="Current corporate job title"
    )
    team: Optional[str] = Field(None, description="Department squad group allocation")
    reporting_manager_id: Optional[str] = Field(
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
    role_designation: Optional[str] = None
    team: Optional[str] = None
    reporting_manager_id: Optional[str] = None
    employment_status: Optional[str] = None
    access_tier: Optional[str] = None
    contact_details: Optional[str] = None


class EmployeeResponse(EmployeeBase):
    employee_id: str
    employment_status: str

    model_config = ConfigDict(from_attributes=True)
