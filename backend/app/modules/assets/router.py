from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.modules.assets.models import Asset, AssetAssignment
from app.modules.assets.schemas import (
    AssetCreate,
    AssetResponse,
    AssetAssignmentCreate,
    AssetAssignmentResponse,
    AssetReturn,
    EmployeeAssetsResponse,
    AssignmentDetailsResponse,
    InventorySummaryResponse,
)
from app.modules.m0_employee.models import Employee

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
    existing_asset = (
        db.query(Asset)
        .filter(Asset.asset_id == asset.asset_id)
        .first()
    )

    if existing_asset:
        raise HTTPException(
            status_code=400,
            detail="Asset with this ID already exists."
        )
    
    # Check Asset Tag
    existing_tag = (
        db.query(Asset)
    .filter(Asset.tag == asset.tag)
    .first()
)

    if existing_tag:
     raise HTTPException(
        status_code=400,
        detail="Asset tag already exists."
    )
    
 
    

    new_asset = Asset(**asset.model_dump())

    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    return new_asset

# ----------------------------
# Get Available Assets
# ----------------------------
@router.get(
    "/available",
    response_model=list[AssetResponse]
)
def get_available_assets(
    db: Session = Depends(get_db)
):
    assets = (
        db.query(Asset)
        .filter(
            Asset.status == "Available"
        )
        .all()
    )

    return assets


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
    assets = (
        db.query(Asset)
        .filter(
            Asset.status == "Assigned"
        )
        .all()
    )

    return assets




# ----------------------------
# Get All Assets
# ----------------------------
@router.get("/", response_model=list[AssetResponse])
def get_all_assets(
    db: Session = Depends(get_db)
):
    return db.query(Asset).all()



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
    assignments = (
        db.query(AssetAssignment)
        .order_by(
            AssetAssignment.assigned_date.desc()
        )
        .all()
    )

    return assignments

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
    assignment = (
        db.query(AssetAssignment)
        .filter(
            AssetAssignment.assignment_id == assignment_id
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found."
        )

    return assignment


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
    total_assets = db.query(Asset).count()

    available_assets = (
        db.query(Asset)
        .filter(Asset.status == "Available")
        .count()
    )

    assigned_assets = (
        db.query(Asset)
        .filter(Asset.status == "Assigned")
        .count()
    )

    return InventorySummaryResponse(
        total_assets=total_assets,
        available_assets=available_assets,
        assigned_assets=assigned_assets,
    )
# ----------------------------
# Inventory Count By Asset Type
# ----------------------------
@router.get("/summary/type")
def get_inventory_by_type(
    db: Session = Depends(get_db)
):
    results = (
        db.query(
            Asset.asset_type,
            func.count(Asset.asset_id)
        )
        .group_by(
            Asset.asset_type
        )
        .all()
    )

    return {
        asset_type: count
        for asset_type, count in results
    }

# ----------------------------
# Get Asset By ID
# ----------------------------
@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset_by_id(
    asset_id: str,
    db: Session = Depends(get_db)
):
    asset = (
        db.query(Asset)
        .filter(Asset.asset_id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found."
        )

    return asset


# ----------------------------
# Update Asset
# ----------------------------
@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: str,
    asset_data: AssetCreate,
    db: Session = Depends(get_db)
):
    asset = (
        db.query(Asset)
        .filter(Asset.asset_id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found."
        )

    asset.tag = asset_data.tag
    asset.asset_type = asset_data.asset_type
    asset.purchase_date = asset_data.purchase_date
    asset.status = asset_data.status

    db.commit()
    db.refresh(asset)

    return asset


# ----------------------------
# Delete Asset
# ----------------------------
@router.delete("/{asset_id}")
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    asset = (
        db.query(Asset)
        .filter(Asset.asset_id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found."
        )

    # Prevent deleting assigned assets
    if asset.status == "Assigned":
        raise HTTPException(
            status_code=400,
            detail="Assigned assets cannot be deleted. Return the asset first."
        )

    db.delete(asset)
    db.commit()

    return {
        "message": "Asset deleted successfully"
    }

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
    # Check Assignment ID
    existing_assignment = (
        db.query(AssetAssignment)
        .filter(
            AssetAssignment.assignment_id == assignment.assignment_id
        )
        .first()
    )

    if existing_assignment:
        raise HTTPException(
            status_code=400,
            detail="Assignment ID already exists."
        )

    # Check Asset Exists
    asset = (
        db.query(Asset)
        .filter(
            Asset.asset_id == assignment.asset_id
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found."
        )

    # Check Employee Exists
    employee = (
        db.query(Employee)
        .filter(
            Employee.employee_id == assignment.employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    # Check Asset Availability
    if asset.status == "Assigned":
        raise HTTPException(
            status_code=400,
            detail="Asset is already assigned."
        )

    # Create Assignment
    new_assignment = AssetAssignment(
        **assignment.model_dump()
    )

    db.add(new_assignment)

    # Update Asset Status
    asset.status = "Assigned"

    db.commit()
    db.refresh(new_assignment)

    return new_assignment


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
    # Find Assignment
    assignment = (
        db.query(AssetAssignment)
        .filter(
            AssetAssignment.assignment_id == assignment_id
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found."
        )

    # Already Returned?
    if assignment.returned_date:
        raise HTTPException(
            status_code=400,
            detail="Asset already returned."
        )

    # Find Asset
    asset = (
        db.query(Asset)
        .filter(
            Asset.asset_id == assignment.asset_id
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found."
        )

    # Update Assignment
    assignment.returned_date = return_data.returned_date
    assignment.remarks = return_data.remarks

    # Update Asset Status
    asset.status = "Available"

    db.commit()
    db.refresh(assignment)

    return assignment


# ----------------------------
# Get Assignment History
# ----------------------------
@router.get(
    "/{asset_id}/history",
    response_model=list[AssetAssignmentResponse]
)
def get_asset_history(
    asset_id: str,
    db: Session = Depends(get_db)
):
    # Check Asset Exists
    asset = (
        db.query(Asset)
        .filter(Asset.asset_id == asset_id)
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found."
        )

    # Fetch Assignment History
    history = (
        db.query(AssetAssignment)
        .filter(
            AssetAssignment.asset_id == asset_id
        )
        .order_by(
            AssetAssignment.assigned_date.desc()
        )
        .all()
    )

    return history


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
    # Check Employee Exists
    employee = (
        db.query(Employee)
        .filter(
            Employee.employee_id == employee_id
        )
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    # Get Current Assignments
    assignments = (
        db.query(AssetAssignment)
        .filter(
            AssetAssignment.employee_id == employee_id,
            AssetAssignment.returned_date == None
        )
        .all()
    )

    assets = []

    for assignment in assignments:
        asset = (
            db.query(Asset)
            .filter(
                Asset.asset_id == assignment.asset_id
            )
            .first()
        )

        if asset:
            assets.append(asset)

    return assets

