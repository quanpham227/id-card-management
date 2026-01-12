import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException

# --- [SỬA ĐỔI 1] Import đúng biến thư mục dành cho Ticket ---
from app.config import TICKET_IMAGES_DIR

# --- [SỬA ĐỔI 2] Chỉnh lại prefix để khớp với Frontend gọi axiosClient.post('/ticket-upload') ---
router = APIRouter(prefix="/api/ticket-upload", tags=["Ticket Upload"])

# Cấu hình giới hạn
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "pdf", "docx", "zip"}

@router.post("")
async def upload_ticket_attachments(files: List[UploadFile] = File(...)):
    """
    Upload ảnh/file đính kèm cho Ticket.
    Lưu vào: backend/uploads/tickets/
    URL trả về: uploads/tickets/ten_file.jpg
    """
    saved_files = []

    # Đảm bảo thư mục tồn tại (Dù đã check ở main.py nhưng check lại cho chắc)
    if not os.path.exists(TICKET_IMAGES_DIR):
        os.makedirs(TICKET_IMAGES_DIR, exist_ok=True)

    for file in files:
        try:
            # 1. Kiểm tra định dạng tệp
            file_ext = file.filename.split(".")[-1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                # Có thể continue để bỏ qua file lỗi thay vì dừng toàn bộ
                print(f"Skipping unsupported file: {file.filename}")
                continue

            # 2. Kiểm tra dung lượng tệp (5MB)
            file.file.seek(0, os.SEEK_END)
            file_size = file.file.tell()
            file.file.seek(0)

            if file_size > MAX_FILE_SIZE:
                print(f"Skipping large file: {file.filename}")
                continue

            # 3. Tạo tên tệp duy nhất (UUID)
            new_filename = f"ticket_{uuid.uuid4().hex}.{file_ext}"
            
            # [QUAN TRỌNG] Lưu vào thư mục TICKET_IMAGES_DIR (uploads/tickets)
            file_path = os.path.join(TICKET_IMAGES_DIR, new_filename)

            # 4. Lưu tệp
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # [QUAN TRỌNG] Tạo đường dẫn trả về khớp với app.mount("/uploads")
            # Kết quả: "uploads/tickets/ticket_abcd1234.png"
            saved_files.append(f"uploads/tickets/{new_filename}")

        except Exception as e:
            print(f"Error uploading {file.filename}: {e}")
            continue

    # Nếu không file nào upload thành công (do lỗi hoặc sai định dạng hết)
    if not saved_files:
        raise HTTPException(
            status_code=400, detail="No valid files were uploaded (Check size < 5MB or extension)."
        )

    return {"success": True, "filenames": saved_files}