import os
import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager

# --- [CẬP NHẬT] Import từ config mới ---
from app.config import (
    STATIC_DIR,
    EMPLOYEE_IMAGES_DIR,    # static/images
    UPLOAD_DIR,             # uploads (Thư mục gốc cho file user)
    TICKET_IMAGES_DIR,      # uploads/tickets
    DATA_DIR, 
    HOST, 
    PORT
)

# Import Database
from app.database import engine, SessionLocal
from app import models

# Import Routers
from app.routers import (
    auth, employees, assets, upload, users, 
    print as print_router, categories, 
    tickets, ticket_categories, ticket_upload
)

# --- 1. CẤU HÌNH LOGGING ---
logging.basicConfig(
    filename="system.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Tạo bảng DB (nếu chưa có)
models.Base.metadata.create_all(bind=engine)


# --- HÀM KHỞI TẠO DỮ LIỆU MẪU (SEED DATA) ---
def init_db_data():
    """Kiểm tra và khởi tạo dữ liệu mẫu cho Asset và Ticket."""
    db = SessionLocal()
    try:
        # 1. Asset Categories
        if db.query(models.AssetCategory).count() == 0:
            print(" [System Init] Creating default Asset Categories...")
            asset_defaults = [
                models.AssetCategory(name="PC", code="PC", description="Personal Computer"),
                models.AssetCategory(name="Laptop", code="LPT", description="Notebook / Laptop"),
                models.AssetCategory(name="Tablet", code="TAB", description="Tablet Device"),
                models.AssetCategory(name="Printer", code="PRT", description="Office Printer"),
                models.AssetCategory(name="Monitor", code="MON", description="Display Monitor"),
                models.AssetCategory(name="Server", code="SRV", description="Server System"),
                models.AssetCategory(name="Camera", code="CAM", description="CCTV / Webcams"),
            ]
            db.add_all(asset_defaults)
            db.commit()
            print(" [System Init] Asset Categories created.")

        # 2. Ticket Categories
        if db.query(models.TicketCategory).count() == 0:
            print(" [System Init] Creating default Ticket Categories...")
            ticket_defaults = [
                models.TicketCategory(name="Hardware Issue", code="HW", description="Hư hỏng thiết bị vật lý", sla_hours=24),
                models.TicketCategory(name="Software Issue", code="SW", description="Lỗi phần mềm, Office, Zalo", sla_hours=24),
                models.TicketCategory(name="Network/Internet", code="NET", description="Mất mạng, Wifi yếu", sla_hours=4),
                models.TicketCategory(name="Printer/Scanner", code="PRT", description="Lỗi máy in", sla_hours=8),
                models.TicketCategory(name="Account & Access", code="ACC", description="Cấp lại mật khẩu, quyền ERP", sla_hours=2),
                models.TicketCategory(name="New Request", code="REQ", description="Yêu cầu cấp phát mới", sla_hours=48),
            ]
            db.add_all(ticket_defaults)
            db.commit()
            print(" [System Init] Ticket Categories created.")
            
    except Exception as e:
        print(f" [System Init] Error seeding data: {e}")
        logger.error(f"Error seeding data: {e}")
    finally:
        db.close()


# --- [CẬP NHẬT] LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    print("\n---------------------------------------------------")
    
    # Danh sách thư mục bắt buộc phải tồn tại
    required_dirs = [
        STATIC_DIR,
        EMPLOYEE_IMAGES_DIR, # static/images
        UPLOAD_DIR,          # uploads
        TICKET_IMAGES_DIR,   # uploads/tickets
        DATA_DIR, 
        "backups", 
        "logs"
    ]
    
    for directory in required_dirs:
        os.makedirs(directory, exist_ok=True)
        # print(f"[Check Dir] OK: {directory}") 

    init_db_data()
    print(" System Startup Complete")
    print("---------------------------------------------------\n")
    
    yield  # Server chạy tại đây

    # --- SHUTDOWN ---
    print("\n---------------------------------------------------")
    print(" System Shutting Down...")
    print("---------------------------------------------------")


# Khai báo app
app = FastAPI(title="ID Card & Asset System", lifespan=lifespan)


# --- 2. GLOBAL EXCEPTION HANDLER ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"CRITICAL ERROR: {str(exc)}"
    logger.error(error_msg)
    return JSONResponse(
        status_code=500,
        content={
            "message": "Lỗi hệ thống nội bộ.",
            "error": str(exc),
        },
    )


# --- 3. CẤU HÌNH CORS ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- 4. API ROUTERS ---
app.include_router(auth.router)
app.include_router(employees.router, tags=["Employees"])
app.include_router(categories.router)
app.include_router(assets.router)
app.include_router(upload.router, tags=["Upload Legacy"]) # Upload cũ (nếu còn dùng)
app.include_router(print_router.router)
app.include_router(users.router)
# Router Ticket mới
app.include_router(tickets.router)
app.include_router(ticket_categories.router)
app.include_router(ticket_upload.router) # Router upload mới xử lý logic lưu vào uploads/tickets


# --- 5. [QUAN TRỌNG] MOUNT STATIC FILES ---

# A. Ảnh Tĩnh / Ảnh Nhân viên (Legacy)
# URL: http://localhost:8000/images/nv01.png -> Trỏ vào backend/static/images
app.mount("/images", StaticFiles(directory=EMPLOYEE_IMAGES_DIR), name="employee_images")

# B. Ảnh Upload (Ticket, Tài liệu...)
# URL: http://localhost:8000/uploads/tickets/loi.png -> Trỏ vào backend/uploads/tickets
# Mount thư mục cha 'uploads' để sau này mở rộng thêm 'uploads/avatars', 'uploads/docs' dễ dàng
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# --- 6. FRONTEND SERVING (AUTO-DETECT) ---
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
FRONTEND_DIR = os.path.join(project_root, "frontend", "dist")

if os.path.exists(FRONTEND_DIR):
    assets_path = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("uploads") or full_path.startswith("images"):
             from fastapi import HTTPException
             raise HTTPException(status_code=404, detail="Not found")

        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    print(" CẢNH BÁO: Không tìm thấy thư mục Frontend (dist). Chạy mode API Only.")

if __name__ == "__main__":
    print(f" Server starting on http://{HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)