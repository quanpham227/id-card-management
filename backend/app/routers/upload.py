import os
import io
import zipfile
import logging
import httpx
import json
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from fastapi.responses import FileResponse
from PIL import Image, ImageOps
from fastapi.responses import StreamingResponse # <--- Để trả về file dạng stream
from pydantic import BaseModel # <--- Để validate dữ liệu gửi lên

# --- SỬA ĐỔI QUAN TRỌNG: Import đúng biến thư mục nhân viên ---
from app.config import EMPLOYEE_IMAGES_DIR, HR_API_URL 

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




class BulkDownloadRequest(BaseModel):
    employee_ids: List[str]

@router.post("/api/download-zip")
async def download_zip_images(request: BulkDownloadRequest):
    """
    Nhận danh sách mã nhân viên -> Tìm ảnh -> Nén ZIP -> Trả về.
    """
    # Kiểm tra input
    if not request.employee_ids:
        raise HTTPException(status_code=400, detail="No employee IDs provided")

    # Tạo một file ZIP ảo trên RAM (io.BytesIO) để không hại ổ cứng
    zip_buffer = io.BytesIO()

    # Các đuôi file ảnh cần tìm
    possible_extensions = [".png", ".jpg", ".jpeg", ".webp"]
    
    files_found = 0

    # Mở file ZIP để ghi dữ liệu
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        
        # Duyệt qua từng mã nhân viên frontend gửi lên
        for emp_id in request.employee_ids:
            
            # Làm sạch mã nhân viên (đề phòng injection path)
            safe_id = "".join([c for c in emp_id if c.isalnum() or c in ("-", "_")]).strip()
            if not safe_id: 
                continue

            # Tìm xem có file ảnh nào khớp với mã này không
            image_path = None
            found_ext = ""
            
            for ext in possible_extensions:
                temp_path = os.path.join(EMPLOYEE_IMAGES_DIR, f"{safe_id}{ext}")
                if os.path.exists(temp_path):
                    image_path = temp_path
                    found_ext = ext
                    break
            
            # Nếu tìm thấy ảnh -> Nhét vào file ZIP
            if image_path:
                # arcname là tên file sẽ hiển thị khi giải nén ra (ví dụ: NV001.png)
                zip_file.write(image_path, arcname=f"{safe_id}{found_ext}")
                files_found += 1

    # Nếu chạy hết vòng lặp mà không tìm thấy ảnh nào
    if files_found == 0:
        raise HTTPException(status_code=404, detail="No images found for the provided IDs")

    # Đưa con trỏ file về đầu để chuẩn bị đọc trả về client
    zip_buffer.seek(0)

    # Trả về file ZIP dưới dạng Stream
    filename = "Employee_Images.zip"
    return StreamingResponse(
        zip_buffer, 
        media_type="application/zip", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )



# --- 4. API ĐỒNG BỘ ẢNH TỪ MÃ CŨ (CẬP NHẬT CHUẨN ASMX) ---
@router.post("/api/sync-old-photos")
async def sync_old_photos(x_user_role: Optional[str] = Header(None)):
    """
    Tự động copy ảnh từ Mã Cũ -> Mã Mới.
    Sử dụng logic gọi HR Server chuẩn (POST + Parse 'd').
    """
    # 1. Check quyền
    current_role = x_user_role.strip().lower() if x_user_role else ""
    if current_role not in ["admin", "manager", "hr"]:
        raise HTTPException(status_code=403, detail="Access Denied")

    logging.info(f"Starting Sync Photos. Fetching data from: {HR_API_URL}")
    
    # --- BẮT ĐẦU LOGIC GỌI HR (GIỐNG FILE EMPLOYEES.PY) ---
    payload = {"arg_UserId": "", "arg_Pass": ""}
    headers = {"Content-Type": "application/json; charset=utf-8"}
    employees = []

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # 🔥 SỬA: Dùng POST thay vì GET
            response = await client.post(HR_API_URL, json=payload, headers=headers)
            
            if response.status_code != 200:
                logging.error(f"HR Error Body: {response.text}")
                raise HTTPException(status_code=502, detail=f"HR Server Error: {response.status_code}")

            raw_text = response.text
            
            # 🔥 SỬA: Logic parse JSON đặc thù của .asmx (Xử lý chữ "d")
            decoder = json.JSONDecoder()
            json_response, idx = decoder.raw_decode(raw_text)

            if "d" in json_response:
                data_obj = (
                    json.loads(json_response["d"])
                    if isinstance(json_response["d"], str)
                    else json_response["d"]
                )
            else:
                data_obj = json_response

            # Kiểm tra success và lấy data
            if (
                isinstance(data_obj, dict)
                and data_obj.get("success") == True
                and "data" in data_obj
            ):
                employees = data_obj["data"]
            else:
                logging.warning("HR Response format valid but success=False or no data found.")
                
    except Exception as e:
        logging.error(f"Failed to fetch employee list for sync: {e}")
        raise HTTPException(status_code=502, detail=f"Cannot fetch HR Data: {str(e)}")
    
    # --- KẾT THÚC LOGIC GỌI HR ---

    if not employees:
        return {"message": "No employees found or HR Error.", "synced_count": 0}

    # 3. Xử lý đồng bộ ảnh (Logic này giữ nguyên vì đã đúng)
    synced_count = 0
    logs = []
    source_extensions = [".png", ".jpg", ".jpeg", ".webp"]

    for emp in employees:
        # Lưu ý: WebService trả về key thường là chữ thường, kiểm tra kỹ
        new_id = str(emp.get("employee_id", "")).strip()
        old_id = str(emp.get("employee_old_id", "")).strip()

        if not old_id or not new_id or new_id == old_id:
            continue

        target_path = os.path.join(EMPLOYEE_IMAGES_DIR, f"{new_id}.png")

        # Nếu ảnh mới đã có -> Bỏ qua
        if os.path.exists(target_path):
            continue

        # Tìm ảnh cũ
        source_path = None
        for ext in source_extensions:
            temp_path = os.path.join(EMPLOYEE_IMAGES_DIR, f"{old_id}{ext}")
            if os.path.exists(temp_path):
                source_path = temp_path
                break
        
        # Copy và Convert
        if source_path:
            try:
                with Image.open(source_path) as img:
                    img = ImageOps.exif_transpose(img)
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    img.save(target_path, "PNG", optimize=True)

                log_msg = f"Auto-copied image for Old ID: {old_id} -> New ID: {new_id}"
                logging.info(log_msg)
                print(log_msg)
                logs.append(log_msg)
                synced_count += 1
            except Exception as e:
                logging.error(f"Error syncing {old_id} -> {new_id}: {e}")

    result_msg = f"Sync process completed. Total synced: {synced_count}"
    
    return {
        "success": True,
        "message": result_msg,
        "synced_count": synced_count,
        "details": logs
    }