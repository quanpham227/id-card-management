from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app import models, schemas

# [QUAN TRỌNG 1]: Định nghĩa prefix ở đây
router = APIRouter(prefix="/api/assets", tags=["Assets"])

# ==========================================
# 1. GET ALL
# ==========================================

@router.get("", response_model=List[schemas.AssetResponse])
def get_assets(db: Session = Depends(get_db)):
    assets = db.query(models.Asset).order_by(models.Asset.id.desc()).all()
    return assets

# ==========================================
# 2. CREATE
# ==========================================
# [QUAN TRỌNG 3]: Cũng để chuỗi rỗng ""
@router.post("", response_model=schemas.AssetResponse, status_code=201)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    existing_asset = db.query(models.Asset).filter(models.Asset.asset_code == asset.asset_code).first()
    if existing_asset:
        raise HTTPException(status_code=400, detail="Asset Code already exists")

    db_asset = models.Asset(**asset.dict()) 
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    # Auto log
    initial_log = models.AssetHistory(
        asset_id=db_asset.id,
        date=date.today(),
        action_type="purchase",
        description="New asset created in system",
        performed_by="System"
    )
    db.add(initial_log)
    db.commit()
    return db_asset

# ==========================================
# 3. UPDATE (Có ID thì giữ nguyên /{asset_id})
# ==========================================
@router.put("/{asset_id}", response_model=schemas.AssetResponse)
def update_asset(asset_id: int, asset_update: schemas.AssetCreate, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # --- AUTO LOGGING ---
    today = date.today()
    old_emp_id = db_asset.assigned_to.get('employee_id') if db_asset.assigned_to else None
    new_emp_id = asset_update.assigned_to.employee_id if asset_update.assigned_to else None

    if old_emp_id != new_emp_id:
        if new_emp_id:
            db.add(models.AssetHistory(asset_id=asset_id, date=today, action_type="assign", description=f"Handover to: {asset_update.assigned_to.employee_name}", performed_by="System"))
        else:
            db.add(models.AssetHistory(asset_id=asset_id, date=today, action_type="checkin", description="Returned to Stock", performed_by="System"))

    if db_asset.usage_status != asset_update.usage_status:
        db.add(models.AssetHistory(asset_id=asset_id, date=today, action_type="status_change", description=f"Status: {db_asset.usage_status} -> {asset_update.usage_status}", performed_by="System"))
        
    if db_asset.health_status != asset_update.health_status and asset_update.health_status == "Critical":
        db.add(models.AssetHistory(asset_id=asset_id, date=today, action_type="broken", description="Reported Critical", performed_by="System"))

    # Update Data
    update_data = asset_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_asset, key, value)

    db.commit()
    db.refresh(db_asset)
    return db_asset

# ==========================================
# 4. DELETE
# ==========================================
@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(db_asset)
    db.commit()
    return {"success": True}

# ==========================================
# 5. HISTORY API
# ==========================================
@router.get("/{asset_id}/history", response_model=List[schemas.AssetHistoryResponse])
def get_asset_history(asset_id: int, db: Session = Depends(get_db)):
    return db.query(models.AssetHistory).filter(models.AssetHistory.asset_id == asset_id).order_by(models.AssetHistory.date.desc()).all()

@router.post("/{asset_id}/history", response_model=schemas.AssetHistoryResponse)
def add_manual_log(asset_id: int, log: schemas.AssetHistoryCreate, db: Session = Depends(get_db)):
    new_log = models.AssetHistory(
        asset_id=asset_id,
        date=log.date,
        action_type=log.action_type,
        description=log.description,
        performed_by=log.performed_by or "IT Admin"
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log