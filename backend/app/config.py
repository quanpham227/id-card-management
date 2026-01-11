import os
from dotenv import load_dotenv  # Import thư viện

# Load file .env
load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
STATIC_DIR = os.path.join(BASE_DIR, "static")
IMAGES_DIR = os.path.join(STATIC_DIR, "images")

USERS_FILE = os.path.join(DATA_DIR, "users.json")
ASSETS_FILE = os.path.join(DATA_DIR, "assets.json")
EMPLOYEES_FILE = os.path.join(DATA_DIR, "source.json")
BACKUP_FILE = os.path.join(DATA_DIR, "employees_backup.json")
LOG_FILE = os.path.join(DATA_DIR, "print_logs.json")

# Lấy cấu hình từ .env (Nếu không có thì lấy giá trị mặc định)
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
HR_API_URL = os.getenv("HR_API_URL", "http://default-url...")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)
