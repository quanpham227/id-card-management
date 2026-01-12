import os
import io
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

# --- SỬA ĐỔI QUAN TRỌNG: Import đúng biến thư mục nhân viên ---
from app.config import EMPLOYEE_IMAGES_DIR 

router = APIRouter()

@router.post("/api/upload")
async def upload_employee_images(
    files: List[UploadFile] = File(...), 
    x_user_role: Optional[str] = Header(None)
):
    # 1. Kiểm tra quyền (Chỉ Admin/HR mới được đổi ảnh thẻ nhân viên)
    current_role = x_user_role.strip().lower() if x_user_role else ""
    if current_role not in ["admin", "manager", "hr"]:
        raise HTTPException(403, "Access Denied: Only HR/Admin can upload employee photos.")

    saved_files = []
    for file in files:
        try:
            # Xử lý tên file: Giữ nguyên tên gốc (thường là Mã NV) để dễ map
            name = os.path.splitext(file.filename)[0]
            clean_name = "".join([c for c in name if c.isalnum() or c in ("-", "_")]).strip()

            if not clean_name:
                continue

            # --- SỬA ĐỔI: Dùng đường dẫn EMPLOYEE_IMAGES_DIR ---
            path = os.path.join(EMPLOYEE_IMAGES_DIR, f"{clean_name}.png")

            # Xử lý ảnh: Convert sang PNG, xoay đúng chiều
            content = await file.read()
            img = Image.open(io.BytesIO(content))
            img = ImageOps.exif_transpose(img) 

            if img.mode != "RGB":
                img = img.convert("RGB")

            img.save(path, "PNG", optimize=True)
            
            # Trả về tên file để lưu vào DB (ví dụ: NV001.png)
            saved_files.append(f"{clean_name}.png")

        except Exception as e:
            print(f"Error uploading {file.filename}: {e}")
            continue

    return {"success": True, "files": saved_files}


@router.get("/api/download/{employee_id}")
def download_employee_image(employee_id: str):
    """
    API Download ảnh nhân viên.
    Tự động tìm file theo thứ tự ưu tiên: png -> jpg -> jpeg -> webp
    """
    # 1. Danh sách các đuôi file có thể xảy ra
    possible_extensions = [".png", ".jpg", ".jpeg", ".webp"]
    
    file_path = None
    
    # 2. Thử tìm file với từng đuôi
    for ext in possible_extensions:
        # Tạo đường dẫn giả định: backend/static/images/NV01.png, NV01.jpg...
        temp_path = os.path.join(EMPLOYEE_IMAGES_DIR, f"{employee_id}{ext}")
        
        if os.path.exists(temp_path):
            file_path = temp_path
            break # Tìm thấy thì dừng lại ngay
    
    # 3. Trả về file nếu tìm thấy
    if file_path:
        # Lấy tên file thực tế để browser hiểu (VD: NV01.jpg)
        filename = os.path.basename(file_path)
        return FileResponse(file_path, filename=filename)
    
    # 4. Nếu chạy hết vòng lặp mà vẫn không thấy -> Lỗi 404
    raise HTTPException(status_code=404, detail=f"Image for employee {employee_id} not found on server.")