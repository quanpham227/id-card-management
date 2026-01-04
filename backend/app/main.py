import os
import logging
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Import cấu hình
from app.config import IMAGES_DIR, BASE_DIR, HOST, PORT

# Import Database
from app.database import engine
from app import models 

# Import Routers
from app.routers import auth, employees, assets, upload
from app.routers import print as print_router
from app.routers import users

# --- 1. CẤU HÌNH LOGGING (Ghi log ra file để tra cứu lỗi sau này) ---
logging.basicConfig(
    filename='system.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tạo bảng DB
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ID Card & Asset System")


@app.on_event("startup")
async def startup_event():
    # Danh sách các thư mục bắt buộc phải có
    required_dirs = ["images", "backups", "logs"]
    
    print("---------------------------------------------------")
    for directory in required_dirs:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"📁 [System Init] Đã tự động tạo thư mục: {directory}")
        else:
            print(f"✅ [System Init] Đã tìm thấy thư mục: {directory}")
    print("---------------------------------------------------")
# --- 2. GLOBAL EXCEPTION HANDLER (Bắt lỗi hệ thống 500) ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"CRITICAL ERROR: {str(exc)}"
    logger.error(error_msg) # Ghi vào file log
    print(error_msg) # In ra màn hình console

    return JSONResponse(
        status_code=500,
        content={
            "message": "Lỗi hệ thống nội bộ (Internal Server Error).",
            "details": "Vui lòng liên hệ Admin hoặc kiểm tra file log.",
            # Chỉ hiện chi tiết lỗi nếu không phải Production (tùy chọn)
            "error": str(exc) 
        },
    )

# --- 3. CẤU HÌNH CORS (Bảo mật hơn cho Production) ---
# Trên server, bạn nên thay "*" bằng danh sách IP cụ thể
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://192.168.1.2:3000",
    "http://192.168.1.2",
    # Thêm IP Server Ubuntu của bạn vào đây sau này (Ví dụ: http://192.168.1.50)
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
app.include_router(assets.router)
app.include_router(upload.router, tags=["Upload"])
app.include_router(print_router.router)
app.include_router(users.router)

# --- 5. MOUNT STATIC FILES ---
# Ảnh nhân viên
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# ============================================================
# [QUAN TRỌNG] - LOGIC TÌM FRONTEND (AUTO-DETECT CROSS-PLATFORM)
# ============================================================
# Giải thích: Logic này tự động tìm thư mục frontend dựa trên vị trí file hiện tại
# Nó hoạt động đúng trên cả Windows (D:\...) và Ubuntu (/home/user/...)

# Lấy đường dẫn thư mục chứa file main.py (backend/app)
current_dir = os.path.dirname(os.path.abspath(__file__))
# Lùi ra 1 cấp -> backend
backend_dir = os.path.dirname(current_dir)
# Lùi ra 1 cấp nữa -> project root (id-card-system)
project_root = os.path.dirname(backend_dir)
# Đi vào frontend/dist
FRONTEND_DIR = os.path.join(project_root, "frontend", "dist")

logger.info(f"Checking Frontend Path: {FRONTEND_DIR}")

if os.path.exists(FRONTEND_DIR):
    logger.info("FRONTEND FOUND. Serving static files...")
    
    # Mount thư mục assets của React/Vite
    assets_path = os.path.join(FRONTEND_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="static_assets")

    # Route đặc biệt: Phục vụ React Router (SPA)
    # Bất kỳ đường dẫn nào không khớp API sẽ trả về index.html
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    logger.warning("FRONTEND NOT FOUND. Please run 'npm run build' in frontend folder.")
    print(" CẢNH BÁO: Không tìm thấy thư mục Frontend (dist).")
    print(f"   Đường dẫn đang tìm: {FRONTEND_DIR}")


# --- 6. START SERVER (Chỉ dùng khi chạy dev, Production dùng Gunicorn) ---
if __name__ == "__main__":
    print(f" Server starting on http://{HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)