from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/categories", tags=["Categories"])

# ==========================================
# 1. GET ALL (Lấy danh sách)
# ==========================================
@router.get("", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.AssetCategory).all()

# ==========================================
# 2. CREATE (Tạo mới)
# ==========================================
@router.post("", response_model=schemas.CategoryResponse, status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    # Kiểm tra trùng Mã (Code) hoặc Tên (Name)
    if db.query(models.AssetCategory).filter(models.AssetCategory.code == category.code).first():
        raise HTTPException(status_code=400, detail="Category Code already exists")
    
    if db.query(models.AssetCategory).filter(models.AssetCategory.name == category.name).first():
        raise HTTPException(status_code=400, detail="Category Name already exists")

    try:
        db_cat = models.AssetCategory(**category.dict())
        db.add(db_cat)
        db.commit()
        db.refresh(db_cat)
        return db_cat
    except Exception as e:
        db.rollback()
        print(f"Error creating category: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")

# ==========================================
# 3. UPDATE (Cập nhật)
# ==========================================
@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(category_id: int, category_update: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.AssetCategory).filter(models.AssetCategory.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # Kiểm tra trùng code với thằng khác (nếu code bị thay đổi)
    if category_update.code != db_cat.code:
        if db.query(models.AssetCategory).filter(models.AssetCategory.code == category_update.code).first():
             raise HTTPException(status_code=400, detail="Category Code already exists")

    try:
        db_cat.name = category_update.name
        db_cat.code = category_update.code
        db_cat.description = category_update.description
        
        db.commit()
        db.refresh(db_cat)
        return db_cat
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update category")

# ==========================================
# 4. DELETE (Xóa - Có kiểm tra ràng buộc)
# ==========================================
@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.AssetCategory).filter(models.AssetCategory.id == category_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Category not found")

    # [QUAN TRỌNG] Kiểm tra xem có tài sản nào đang dùng danh mục này không?
    linked_assets = db.query(models.Asset).filter(models.Asset.category_id == category_id).first()
    if linked_assets:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete category because it is assigned to existing assets."
        )

    try:
        db.delete(db_cat)
        db.commit()
        return {"success": True, "message": "Category deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete category")