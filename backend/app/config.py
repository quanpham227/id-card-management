import os
from dotenv import load_dotenv

# Load file .env
load_dotenv()

# --- 1. CẤU HÌNH ĐƯỜNG DẪN HỆ THỐNG ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Thư mục Data (Chứa DB SQLite, log...)
DATA_DIR = os.path.join(BASE_DIR, "data")

# --- QUAN TRỌNG: CẤU HÌNH ĐƯỜNG DẪN ẢNH ---

# 1. Ảnh Static (Logo, Background, và Ảnh Nhân viên cũ)
# URL truy cập sẽ là: /static/images/...
STATIC_DIR = os.path.join(BASE_DIR, "static")
EMPLOYEE_IMAGES_DIR = os.path.join(STATIC_DIR, "images")

# 2. Ảnh Upload (Dành cho Ticket và các file người dùng đẩy lên sau này)
# Đổi tên folder 'images' gốc thành 'uploads' để không nhầm với 'static/images'
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads") 
TICKET_IMAGES_DIR = os.path.join(UPLOAD_DIR, "tickets")

# --- Đường dẫn các file JSON cũ (Legacy) ---
USERS_FILE = os.path.join(DATA_DIR, "users.json")
ASSETS_FILE = os.path.join(DATA_DIR, "assets.json")
EMPLOYEES_FILE = os.path.join(DATA_DIR, "source.json")
BACKUP_FILE = os.path.join(DATA_DIR, "employees_backup.json")
LOG_FILE = os.path.join(DATA_DIR, "print_logs.json")

# --- 2. CẤU HÌNH SERVER ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
HR_API_URL = os.getenv("HR_API_URL", "http://default-url...")

# --- 3. CẤU HÌNH DATABASE ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

# --- 4. CẤU HÌNH BẢO MẬT (JWT) ---
SECRET_KEY = os.getenv("SECRET_KEY", "mac_dinh_neu_thieu_env") 
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# --- 5. TỰ ĐỘNG TẠO THƯ MỤC NẾU CHƯA CÓ ---
# Biến tương thích ngược (nếu code cũ còn dùng)
IMAGES_DIR = EMPLOYEE_IMAGES_DIR 

# Danh sách các thư mục cần đảm bảo tồn tại
REQUIRED_DIRS = [
    DATA_DIR, 
    STATIC_DIR, 
    EMPLOYEE_IMAGES_DIR, 
    UPLOAD_DIR, 
    TICKET_IMAGES_DIR
]

for directory in REQUIRED_DIRS:
    os.makedirs(directory, exist_ok=True)
    # (Optional) Tạo file .gitkeep để Git nhận diện folder rỗng nếu cần
    # with open(os.path.join(directory, ".gitkeep"), 'a'): pass