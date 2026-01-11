import os
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app import models, schemas
from app.oauth2 import get_current_user

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"]
)

# --- CẤU HÌNH UPLOAD ---
UPLOAD_DIR = "images/tickets"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_MIME_TYPES = [
    "image/jpeg", "image/png", "image/jpg",
    "application/pdf", 
    "text/plain",
    "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # .docx
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"      # .xlsx
]

# --- 1. TẠO TICKET (Hỗ trợ File Upload & Validation) ---
@router.post("", response_model=schemas.TicketResponse)
async def create_ticket(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    priority: str = Form("Medium"),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Xử lý file upload
    file_paths = []
    
    if files:
        for file in files:
            # [CHECK 1] Kiểm tra định dạng file
            if file.content_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{file.filename}' không hợp lệ. Chỉ chấp nhận Ảnh, PDF, Word, Excel."
                )

            # [CHECK 2] Kiểm tra dung lượng file
            file.file.seek(0, 2) # Di chuyển con trỏ xuống cuối file
            file_size = file.file.tell()
            file.file.seek(0) # Reset con trỏ về đầu

            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File '{file.filename}' quá lớn. Tối đa cho phép là 5MB."
                )

        # [LƯU FILE]
        for file in files:
            if file.filename:
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
                file_location = f"{UPLOAD_DIR}/{safe_filename}"
                
                with open(file_location, "wb+") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                file_paths.append(f"/images/tickets/{safe_filename}")

    # 2. Tạo Ticket trong DB
    new_ticket = models.Ticket(
        title=title,
        description=description,
        category=category,
        priority=priority,
        status="Open",
        attachments=file_paths,
        requester_id=current_user.id
    )
    
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

# --- 2. LẤY DANH SÁCH "MY TICKETS" (Của người dùng đang login) ---
@router.get("/my-tickets", response_model=List[schemas.TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tickets = db.query(models.Ticket)\
        .filter(models.Ticket.requester_id == current_user.id)\
        .order_by(desc(models.Ticket.created_at))\
        .all()
    return tickets

# --- 3. QUẢN LÝ TICKET (Cho Admin/Manager) ---
@router.get("/manage", response_model=List[schemas.TicketResponse])
def manage_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # [FIX ROLE]: Chỉ Admin và Manager được quyền quản lý
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    query = db.query(models.Ticket)

    if status and status != "All":
        query = query.filter(models.Ticket.status == status)
    
    if priority and priority != "All":
        query = query.filter(models.Ticket.priority == priority)

    return query.order_by(desc(models.Ticket.created_at)).all()

# --- 4. CHI TIẾT TICKET & COMMENT ---
@router.get("/{ticket_id}", response_model=schemas.TicketResponse)
def get_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Quyền xem: Người tạo (Requester) HOẶC Quản lý (Admin/Manager)
    is_manager = current_user.role in ["Admin", "Manager"]
    
    if ticket.requester_id != current_user.id and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
        
    return ticket

# --- 5. CẬP NHẬT TRẠNG THÁI / GÁN NGƯỜI XỬ LÝ ---
@router.put("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(
    ticket_id: int,
    update_data: schemas.TicketUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # [FIX ROLE]: Kiểm tra quyền quản lý
    is_manager = current_user.role in ["Admin", "Manager"]

    # Logic 1: Người thường (Requester) chỉ được Hủy hoặc Re-open ticket của mình
    if not is_manager:
        if ticket.requester_id != current_user.id:
             raise HTTPException(status_code=403, detail="Access denied")
             
        if update_data.status in ["Cancelled", "Open"]:
            ticket.status = update_data.status
            # Log action
            log = models.TicketComment(
                ticket_id=ticket.id, user_id=current_user.id, type="System",
                content=f"Changed status to {update_data.status}"
            )
            db.add(log)
            db.commit()
            db.refresh(ticket)
            return ticket
        else:
            raise HTTPException(status_code=403, detail="You can only Cancel or Re-open your ticket")

    # Logic 2: Admin/Manager được update mọi thứ
    if update_data.status:
        ticket.status = update_data.status
        if update_data.status == "Resolved":
            ticket.resolved_at = datetime.now()
            
    if update_data.priority:
        ticket.priority = update_data.priority
        
    if update_data.assignee_id:
        ticket.assignee_id = update_data.assignee_id
    
    # Cập nhật Category nếu có (ví dụ Staff chọn sai danh mục, Admin sửa lại)
    if update_data.category:
        ticket.category = update_data.category

    # Log sự thay đổi nếu có resolution note
    if update_data.resolution_note:
        comment = models.TicketComment(
            ticket_id=ticket.id,
            user_id=current_user.id,
            content=f"Resolution Note: {update_data.resolution_note}",
            type="System"
        )
        db.add(comment)

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
    current_user: models.User = Depends(get_current_user)
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Cho phép ai xem được ticket thì đều được comment
    # (Quyền xem đã được check ở frontend, nhưng check lại ở đây cho chắc nếu muốn chặt chẽ hơn)
    is_manager = current_user.role in ["Admin", "Manager"]
    if ticket.requester_id != current_user.id and not is_manager:
         raise HTTPException(status_code=403, detail="Access denied")

    new_comment = models.TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=comment_data.content,
        type=comment_data.type
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# --- 7. BÁO CÁO THỐNG KÊ (Cho Dashboard) ---
@router.get("/stats/summary", response_model=schemas.TicketStats)
def get_ticket_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # [FIX ROLE]: Chỉ Admin/Manager xem đc
    if current_user.role not in ["Admin", "Manager"]:
         raise HTTPException(status_code=403, detail="Access denied")

    total = db.query(models.Ticket).count()
    open_t = db.query(models.Ticket).filter(models.Ticket.status == "Open").count()
    in_prog = db.query(models.Ticket).filter(models.Ticket.status == "In Progress").count()
    resolved = db.query(models.Ticket).filter(models.Ticket.status == "Resolved").count()
    critical = db.query(models.Ticket).filter(models.Ticket.priority == "Critical", models.Ticket.status != "Resolved").count()

    return {
        "total": total,
        "open": open_t,
        "in_progress": in_prog,
        "resolved": resolved,
        "critical": critical
    }