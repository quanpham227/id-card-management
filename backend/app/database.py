import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. Load biến môi trường từ file .env
load_dotenv()

# 2. Lấy đường dẫn kết nối từ .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Kiểm tra an toàn: Nếu quên cấu hình .env thì báo lỗi ngay
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("LỖI: Chưa cấu hình biến DATABASE_URL trong file .env")

# In ra terminal để debug (xem đang kết nối đi đâu)
print("--------------------------------------------------")
print(f"DATABASE CONNECTING TO: {SQLALCHEMY_DATABASE_URL}")
print("--------------------------------------------------")

# 3. Tạo Engine kết nối PostgreSQL
# Lưu ý: Đã xóa bỏ các tham số riêng của SQLite (check_same_thread, timeout)
# PostgreSQL xử lý đa luồng tốt nên không cần check_same_thread
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

# Lưu ý: Đã XÓA đoạn code event.listen và PRAGMA WAL mode 
# (Vì PostgreSQL tự quản lý việc này, không dùng lệnh PRAGMA của SQLite)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Hàm dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()