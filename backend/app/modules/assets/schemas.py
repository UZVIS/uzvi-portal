from datetime import date
from typing import Optional

from pydantic import BaseModel


class AssetCreate(BaseModel):
    asset_id: str
    tag: str
    asset_type: str
    status: str


class AssetResponse(BaseModel):
    asset_id: str
    tag: str
    asset_type: str
    status: str

    model_config = {
        "from_attributes": True
    }


class AssetAssignmentCreate(BaseModel):
    assignment_id: str
    asset_id: str
    employee_id: str
    assigned_date: date
    returned_date: Optional[date] = None
    remarks: Optional[str] = None


class AssetAssignmentResponse(BaseModel):
    assignment_id: str
    asset_id: str
    employee_id: str
    assigned_date: date
    returned_date: Optional[date] = None
    remarks: Optional[str] = None

    model_config = {
        "from_attributes": True
    }