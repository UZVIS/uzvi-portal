from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.assets import service
from app.modules.assets.schemas import (
    AssetCreate,
    AssetResponse,
    AssetListResponse,
    AssetAssignmentCreate,
    AssetAssignmentResponse,
    AssetReturn,
    EmployeeAssetsResponse,
    AssignmentDetailsResponse,
    InventorySummaryResponse,
    AssetHistoryResponse,
    PendingReturnResponse
)


router = APIRouter(
    prefix="/api/v1/assets",
    tags=["Asset Management Operations"]
)


# ----------------------------
# Create Asset
# ----------------------------
@router.post("/", response_model=AssetResponse, status_code=201)
def create_asset(
    asset: AssetCreate,
    db: Session = Depends(get_db)
):
    return service.create_asset(asset, db)


# ----------------------------
# Get InStock Assets
# ----------------------------
@router.get(
    "/in-stock",
    response_model=list[AssetResponse]
)
def get_in_stock_assets(
    db: Session = Depends(get_db)
):
    return service.get_in_stock_assets(db)


# ----------------------------
# Get Assigned Assets
# ----------------------------
@router.get(
    "/assigned",
    response_model=list[AssetResponse]
)
def get_assigned_assets(
    db: Session = Depends(get_db)
):
    return service.get_assigned_assets(db)


# ----------------------------
# Get All Assets
# ----------------------------
@router.get(
    "/",
    response_model=list[AssetListResponse]
)
def get_all_assets(
    db: Session = Depends(get_db)
):
    return service.get_all_assets(db)


# ----------------------------
# Get All Assignments (Admin)
# ----------------------------
@router.get(
    "/assignments",
    response_model=list[AssignmentDetailsResponse]
)
def get_all_assignments(
    db: Session = Depends(get_db)
):
    return service.get_all_assignments(db)


# ----------------------------
# Get Assignment By ID
# ----------------------------
@router.get(
    "/assignments/{assignment_id}",
    response_model=AssignmentDetailsResponse
)
def get_assignment_by_id(
    assignment_id: str,
    db: Session = Depends(get_db)
):
    return service.get_assignment_by_id(assignment_id, db)


# ----------------------------
# Inventory Summary
# ----------------------------
@router.get(
    "/summary",
    response_model=InventorySummaryResponse
)
def get_inventory_summary(
    db: Session = Depends(get_db)
):
    return service.get_inventory_summary(db)


# ----------------------------
# Inventory Count By Asset Type
# ----------------------------
@router.get("/summary/type")
def get_inventory_by_type(
    db: Session = Depends(get_db)
):
    return service.get_inventory_by_type(db)


# pending returns
@router.get(
    "/pending-returns",
    response_model=list[PendingReturnResponse]
)
def get_pending_returns(
    db: Session = Depends(get_db)
):
    return service.get_pending_returns(db)


# ----------------------------
# Get Asset By ID
# ----------------------------
@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset_by_id(
    asset_id: str,
    db: Session = Depends(get_db)
):
    return service.get_asset_by_id(asset_id, db)


# ----------------------------
# Update Asset
# ----------------------------
@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    asset_data: AssetCreate,
    db: Session = Depends(get_db)
):
    return service.update_asset(asset_id, asset_data, db)


# ----------------------------
# Delete Asset
# ----------------------------
@router.delete("/{asset_id}")
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    return service.delete_asset(asset_id, db)


# =====================================================
# Asset Assignment
# =====================================================

# ----------------------------
# Assign Asset
# ----------------------------
@router.post(
    "/assign",
    response_model=AssetAssignmentResponse,
    status_code=201
)
def assign_asset(
    assignment: AssetAssignmentCreate,
    db: Session = Depends(get_db)
):
    return service.assign_asset(assignment, db)


# ----------------------------
# Return Asset
# ----------------------------
@router.put(
    "/return/{assignment_id}",
    response_model=AssetAssignmentResponse
)
def return_asset(
    assignment_id: str,
    return_data: AssetReturn,
    db: Session = Depends(get_db)
):
    return service.return_asset(assignment_id, return_data, db)


# ----------------------------
# Get Assignment History
# ----------------------------
@router.get(
    "/{asset_id}/history",
    response_model=list[AssetHistoryResponse]
)
def get_asset_history(
    asset_id: str,
    db: Session = Depends(get_db)
):
    return service.get_asset_history(asset_id, db)


# ----------------------------
# Get Assets Assigned to Employee FR-AST-04
# Employees shall view their currently assigned assets.
# ----------------------------
@router.get(
    "/employee/{employee_id}",
    response_model=list[EmployeeAssetsResponse]
)
def get_employee_assets(
    employee_id: str,
    db: Session = Depends(get_db)
):
    return service.get_employee_assets(employee_id, db)
