import os
import io
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from fastapi.responses import FileResponse
from PIL import Image, ImageOps

from app.config import IMAGES_DIR

router = APIRouter()

@router.post("/api/upload")
async def upload_images(files: List[UploadFile] = File(...), x_user_role: Optional[str] = Header(None)):
    current_role = x_user_role.strip().lower() if x_user_role else ""
    
    if current_role not in ["admin", "it", "hr"]:
        raise HTTPException(403, "Access Denied")
        
    saved_files = []
    for file in files:
        try:
            # Xử lý tên file cho sạch
            name = os.path.splitext(file.filename)[0]
            clean_name = "".join([c for c in name if c.isalnum() or c in ('-', '_')]).strip()
            
            if not clean_name:
                continue
                
            path = os.path.join(IMAGES_DIR, f"{clean_name}.png")
            
            # Đọc và xử lý ảnh
            content = await file.read()
            img = Image.open(io.BytesIO(content))
            img = ImageOps.exif_transpose(img) # Xoay ảnh đúng chiều
            
            if img.mode != "RGB":
                img = img.convert("RGB")
                
            # Lưu file dưới dạng PNG tối ưu
            img.save(path, "PNG", optimize=True)
            saved_files.append(f"{clean_name}.png")
            
        except Exception:
            continue
            
    return {"success": True, "files": saved_files}

@router.get("/api/download/{employee_id}")
def download_image(employee_id: str):
    path = os.path.join(IMAGES_DIR, f"{employee_id}.png")
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(404, "Image not found")