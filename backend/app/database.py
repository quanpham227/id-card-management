from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Tên file database
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# 1. Tăng timeout lên 30s (mặc định là 5s) để giảm thiểu lỗi locked
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False, "timeout": 30}
)

# 2. CẤU HÌNH WAL MODE (QUAN TRỌNG)
# Hàm này sẽ tự chạy mỗi khi có kết nối mới vào Database
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    # Bật chế độ ghi song song
    cursor.execute("PRAGMA journal_mode=WAL") 
    # Tối ưu tốc độ đồng bộ
    cursor.execute("PRAGMA synchronous=NORMAL") 
    cursor.close()

# Đăng ký hàm trên với engine
event.listen(engine, "connect", set_sqlite_pragma)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Hàm dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()