from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# --- [MỚI] BẢNG DANH MỤC THIẾT BỊ ---
class AssetCategory(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # Ví dụ: "Laptop", "PC"
    code = Column(String, unique=True)              # Ví dụ: "LPT", "PC"
    description = Column(Text, nullable=True)
    
    # Quan hệ 1-nhiều: Một Category có nhiều Asset
    assets = relationship("Asset", back_populates="category")


# --- BẢNG TÀI SẢN (SỬA ĐỔI) ---
class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String, unique=True, index=True)
    
    # [SỬA ĐỔI]: Thay cột type (String) bằng Foreign Key trỏ tới categories
    # Lưu ý: Cột type cũ vẫn có thể giữ lại làm 'backup' hoặc xóa đi nếu migrate dữ liệu
    # Ở đây mình thêm cột mới category_id
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    # Nếu muốn giữ lại cột type để tương thích code cũ trong thời gian chuyển đổi
    # type = Column(String, nullable=True) 

    model = Column(String)
    health_status = Column(String, default="Good")
    usage_status = Column(String, default="Spare") # In Use, Spare, Broken
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Thông tin specs, software, monitor lưu dạng JSON
    specs = Column(JSON, nullable=True)
    software = Column(JSON, nullable=True)
    monitor = Column(JSON, nullable=True)
    
    # Thông tin người đang dùng
    assigned_to = Column(JSON, nullable=True) 

    # Mối quan hệ
    history_logs = relationship("AssetHistory", back_populates="asset", cascade="all, delete-orphan")
    category = relationship("AssetCategory", back_populates="assets")


# --- BẢNG LỊCH SỬ (GIỮ NGUYÊN) ---
class AssetHistory(Base):
    __tablename__ = "asset_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    
    date = Column(Date, default=func.now())  
    action_type = Column(String)             
    description = Column(Text)               
    performed_by = Column(String)            

    asset = relationship("Asset", back_populates="history_logs")


# --- BẢNG PRINT LOG (GIỮ NGUYÊN) ---
class PrintLog(Base):
    __tablename__ = "print_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, index=True) 
    employee_name = Column(String)           
    department = Column(String)
    job_title = Column(String, nullable=True)
    printed_at = Column(DateTime, default=func.now())
    printed_by = Column(String, default="Admin")
    reason = Column(String, default="New Issue")

class ToolPrintLog(Base):
    __tablename__ = "tool_print_logs"

    id = Column(Integer, primary_key=True, index=True)
    card_type = Column(String)
    serial_number = Column(String)
    orientation = Column(String)
    quantity = Column(Integer, default=1)
    printed_at = Column(DateTime, default=func.now())
    printed_by = Column(String, default="Admin")


# --- BẢNG USER (GIỮ NGUYÊN) ---
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String)
    is_active = Column(Boolean, default=True)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    
    # Phân loại: Hardware, Software, Network...
    category = Column(String) 
    
    # Mức độ: Low, Medium, High, Critical
    priority = Column(String, default="Medium") 
    
    # Trạng thái: Open, In Progress, Resolved, Closed, Cancelled
    status = Column(String, default="Open", index=True)
    
    # File đính kèm (Lưu dạng JSON list đường dẫn file)
    attachments = Column(JSON, nullable=True)

    # Thời gian
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime, nullable=True)

    # Người tạo yêu cầu (Requester)
    requester_id = Column(Integer, ForeignKey("users.id"))
    
    # Người xử lý (Assignee - IT/Admin)
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Quan hệ
    requester = relationship("User", foreign_keys=[requester_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
    
    # Quan hệ tới các comment/log
    comments = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Người comment
    
    content = Column(Text)
    created_at = Column(DateTime, default=func.now())
    
    # Loại: 'Comment' (Trao đổi), 'System' (Log đổi trạng thái), 'Internal' (Ghi chú nội bộ IT)
    type = Column(String, default="Comment") 

    ticket = relationship("Ticket", back_populates="comments")
    user = relationship("User")


# --- BẢNG DANH MỤC LOẠI TICKET ---
class TicketCategory(Base):
    __tablename__ = "ticket_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Ví dụ: Hardware, Software
    code = Column(String, unique=True)             # Ví dụ: HW, SW
    description = Column(String, nullable=True)
    sla_hours = Column(Integer, default=24)        # Cam kết xử lý trong bao lâu
    is_active = Column(Boolean, default=True)      # True: Đang dùng, False: Tạm ẩn