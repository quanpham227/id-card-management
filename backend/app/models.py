from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from sqlalchemy import DateTime

# --- BẢNG TÀI SẢN (CŨ) ---
class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String, unique=True, index=True)
    type = Column(String) 
    model = Column(String)
    health_status = Column(String, default="Good")
    usage_status = Column(String, default="Spare") # In Use, Spare, Broken
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Thông tin specs, software, monitor lưu dạng JSON
    specs = Column(JSON, nullable=True)
    software = Column(JSON, nullable=True)
    monitor = Column(JSON, nullable=True)
    
    # Thông tin người đang dùng (lưu JSON cho gọn, hoặc quan hệ bảng Employees nếu muốn chặt chẽ)
    assigned_to = Column(JSON, nullable=True) 

    # [MỚI] MỐI QUAN HỆ VỚI LỊCH SỬ
    history_logs = relationship("AssetHistory", back_populates="asset", cascade="all, delete-orphan")


# --- [MỚI] BẢNG LỊCH SỬ ---
class AssetHistory(Base):
    __tablename__ = "asset_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    
    date = Column(Date, default=func.now())  # Ngày diễn ra sự kiện
    action_type = Column(String)             # Loại: 'purchase', 'assign', 'repair', 'broken'...
    description = Column(Text)               # Mô tả chi tiết
    performed_by = Column(String)            # Người thực hiện (Admin/IT)

    # Relationship ngược lại
    asset = relationship("Asset", back_populates="history_logs")

    # --- [MỚI] BẢNG LỊCH SỬ IN THẺ (KHÔNG CẦN BẢNG EMPLOYEE) ---
class PrintLog(Base):
    __tablename__ = "print_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Chúng ta lưu cứng thông tin nhân viên tại thời điểm in
    employee_id = Column(String, index=True) 
    employee_name = Column(String)           
    department = Column(String)
    job_title = Column(String, nullable=True) # Lưu thêm chức vụ nếu cần
    
    printed_at = Column(DateTime, default=func.now()) # Thời gian in
    printed_by = Column(String, default="Admin")      # Người thực hiện in
    reason = Column(String, default="New Issue")      # Lý do in

class ToolPrintLog(Base):
    __tablename__ = "tool_print_logs"

    id = Column(Integer, primary_key=True, index=True)
    card_type = Column(String)          # Loại thẻ: 'Visitor', 'Contractor', 'Backside'...
    serial_number = Column(String)      # Số thẻ: '001', '015', 'N/A'
    orientation = Column(String)        # Hướng in: 'portrait' hoặc 'landscape'
    quantity = Column(Integer, default=1)
    
    printed_at = Column(DateTime, default=func.now()) # Thời gian in
    printed_by = Column(String, default="Admin")      # Người in


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String) # Lưu password đã mã hóa, KHÔNG lưu text thường
    role = Column(String) # Admin, IT, HR, Staff
    is_active = Column(Boolean, default=True)