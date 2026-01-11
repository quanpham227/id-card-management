from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app import models
from app.database import get_db

# [QUAN TRỌNG] Cấu hình này PHẢI GIỐNG Y HỆT bên auth.py
SECRET_KEY = "bi_mat_khong_the_bat_mi_chuyen_gia_bao_mat_cap_cao"
ALGORITHM = "HS256"

# Khai báo đường dẫn API dùng để lấy token (Login)
# Đường dẫn này khớp với @router.post("/api/login") trong auth.py
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Hàm này sẽ tự động chạy trước khi vào các API được bảo vệ.
    Nó lấy token từ Header, giải mã, và tìm user trong DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Giải mã Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # 2. Tìm user trong DB dựa trên username trong token
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if user is None:
        raise credentials_exception
        
    # 3. Trả về thông tin user (để các hàm API khác sử dụng, ví dụ lấy user.id)
    return user