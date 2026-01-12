from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from app.oauth2 import get_current_user

# Lưu ý: Thông thường prefix ở đây là "/ticket-categories" và được include vào main.py với prefix "/api"
# Nếu bạn khai báo trực tiếp ở đây là "/api/...", hãy đảm bảo main.py không bị lặp prefix.
router = APIRouter(
    prefix="/api/ticket-categories",
    tags=["Ticket Settings"]
)

# ==========================================
# 1. LẤY DANH SÁCH DANH MỤC
# ==========================================
@router.get("", response_model=List[schemas.TicketCategoryResponse])
def get_categories(
    active_only: bool = False,  # True: Chỉ lấy cái đang hoạt động
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.TicketCategory)

    if active_only:
        query = query.filter(models.TicketCategory.is_active == True)

    # Sắp xếp theo ID để danh sách không bị nhảy lung tung khi update
    return query.order_by(models.TicketCategory.id).all()


# ==========================================
# 2. TẠO DANH MỤC MỚI (Chỉ Admin/IT/Manager)
# ==========================================
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

    # Tạo mới (Sử dụng model_dump() cho Pydantic v2, hoặc dict() cho v1)
    # new_category = models.TicketCategory(**category.dict())
    new_category = models.TicketCategory(**category.model_dump())
    
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category


# ==========================================
# 3. CẬP NHẬT DANH MỤC (Sửa tên, SLA, ẩn/hiện)
# ==========================================
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
    # update_data = category_update.dict(exclude_unset=True)
    update_data = category_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category


# ==========================================
# 4. XÓA DANH MỤC (XỬ LÝ THÔNG MINH / SMART DELETE)
# ==========================================
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "IT", "Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # 1. Tìm Category
    db_category = (
        db.query(models.TicketCategory)
        .filter(models.TicketCategory.id == category_id)
        .first()
    )
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # 2. KIỂM TRA RÀNG BUỘC DỮ LIỆU
    # Đếm xem có bao nhiêu ticket đang sử dụng category này
    linked_tickets_count = db.query(models.Ticket).filter(models.Ticket.category_id == category_id).count()

    # 3. XỬ LÝ
    if linked_tickets_count > 0:
        # TRƯỜNG HỢP A: Đã có vé sử dụng -> XÓA MỀM (Chỉ ẩn đi)
        # Để các ticket cũ vẫn hiển thị tên danh mục, không bị lỗi dữ liệu.
        db_category.is_active = False
        db.commit()
        return {
            "message": "Category has been archived (Soft Deleted) because it is used by existing tickets.",
            "status": "archived"
        }
    else:
        # TRƯỜNG HỢP B: Chưa có vé nào dùng -> XÓA VĨNH VIỄN
        # Để sạch Database vì danh mục này chưa từng được dùng.
        db.delete(db_category)
        db.commit()
        return {
            "message": "Category deleted permanently.",
            "status": "deleted"
        }