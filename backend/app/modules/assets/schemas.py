from datetime import date
from typing import Optional

from pydantic import BaseModel


class AssetCreate(BaseModel):
    asset_id: str
    tag: str
    asset_type: str
    purchase_date: date
    status: str


class AssetResponse(BaseModel):
    asset_id: str
    tag: str
    asset_type: str
    purchase_date: date
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

class AssetReturn(BaseModel):
    returned_date: date
    remarks: Optional[str] = None

# this is for to get the assigned assets for a specific employee
class EmployeeAssetsResponse(BaseModel):
    asset_id: str
    tag: str
    asset_type: str
    purchase_date: date
    status: str

    model_config = {
        "from_attributes": True
    }


# Get All Assignments (Admin)
class AssignmentDetailsResponse(BaseModel):
    assignment_id: str
    asset_id: str
    employee_id: str
    assigned_date: date
    returned_date: Optional[date] = None
    remarks: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

# inventory report
class InventorySummaryResponse(BaseModel):
    total_assets: int
    in_stock_assets: int
    assigned_assets: int
    under_repair_assets: int
    retired_assets: int