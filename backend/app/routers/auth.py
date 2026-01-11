from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # <--- [MỚI] Import cái này
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt 

# Import database và models
from app.database import get_db
from app import models

router = APIRouter(tags=["Authentication"])

# --- CẤU HÌNH BẢO MẬT ---
SECRET_KEY = "bi_mat_khong_the_bat_mi_chuyen_gia_bao_mat_cap_cao"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# [XÓA] Class LoginRequest cũ không dùng nữa vì chuyển sang Form
# class LoginRequest(BaseModel): ... 

# --- CÁC HÀM HỖ TRỢ ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- API LOGIN [ĐÃ SỬA] ---
# Thay LoginRequest bằng OAuth2PasswordRequestForm
@router.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    # Lưu ý: form_data sẽ có thuộc tính .username và .password
    # (Swagger UI sẽ gửi đúng vào đây)

    # 1. Tìm user
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    # 2. Kiểm tra user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Kiểm tra password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 4. Tạo Token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}
    )

    # 5. Trả về kết quả
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