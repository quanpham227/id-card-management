# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext

from app.database import get_db
from app import models

router = APIRouter(prefix="/api/users", tags=["Users"])

# Cấu hình mã hóa mật khẩu
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Schemas (Nên để trong file schemas.py, nhưng để đây cũng được) ---
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        orm_mode = True


# --- API ---


@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    # Chỉ đọc dữ liệu -> Không cần rollback
    return db.query(models.User).all()


@router.post("", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Kiểm tra username trùng (Logic nghiệp vụ)
    db_user = (
        db.query(models.User).filter(models.User.username == user.username).first()
    )
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    try:
        # 2. Mã hóa mật khẩu
        hashed_password = pwd_context.hash(user.password)

        # 3. Tạo User mới
        new_user = models.User(
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            hashed_password=hashed_password,
            is_active=True,  # Mặc định kích hoạt
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    except Exception as e:
        db.rollback()  # <--- QUAN TRỌNG: Hoàn tác nếu lỗi database
        print(f"Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # 1. Tìm user
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # [QUAN TRỌNG]: BẢO VỆ TÀI KHOẢN ROOT
    # Ngăn chặn việc xóa tài khoản admin gốc dù frontend có gửi request lên
    if user.username == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete Root Admin account")

    try:
        # 2. Xóa
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}

    except Exception as e:
        db.rollback()  # <--- QUAN TRỌNG
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")
