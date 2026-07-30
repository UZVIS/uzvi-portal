from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.modules.assets.models import Asset, AssetAssignment
from app.modules.assets.schemas import (
    AssetCreate,
    AssetUpdate,
    AssetListResponse,
    AssetAssignmentCreate,
    AssetReturn,
    AssetHistoryResponse,
    InventorySummaryResponse,
    PendingReturnResponse,
)
from app.modules.directory.models import Employee


# ----------------------------
# Create Asset
# ----------------------------
def create_asset(asset: AssetCreate, db: Session):
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
# Get InStock Assets
# ----------------------------
def get_in_stock_assets(db: Session):
    assets = (
        db.query(Asset)
        .filter(
            Asset.status == "In Stock"
        )
        .all()
    )

    return assets


# ----------------------------
# Get Assigned Assets
# ----------------------------
def get_assigned_assets(db: Session):
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
def get_all_assets(db: Session):

    assets = db.query(Asset).all()

    result = []

    for asset in assets:

        assignment = (
            db.query(AssetAssignment)
            .filter(
                AssetAssignment.asset_id == asset.asset_id,
                AssetAssignment.returned_date == None
            )
            .first()
        )

        employee_id = None
        employee_name = None

        if assignment:

            employee = (
                db.query(Employee)
                .filter(
                    Employee.employee_id == assignment.employee_id
                )
                .first()
            )

            if employee:

                employee_id = employee.employee_id
                employee_name = employee.name

        result.append(
            AssetListResponse(
                asset_id=asset.asset_id,
                tag=asset.tag,
                asset_type=asset.asset_type,
                purchase_date=asset.purchase_date,
                status=asset.status,
                assignment_id=assignment.assignment_id if assignment else None,
                employee_id=employee_id,
                employee_name=employee_name,
            )
        )

    return result


# ----------------------------
# Get All Assignments (Admin)
# ----------------------------
def get_all_assignments(db: Session):
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
def get_assignment_by_id(assignment_id: str, db: Session):
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
def get_inventory_summary(db: Session):
    total_assets = db.query(Asset).count()

    in_stock_assets = (
        db.query(Asset)
        .filter(Asset.status == "In Stock")
        .count()
    )

    assigned_assets = (
        db.query(Asset)
        .filter(Asset.status == "Assigned")
        .count()
    )

    under_repair_assets = (
        db.query(Asset)
        .filter(Asset.status == "Under Repair")
        .count()
    )

    retired_assets = (
        db.query(Asset)
        .filter(Asset.status == "Retired")
        .count()
    )

    return InventorySummaryResponse(
        total_assets=total_assets,
        in_stock_assets=in_stock_assets,
        assigned_assets=assigned_assets,
        under_repair_assets=under_repair_assets,
        retired_assets=retired_assets,
    )


# ----------------------------
# Inventory Count By Asset Type
# ----------------------------
def get_inventory_by_type(db: Session):
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
# Pending Returns
# ----------------------------
def get_pending_returns(db: Session):

    assignments = (
        db.query(AssetAssignment)
        .filter(
            AssetAssignment.returned_date == None
        )
        .all()
    )

    pending_returns = []

    for assignment in assignments:

        employee = (
            db.query(Employee)
            .filter(
                Employee.employee_id == assignment.employee_id
            )
            .first()
        )

        if (
            not employee
            or employee.employment_status.lower() != "exited"
        ):
            continue

        asset = (
            db.query(Asset)
            .filter(
                Asset.asset_id == assignment.asset_id
            )
            .first()
        )

        if not asset:
            continue

        pending_returns.append(
            PendingReturnResponse(
                assignment_id=assignment.assignment_id,
                asset_id=asset.asset_id,
                tag=asset.tag,
                asset_type=asset.asset_type,
                employee_id=employee.employee_id,
                employee_name=employee.name,
                assigned_date=assignment.assigned_date,
            )
        )

    return pending_returns


# ----------------------------
# Get Asset By ID
# ----------------------------
def get_asset_by_id(asset_id: str, db: Session):
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
def update_asset(asset_id: str, asset_data: AssetUpdate, db: Session):
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

    # Check if another asset already uses this tag
    existing_tag = (
        db.query(Asset)
        .filter(
            Asset.tag == asset_data.tag,
            Asset.asset_id != asset_id
        )
        .first()
    )

    if existing_tag:
        raise HTTPException(
            status_code=400,
            detail="Asset tag already exists."
        )
    # Assigned assets cannot have their status changed
    # Block changing to Assigned through Edit
    if (
       asset.status != "Assigned"
       and asset_data.status == "Assigned"
    ):
     raise HTTPException(
        status_code=400,
        detail="Assets can only be assigned using the Assign Asset action."
    )

# Block changing from Assigned through Edit
    if (
    asset.status == "Assigned"
    and asset_data.status != "Assigned"
):
     raise HTTPException(
        status_code=400,
        detail="Assigned assets must be returned using the Return Asset action."
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
def delete_asset(asset_id: str, db: Session):
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
def assign_asset(assignment: AssetAssignmentCreate, db: Session):
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
    # Asset must be available for assignment
    if asset.status != "In Stock":
        raise HTTPException(
            status_code=400,
            detail=f"Asset cannot be assigned because its status is '{asset.status}'."
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
def return_asset(assignment_id: str, return_data: AssetReturn, db: Session):
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
    asset.status = "In Stock"

    db.commit()
    db.refresh(assignment)

    return assignment


# ----------------------------
# Get Assignment History
# ----------------------------
def get_asset_history(asset_id: str, db: Session):
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

    result = []

    for assignment in history:

        employee = (
            db.query(Employee)
            .filter(
                Employee.employee_id == assignment.employee_id
            )
            .first()
        )

        result.append(
            AssetHistoryResponse(
                assignment_id=assignment.assignment_id,
                employee_id=assignment.employee_id,
                employee_name=employee.name if employee else None,
                assigned_date=assignment.assigned_date,
                returned_date=assignment.returned_date,
                remarks=assignment.remarks,
            )
        )

    return result


# ----------------------------
# Get Assets Assigned to Employee FR-AST-04
# Employees shall view their currently assigned assets.
# ----------------------------
def get_employee_assets(employee_id: str, db: Session):
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
