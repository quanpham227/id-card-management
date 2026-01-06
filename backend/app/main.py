import os
import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

# Import cấu hình
from app.config import IMAGES_DIR, BASE_DIR, HOST, PORT

# Import Database
# [CẬP NHẬT]: Import thêm SessionLocal để dùng cho việc khởi tạo dữ liệu mẫu
from app.database import engine, SessionLocal
from app import models 

# Import Routers
from app.routers import auth, employees, assets, upload, users
from app.routers import print as print_router
from app.routers import categories  # [MỚI] Import router danh mục

# --- 1. CẤU HÌNH LOGGING ---
logging.basicConfig(
    filename='system.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tạo bảng DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ID Card & Asset System")


# --- [MỚI] HÀM KHỞI TẠO DỮ LIỆU MẪU (SEED DATA) ---
def init_db_data():
    """
    Hàm này chạy khi server khởi động.
    Nó kiểm tra nếu bảng Category trống thì sẽ tạo các loại mặc định.
    """
    db = SessionLocal()
    try:
        # Kiểm tra xem đã có danh mục chưa
        if db.query(models.AssetCategory).count() == 0:
            print("🚀 [System Init] Creating default Asset Categories...")
            defaults = [
                models.AssetCategory(name="PC", code="PC", description="Personal Computer"),
                models.AssetCategory(name="Laptop", code="LPT", description="Notebook / Laptop"),
                models.AssetCategory(name="Tablet", code="TAB", description="Tablet Device"),
                models.AssetCategory(name="Printer", code="PRT", description="Office Printer"),
                models.AssetCategory(name="Monitor", code="MON", description="Display Monitor"),
            ]
            db.add_all(defaults)
            db.commit()
            print("✅ [System Init] Default Categories created successfully.")
        else:
            print("✅ [System Init] Categories data already exists.")
            
    except Exception as e:
        print(f"❌ [System Init] Error seeding data: {e}")
        logger.error(f"Error seeding data: {e}")
    finally:
        db.close()


@app.on_event("startup")
async def startup_event():
    # 1. Tạo các thư mục bắt buộc
    required_dirs = ["images", "backups", "logs"]
    
    print("---------------------------------------------------")
    for directory in required_dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"[System Init] Created directory: {directory}")
        else:
            print(f" [System Init] Directory exists: {directory}")
    
    # 2. [MỚI] Gọi hàm khởi tạo dữ liệu mẫu
    init_db_data()
    print("---------------------------------------------------")


# --- 2. GLOBAL EXCEPTION HANDLER ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"CRITICAL ERROR: {str(exc)}"
    logger.error(error_msg)
    print(error_msg)

    return JSONResponse(
        status_code=500,
        content={
            "message": "Lỗi hệ thống nội bộ (Internal Server Error).",
            "details": "Vui lòng liên hệ Admin hoặc kiểm tra file log.",
            "error": str(exc) 
        },
    )

# --- 3. CẤU HÌNH CORS ---
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "*" 
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
app.include_router(categories.router) # [MỚI] Đăng ký router categories
app.include_router(assets.router)
app.include_router(upload.router, tags=["Upload"])
app.include_router(print_router.router)
app.include_router(users.router)

# --- 5. MOUNT STATIC FILES ---
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# --- 6. FRONTEND SERVING (AUTO-DETECT) ---
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
project_root = os.path.dirname(backend_dir)
FRONTEND_DIR = os.path.join(project_root, "frontend", "dist")

logger.info(f"Checking Frontend Path: {FRONTEND_DIR}")

if os.path.exists(FRONTEND_DIR):
    logger.info("FRONTEND FOUND. Serving static files...")
    
    assets_path = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    logger.warning("FRONTEND NOT FOUND.")
    print(" CẢNH BÁO: Không tìm thấy thư mục Frontend (dist).")


if __name__ == "__main__":
    print(f" Server starting on http://{HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)