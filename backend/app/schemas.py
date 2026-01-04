from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

# ==========================================
# 1. SCHEMAS CHO LỊCH SỬ (HISTORY) - [MỚI]
# ==========================================

# Dùng để nhận dữ liệu khi thêm thủ công (Add Log)
class AssetHistoryCreate(BaseModel):
    date: date
    action_type: str  # 'repair', 'upgrade', 'note'...
    description: str
    performed_by: Optional[str] = "Admin"

# Dùng để trả dữ liệu về Frontend (có thêm id)
class AssetHistoryResponse(AssetHistoryCreate):
    id: int
    asset_id: int

    class Config:
        from_attributes = True

# ==========================================
# 2. SCHEMAS CHO TÀI SẢN (ASSETS)
# ==========================================

class AssignedToModel(BaseModel):
    employee_id: str
    employee_name: str
    department: str

# Schema cơ bản cho Asset (Dùng cho cả Create và Update)
class AssetBase(BaseModel):
    asset_code: str
    type: str           # PC / Laptop / Printer / Tablet / Monitor
    model: str
    health_status: Optional[str] = "Good"
    usage_status: Optional[str] = "Spare" # In Use, Spare, Broken
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    
    assigned_to: Optional[AssignedToModel] = None 
    
    specs: Optional[Dict[str, Any]] = {"cpu": "", "ram": "", "storage": "", "mainboard": ""}
    software: Optional[Dict[str, Any]] = {"os": "", "office": ""}
    monitor: Optional[Dict[str, Any]] = None

# Dùng để tạo mới (giống Base)
class AssetCreate(AssetBase):
    pass

# Dùng để trả về (có thêm ID và list history)
class AssetResponse(AssetBase):
    id: int
    # Nếu muốn trả kèm history luôn thì uncomment dòng dưới, nhưng nên dùng API riêng cho nhẹ
    # history_logs: List[AssetHistoryResponse] = []

    class Config:
        from_attributes = True

# ==========================================
# 3. SCHEMAS KHÁC (USER, PRINT...)
# ==========================================
# (Giữ nguyên phần cũ của bạn, chỉ chỉnh lại tên class cho chuẩn Pydantic nếu cần)
class LoginModel(BaseModel):
    username: str
    password: str

class UserModel(BaseModel):
    username: str
    password: str
    full_name: str
    role: str   # Admin / IT / HR

# ==========================================
# 4. SCHEMAS CHO PRINT LOG (Nếu có)
# ==========================================
class PrintLogRequest(BaseModel):
    employee_id: str
    employee_name: str
    employee_type: str
    maternity_type: str
    printed_at: str

# THÊM VÀO ĐOẠN NÀY:
class PrintItem(BaseModel):
    employee_id: str
    employee_name: str
    department: str
    job_title: Optional[str] = ""
    reason: Optional[str] = None

class PrintRequest(BaseModel):
    employees: List[PrintItem]
    reason: str = "New Issue"
    printed_by: str = "Admin"

# app/schemas.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ToolPrintCreate(BaseModel):
    card_type: str
    serial_number: str
    quantity: int
    orientation: str
    printed_by: Optional[str] = "Admin"

    class Config:
        from_attributes = True