from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# ==========================================
# 0. SCHEMAS CHO CATEGORY - [MỚI]
# ==========================================
class CategoryBase(BaseModel):
    name: str  # Laptop, PC
    code: str  # LPT, PC
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# 1. SCHEMAS CHO LỊCH SỬ
# ==========================================
class AssetHistoryCreate(BaseModel):
    date: date
    action_type: str
    description: str
    performed_by: Optional[str] = "Admin"

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

# Schema cơ bản cho Asset
class AssetBase(BaseModel):
    asset_code: str
    
    # [SỬA ĐỔI]: Thay 'type' bằng 'category_id'
    # Tuy nhiên, để tiện cho Frontend, khi tạo mới ta truyền ID danh mục
    category_id: Optional[int] = None 
    
    # Nếu muốn hỗ trợ cả nhập type string cũ (để tương thích ngược tạm thời):
    # type: Optional[str] = None 

    model: str
    health_status: Optional[str] = "Good"
    usage_status: Optional[str] = "Spare"
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    
    assigned_to: Optional[AssignedToModel] = None 
    
    specs: Optional[Dict[str, Any]] = {"cpu": "", "ram": "", "storage": "", "mainboard": ""}
    software: Optional[Dict[str, Any]] = {"os": "", "office": ""}
    monitor: Optional[Dict[str, Any]] = None

class AssetCreate(AssetBase):
    pass

# Khi trả về, ta muốn kèm thông tin chi tiết Category (tên) chứ không chỉ ID
class AssetResponse(AssetBase):
    id: int
    category: Optional[CategoryResponse] = None # Include chi tiết danh mục

    class Config:
        from_attributes = True


# ==========================================
# 3. SCHEMAS KHÁC (USER, PRINT...) - GIỮ NGUYÊN
# ==========================================
class LoginModel(BaseModel):
    username: str
    password: str

class UserModel(BaseModel):
    username: str
    password: str
    full_name: str
    role: str

class PrintLogRequest(BaseModel):
    employee_id: str
    employee_name: str
    employee_type: str
    maternity_type: str
    printed_at: str

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

class ToolPrintCreate(BaseModel):
    card_type: str
    serial_number: str
    quantity: int
    orientation: str
    printed_by: Optional[str] = "Admin"

    class Config:
        from_attributes = True

# -- Sub-schema cho User info gọn nhẹ --
class UserShortInfo(BaseModel):
    id: int
    full_name: str
    username: str
    role: str
    class Config:
        from_attributes = True

# -- Schema Comment --
class TicketCommentCreate(BaseModel):
    content: str
    type: Optional[str] = "Comment"

class TicketCommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    type: str
    user: Optional[UserShortInfo] = None
    class Config:
        from_attributes = True

# -- Schema Ticket --
# Lưu ý: TicketCreate dùng Form Data (xử lý trực tiếp trong Router), 
# nên ở đây chủ yếu định nghĩa Response và Update JSON.

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    category: Optional[str] = None
    resolution_note: Optional[str] = None # Dùng để add comment khi đóng

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    priority: str
    status: str
    attachments: Optional[List[str]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    requester: Optional[UserShortInfo] = None
    assignee: Optional[UserShortInfo] = None
    
    # Có thể include comments hoặc không tùy endpoint
    comments: Optional[List[TicketCommentResponse]] = []

    class Config:
        from_attributes = True

# -- Schema thống kê Ticket --
class TicketStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    critical: int

class TicketCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    sla_hours: int = 24
    is_active: bool = True

# --- SCHEMAS CHO TICKET CATEGORY ---
class TicketCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    sla_hours: Optional[int] = 24
    is_active: Optional[bool] = True

class TicketCategoryCreate(TicketCategoryBase):
    pass

class TicketCategoryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    sla_hours: Optional[int] = None
    is_active: Optional[bool] = None

class TicketCategoryResponse(TicketCategoryBase):
    id: int
    class Config:
        from_attributes = True