from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt 

# Import database và models
from app.database import get_db
from app import models

router = APIRouter(tags=["Authentication"])

# --- CẤU HÌNH BẢO MẬT (JWT) ---
# Trong thực tế, SECRET_KEY nên để trong file .env
SECRET_KEY = "bi_mat_khong_the_bat_mi_chuyen_gia_bao_mat_cap_cao"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Token sống trong 24 giờ

# Cấu hình Verify mật khẩu (giống bên create_super_admin)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- MODEL DỮ LIỆU ĐẦU VÀO ---
class LoginRequest(BaseModel):
    username: str
    password: str

# --- CÁC HÀM HỖ TRỢ ---
def verify_password(plain_password, hashed_password):
    """Kiểm tra mật khẩu nhập vào có khớp với mã hóa trong DB không"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    """Tạo JWT Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- API LOGIN ---
@router.post("/api/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # 1. Tìm user trong Database SQLite
    user = db.query(models.User).filter(models.User.username == credentials.username).first()

    # 2. Nếu không tìm thấy user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại"
        )
    
    # 3. Kiểm tra mật khẩu (So sánh password nhập vào với hashed_password trong DB)
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không chính xác"
        )

    # 4. Nếu đúng hết -> Tạo Token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )

    # 5. Trả về kết quả (Khớp với Frontend React của bạn)
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role
        }
    }