from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.oauth2 import get_current_user

router = APIRouter(prefix="/api/ticket-categories", tags=["Ticket Settings"])


# --- 1. LẤY DANH SÁCH DANH MỤC ---
# Ai cũng gọi được (để hiển thị lên dropdown khi tạo ticket)
@router.get("", response_model=List[schemas.TicketCategoryResponse])
def get_categories(
    active_only: bool = False,  # True: Chỉ lấy cái đang hoạt động
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.TicketCategory)

    if active_only:
        query = query.filter(models.TicketCategory.is_active == True)

    return query.all()


# --- 2. TẠO DANH MỤC MỚI (Chỉ Admin/IT/Manager) ---
@router.post("", response_model=schemas.TicketCategoryResponse)
def create_category(
    category: schemas.TicketCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Check quyền
    if current_user.role not in ["Admin", "IT", "Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # Check trùng tên hoặc code
    existing = (
        db.query(models.TicketCategory)
        .filter(
            (models.TicketCategory.name == category.name)
            | (models.TicketCategory.code == category.code)
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400, detail="Category Name or Code already exists"
        )

    new_category = models.TicketCategory(**category.dict())
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category


# --- 3. CẬP NHẬT DANH MỤC (Sửa tên, SLA, ẩn/hiện) ---
@router.put("/{category_id}", response_model=schemas.TicketCategoryResponse)
def update_category(
    category_id: int,
    category_update: schemas.TicketCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "IT", "Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    db_category = (
        db.query(models.TicketCategory)
        .filter(models.TicketCategory.id == category_id)
        .first()
    )
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Cập nhật các trường có gửi lên
    update_data = category_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category


# --- 4. XÓA DANH MỤC (Xóa cứng) ---
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "IT"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    db_category = (
        db.query(models.TicketCategory)
        .filter(models.TicketCategory.id == category_id)
        .first()
    )
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Lưu ý: Nếu đã có Ticket dùng category này thì có thể gây lỗi hoặc mất dữ liệu logic.
    # Nên khuyến khích dùng Soft Delete (Update is_active = False) thay vì Delete này.

    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}
