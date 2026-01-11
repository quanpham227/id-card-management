import os
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app import models, schemas
from app.oauth2 import get_current_user

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


# --- 1. TẠO TICKET (Dùng JSON Schema thay vì Form để đồng bộ với ticket_upload.py) ---
@router.post("", response_model=schemas.TicketResponse)
async def create_ticket(
    ticket_in: schemas.TicketCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    file_paths = []
    if ticket_in.attachment_url:
        file_paths = [
            path.strip() for path in ticket_in.attachment_url.split(",") if path.strip()
        ]

    # ĐẢM BẢO các tham số truyền vào đây khớp 100% với Column trong models.py
    new_ticket = models.Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        category_id=ticket_in.category_id,  # Đã sửa từ 'category' thành 'category_id'
        asset_id=ticket_in.asset_id,  # Đã thêm asset_id
        priority=str(ticket_in.priority),
        status="Open",
        attachments=file_paths,
        requester_id=current_user.id,
        created_at=datetime.now(),
    )

    try:
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)
        return new_ticket
    except Exception as e:
        db.rollback()
        print(f"Database Error Details: {e}")  # Debug lỗi chi tiết ra console
        raise HTTPException(
            status_code=500, detail="Could not save ticket to database."
        )


# --- 2. LẤY DANH SÁCH "MY TICKETS" ---
# app/routers/tickets.py


# Sửa hàm get_my_tickets
@router.get(
    "/my-tickets", response_model=schemas.TicketPaginationResponse
)  # Đổi Schema trả về
def get_my_tickets(
    page: int = 1,
    size: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Query cơ bản: Lọc theo người tạo (requester_id)
    query = (
        db.query(models.Ticket)
        .options(joinedload(models.Ticket.ticket_category))
        .filter(models.Ticket.requester_id == current_user.id)
    )

    # Đếm tổng số
    total_records = query.count()

    # Phân trang
    skip = (page - 1) * size
    tickets = (
        query.order_by(desc(models.Ticket.created_at)).offset(skip).limit(size).all()
    )

    # Trả về đúng format Schema phân trang
    return {"items": tickets, "total": total_records, "page": page, "size": size}


# --- 3. QUẢN LÝ TICKET (Cho Admin/Manager) ---
@router.get("/manage", response_model=schemas.TicketPaginationResponse)
def manage_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    page: int = 1,  # Trang hiện tại (Mặc định trang 1)
    size: int = 10,  # Số lượng mỗi trang (Mặc định 10)
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    # 1. Tạo Query cơ bản
    query = db.query(models.Ticket).options(
        joinedload(models.Ticket.requester),
        joinedload(models.Ticket.assignee),
        joinedload(models.Ticket.ticket_category),
    )

    # 2. Áp dụng bộ lọc (Filter)
    if status and status != "All":
        query = query.filter(models.Ticket.status == status)
    if priority and priority != "All":
        query = query.filter(models.Ticket.priority == priority)

    # 3. Đếm tổng số bản ghi (Total) TRƯỚC khi cắt trang
    total_records = query.count()

    # 4. Tính toán Skip (Offset) và lấy dữ liệu
    skip = (page - 1) * size
    tickets = (
        query.order_by(desc(models.Ticket.created_at)).offset(skip).limit(size).all()
    )

    # 5. Trả về đúng format Schema
    return {"items": tickets, "total": total_records, "page": page, "size": size}


# --- 4. CHI TIẾT TICKET & COMMENT ---
from sqlalchemy.orm import joinedload


@router.get("/{ticket_id}", response_model=schemas.TicketResponse)
def get_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Sử dụng joinedload để lấy luôn thông tin User và Category trong 1 lần truy vấn
    ticket = (
        db.query(models.Ticket)
        .options(
            joinedload(models.Ticket.requester),
            joinedload(models.Ticket.assignee),
            joinedload(
                models.Ticket.ticket_category
            ),  # Đảm bảo tên này khớp với relationship trong models.py
            joinedload(models.Ticket.comments).joinedload(
                models.TicketComment.user
            ),  # Lấy luôn người comment
        )
        .filter(models.Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Kiểm tra quyền xem
    is_manager = current_user.role in ["Admin", "Manager"]
    if ticket.requester_id != current_user.id and not is_manager:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this ticket"
        )

    return ticket


# --- 5. CẬP NHẬT TRẠNG THÁI ---
@router.put("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(
    ticket_id: int,
    update_data: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_manager = current_user.role in ["Admin", "Manager"]

    # 1. Phân quyền cập nhật
    if not is_manager:
        if ticket.requester_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if update_data.status not in ["Cancelled", "Open"]:
            raise HTTPException(
                status_code=403, detail="Users can only Cancel or Re-open tickets"
            )

    # 2. Thực hiện cập nhật trạng thái
    if update_data.status:
        ticket.status = update_data.status
        if update_data.status == "Resolved":
            ticket.resolved_at = datetime.now()

    # 3. Logic dành riêng cho Manager/Admin
    if is_manager:
        if update_data.priority:
            ticket.priority = update_data.priority

        # FIX: Xử lý logic "Assign to Me"
        if update_data.assignee_id:
            # Nếu frontend gửi chuỗi "me" (cần check type vì schema có thể validate int)
            # Hoặc đơn giản là kiểm tra một giá trị đặc biệt
            if update_data.assignee_id == -1:  # Giả sử ta quy ước -1 là "me"
                ticket.assignee_id = current_user.id
            else:
                ticket.assignee_id = update_data.assignee_id

        if update_data.category_id:
            ticket.category_id = update_data.category_id

    # 4. Ghi log hệ thống qua Comment
    if update_data.resolution_note:
        log = models.TicketComment(
            ticket_id=ticket.id,
            user_id=current_user.id,
            content=f"System Update: {update_data.resolution_note}",
            type="System",
        )
        db.add(log)

    ticket.updated_at = datetime.now()
    db.commit()
    db.refresh(ticket)
    return ticket


# --- 6. GỬI COMMENT ---
@router.post("/{ticket_id}/comments", response_model=schemas.TicketCommentResponse)
def add_comment(
    ticket_id: int,
    comment_data: schemas.TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_manager = current_user.role in ["Admin", "Manager"]
    if ticket.requester_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Access denied")

    new_comment = models.TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=comment_data.content,
        type=comment_data.type or "Comment",
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


# --- 7. THỐNG KÊ DASHBOARD ---
@router.get("/stats/summary", response_model=schemas.TicketStats)
def get_ticket_stats(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Đếm trực tiếp từ Database
    total = db.query(models.Ticket).count()
    open_count = db.query(models.Ticket).filter(models.Ticket.status == "Open").count()
    in_progress = (
        db.query(models.Ticket).filter(models.Ticket.status == "In Progress").count()
    )
    resolved = (
        db.query(models.Ticket).filter(models.Ticket.status == "Resolved").count()
    )

    # Priority '4' thường là Critical
    critical = (
        db.query(models.Ticket)
        .filter(models.Ticket.priority == "4", models.Ticket.status != "Resolved")
        .count()
    )

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "critical": critical,
    }


@router.get("/manage/open-only", response_model=List[schemas.TicketResponse])
def get_open_tickets(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    # Chỉ Admin/Manager mới được gọi
    if current_user.role not in ["Admin", "Manager"]:
        return []

    # Lấy tất cả ticket có status là "Open" và sắp xếp mới nhất lên đầu
    tickets = (
        db.query(models.Ticket)
        .options(joinedload(models.Ticket.requester))
        .filter(models.Ticket.status == "Open")
        .order_by(desc(models.Ticket.created_at))
        .limit(10)
        .all()
    )

    return tickets
