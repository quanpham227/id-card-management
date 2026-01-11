import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import IMAGES_DIR

router = APIRouter(prefix="/api/ticket-upload", tags=["Ticket Upload"])

# Cấu hình giới hạn
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "pdf", "docx", "zip"}


@router.post("")
async def upload_ticket_attachments(files: List[UploadFile] = File(...)):
    """
    Optimized API for Ticket attachments:
    - Supports multiple files upload.
    - Limits size to 5MB per file.
    - Generates unique UUID filenames.
    """
    saved_files = []

    # Đảm bảo thư mục tồn tại
    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR, exist_ok=True)

    for file in files:
        try:
            # 1. Kiểm tra định dạng tệp
            file_ext = file.filename.split(".")[-1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} has unsupported extension.",
                )

            # 2. Kiểm tra dung lượng tệp (5MB)
            # Cuộn đến cuối để lấy kích thước sau đó cuộn lại đầu để đọc nội dung
            file.file.seek(0, os.SEEK_END)
            file_size = file.file.tell()
            file.file.seek(0)

            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400, detail=f"File {file.filename} exceeds 5MB limit."
                )

            # 3. Tạo tên tệp duy nhất
            new_filename = f"ticket_{uuid.uuid4().hex}.{file_ext}"
            file_path = os.path.join(IMAGES_DIR, new_filename)

            # 4. Lưu tệp (Sử dụng stream để tối ưu bộ nhớ)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_files.append(f"images/{new_filename}")

        except Exception as e:
            # Nếu có lỗi trong quá trình xử lý 1 tệp, ta có thể log và tiếp tục hoặc dừng lại
            print(f" Error uploading {file.filename}: {e}")
            continue

    if not saved_files:
        raise HTTPException(
            status_code=500, detail="No files were uploaded successfully."
        )

    return {"success": True, "filenames": saved_files}  # Trả về mảng các đường dẫn
