from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import date, datetime


# ==========================================
# 0. SCHEMAS CHO CATEGORY (ASSET CATEGORY)
# ==========================================
class CategoryBase(BaseModel):
    name: str  # Laptop, PC
    code: str  # LPT, PC
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 1. SCHEMAS CHO LỊCH SỬ TÀI SẢN
# ==========================================
class AssetHistoryCreate(BaseModel):
    date: date
    action_type: str
    description: str
    performed_by: Optional[str] = "Admin"


class AssetHistoryResponse(AssetHistoryCreate):
    id: int
    asset_id: int
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. SCHEMAS CHO TÀI SẢN (ASSETS)
# ==========================================
class AssignedToModel(BaseModel):
    employee_id: str
    employee_name: str
    department: str


class AssetBase(BaseModel):
    asset_code: str
    category_id: Optional[int] = None
    model: str
    health_status: Optional[str] = "Good"
    usage_status: Optional[str] = "Spare"
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    assigned_to: Optional[AssignedToModel] = None
    specs: Optional[Dict[str, Any]] = {
        "cpu": "",
        "ram": "",
        "storage": "",
        "mainboard": "",
    }
    software: Optional[Dict[str, Any]] = {"os": "", "office": ""}
    monitor: Optional[Dict[str, Any]] = None


class AssetCreate(AssetBase):
    pass


class AssetResponse(AssetBase):
    id: int
    category: Optional[CategoryResponse] = None
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. SCHEMAS KHÁC (USER, LOGIN, PRINT...)
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
    model_config = ConfigDict(from_attributes=True)


class UserShortInfo(BaseModel):
    id: int
    full_name: str
    username: str
    role: str
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. SCHEMAS CHO TICKET CATEGORY (LOẠI SỰ CỐ)
# [DI CHUYỂN LÊN TRƯỚC TICKET ĐỂ TRÁNH LỖI NOT DEFINED]
# ==========================================
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
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 5. SCHEMAS CHO TICKET (YÊU CẦU HỖ TRỢ)
# ==========================================
class TicketCreate(BaseModel):
    title: str
    description: str
    category_id: int
    priority: int = 2
    asset_id: Optional[int] = None
    attachment_url: Optional[str] = None


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    category_id: Optional[int] = None
    resolution_note: Optional[str] = None


class TicketResponse(BaseModel):
    id: int
    title: str
    description: str  # FIXED: Sửa từ int thành str để không lỗi 500
    category_id: Optional[int] = None
    priority: str
    status: str
    attachments: Optional[List[str]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    requester: Optional[UserShortInfo] = None
    assignee: Optional[UserShortInfo] = None
    asset_id: Optional[int] = None
    ticket_category: Optional[TicketCategoryResponse] = None  # Đã nhận diện được Class
    comments: Optional[List["TicketCommentResponse"]] = []
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 6. SCHEMAS CHO COMMENT (BÌNH LUẬN)
# ==========================================
class TicketCommentCreate(BaseModel):
    content: str
    type: Optional[str] = "Comment"


class TicketCommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    type: str
    user: Optional[UserShortInfo] = None
    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 7. THỐNG KÊ TICKET
# ==========================================
class TicketStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    critical: int


class TicketPaginationResponse(BaseModel):
    items: List[TicketResponse]  # Danh sách ticket của trang hiện tại
    total: int  # Tổng số lượng ticket trong DB
    page: int  # Trang hiện tại
    size: int  # Kích thước trang (10, 20...)

    model_config = ConfigDict(from_attributes=True)


# Xử lý tham chiếu vòng
TicketResponse.model_rebuild()
