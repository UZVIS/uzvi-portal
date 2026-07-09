from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.assets.models import Asset
from app.modules.assets.schemas import (
    AssetCreate,
    AssetResponse,
)

router =APIRouter(
    prefix="/api/v1/assets", 
    tags=["Asset Management Operations"]
)

@router.post("/", response_model=AssetResponse, status_code=201)

def create_asset(
    asset: AssetCreate,
    db: Session =Depends(get_db)
):
    existing_asset = db.query(Asset).filter(Asset.asset_id == asset.asset_id).first()
    if existing_asset:
        raise HTTPException(
            status_code=400, detail="Asset with this ID already exists."
        )
    new_asset = Asset(**asset.model_dump())
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset


@router.get("/", response_model=list[AssetResponse])
def get_all_assets(
    db: Session = Depends(get_db)
):
    return db.query(Asset).all()



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
    asset.status = asset_data.status

    db.commit()
    db.refresh(asset)

    return asset


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

    db.delete(asset)
    db.commit()

    return {
        "message": "Asset deleted successfully"
    }