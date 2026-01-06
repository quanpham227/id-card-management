from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app import models, schemas

# [QUAN TRỌNG]: Định nghĩa prefix là /api/assets
# Các route con sẽ tự động nối thêm vào sau prefix này
router = APIRouter(prefix="/api/assets", tags=["Assets"])

# ==========================================
# 1. GET ALL ASSETS (Chỉ đọc)
# ==========================================
@router.get("", response_model=List[schemas.AssetResponse])
def get_assets(db: Session = Depends(get_db)):
    try:
        assets = db.query(models.Asset).order_by(models.Asset.id.desc()).all()
        return assets
    except Exception as e:
        print(f"Error fetching assets: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# ==========================================
# 2. CREATE ASSET (Cần Rollback & Atomicity)
# ==========================================
@router.post("", response_model=schemas.AssetResponse, status_code=201)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra trùng mã
    existing_asset = db.query(models.Asset).filter(models.Asset.asset_code == asset.asset_code).first()
    if existing_asset:
        raise HTTPException(status_code=400, detail="Asset Code already exists")

    try:
        # 2. Tạo Asset
        db_asset = models.Asset(**asset.dict()) 
        db.add(db_asset)
        
        # Dùng flush() để lấy ID ngay lập tức mà chưa commit hẳn
        db.flush() 
        
        # 3. Auto log: Ghi nhận sự kiện mua mới
        initial_log = models.AssetHistory(
            asset_id=db_asset.id,
            date=asset.purchase_date or date.today(),
            action_type="purchase",
            description="New asset created in system",
            performed_by="System"
        )
        db.add(initial_log)

        # 4. Commit 1 lần duy nhất
        db.commit()
        db.refresh(db_asset)
        return db_asset

    except Exception as e:
        db.rollback() # <--- Hoàn tác nếu lỗi
        print(f"Error creating asset: {e}")
        raise HTTPException(status_code=500, detail="Failed to create asset")

# ==========================================
# 3. UPDATE ASSET (Logic tự động ghi log)
# ==========================================
@router.put("/{asset_id}", response_model=schemas.AssetResponse)
def update_asset(asset_id: int, asset_update: schemas.AssetCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra tồn tại
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    try:
        # 2. --- AUTO LOGGING LOGIC ---
        today = date.today()
        # Lấy thông tin người dùng cũ/mới an toàn
        old_emp_id = db_asset.assigned_to.get('employee_id') if db_asset.assigned_to else None
        new_emp_id = asset_update.assigned_to.employee_id if asset_update.assigned_to else None

        # Logic chuyển giao/thu hồi
        if old_emp_id != new_emp_id:
            if new_emp_id:
                # Gán cho người mới
                db.add(models.AssetHistory(
                    asset_id=asset_id, 
                    date=today, 
                    action_type="assign", 
                    description=f"Handover to: {asset_update.assigned_to.employee_name}", 
                    performed_by="System"
                ))
            else:
                # Thu hồi về kho
                db.add(models.AssetHistory(
                    asset_id=asset_id, 
                    date=today, 
                    action_type="checkin", 
                    description="Returned to Stock", 
                    performed_by="System"
                ))

        # Logic thay đổi trạng thái (In Use <-> Spare <-> Broken)
        if db_asset.usage_status != asset_update.usage_status:
            db.add(models.AssetHistory(
                asset_id=asset_id, 
                date=today, 
                action_type="status_change", 
                description=f"Status: {db_asset.usage_status} -> {asset_update.usage_status}", 
                performed_by="System"
            ))
            
        # Logic báo hỏng (Health: Critical)
        if db_asset.health_status != asset_update.health_status and asset_update.health_status == "Critical":
            db.add(models.AssetHistory(
                asset_id=asset_id, 
                date=today, 
                action_type="broken", 
                description="Reported Critical Health", 
                performed_by="System"
            ))

        # 3. Cập nhật dữ liệu chính vào Asset
        update_data = asset_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_asset, key, value)

        # 4. Lưu tất cả
        db.commit()
        db.refresh(db_asset)
        return db_asset

    except Exception as e:
        db.rollback()
        print(f"Error updating asset: {e}")
        raise HTTPException(status_code=500, detail="Failed to update asset")

# ==========================================
# 4. DELETE ASSET
# ==========================================
@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    try:
        db.delete(db_asset)
        db.commit()
        return {"success": True, "message": "Asset deleted"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting asset: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete asset")

# ==========================================
# 5. GET HISTORY (Xem lịch sử của 1 tài sản)
# ==========================================
@router.get("/{asset_id}/history", response_model=List[schemas.AssetHistoryResponse])
def get_asset_history(asset_id: int, db: Session = Depends(get_db)):
    try:
        return db.query(models.AssetHistory).filter(models.AssetHistory.asset_id == asset_id).order_by(models.AssetHistory.date.desc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching history")

# ==========================================
# 6. ADD HISTORY LOG (Thêm thủ công)
# ==========================================
@router.post("/{asset_id}/history", response_model=schemas.AssetHistoryResponse)
def add_manual_log(asset_id: int, log: schemas.AssetHistoryCreate, db: Session = Depends(get_db)):
    # Kiểm tra asset tồn tại trước khi thêm log
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    try:
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
    except Exception as e:
        db.rollback()
        print(f"Error adding log: {e}")
        raise HTTPException(status_code=500, detail="Failed to add log")

# ==========================================
# 7. UPDATE HISTORY LOG (Sửa log) - [MỚI]
# ==========================================
@router.put("/history/{log_id}", response_model=schemas.AssetHistoryResponse)
def update_history_log(log_id: int, log_update: schemas.AssetHistoryCreate, db: Session = Depends(get_db)):
    # Tìm log cần sửa
    db_log = db.query(models.AssetHistory).filter(models.AssetHistory.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="History log not found")

    try:
        # Cập nhật thông tin
        db_log.date = log_update.date
        db_log.action_type = log_update.action_type
        db_log.description = log_update.description
        if log_update.performed_by:
            db_log.performed_by = log_update.performed_by
        
        db.commit()
        db.refresh(db_log)
        return db_log
    except Exception as e:
        db.rollback()
        print(f"Error updating log: {e}")
        raise HTTPException(status_code=500, detail="Failed to update log")

# ==========================================
# 8. DELETE HISTORY LOG (Xóa log) - [MỚI]
# ==========================================
@router.delete("/history/{log_id}")
def delete_history_log(log_id: int, db: Session = Depends(get_db)):
    # Tìm log cần xóa
    db_log = db.query(models.AssetHistory).filter(models.AssetHistory.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="History log not found")

    try:
        db.delete(db_log)
        db.commit()
        return {"success": True, "message": "Log deleted"}
    except Exception as e:
        db.rollback()
        print(f"Error deleting log: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete log")