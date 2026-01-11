import os
import json
import logging
import time
from typing import List, Optional

# Thay thế requests bằng httpx để chạy bất đồng bộ
import httpx

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.config import BACKUP_FILE

# Cấu hình URL HR
HR_API_URL = "http://pivinadanang/pidn/api/gwhrWebService.asmx/GetEmployeeList"

router = APIRouter()
logger = logging.getLogger(__name__)

# --- CẤU HÌNH CACHE ĐƠN GIẢN ---
# Lưu dữ liệu vào biến toàn cục để không phải gọi HR liên tục
CACHE_DATA = {"employees": [], "last_updated": 0}
CACHE_TIMEOUT = 300  # Thời gian lưu cache: 300 giây (5 phút)


# --- HÀM HELPER: GỌI HR (ASYNC) ---
async def fetch_hr_data_async():
    # 1. KIỂM TRA CACHE TRƯỚC
    current_time = time.time()
    if CACHE_DATA["employees"] and (
        current_time - CACHE_DATA["last_updated"] < CACHE_TIMEOUT
    ):
        logger.info("Serving HR data from CACHE (RAM)")
        return CACHE_DATA["employees"]

    payload = {"arg_UserId": "", "arg_Pass": ""}
    headers = {"Content-Type": "application/json; charset=utf-8"}
    final_employees = []

    # 2. GỌI HR SERVER (NON-BLOCKING)
    try:
        logger.info(f"Connecting to HR System (Async): {HR_API_URL}")

        # Sử dụng httpx.AsyncClient thay cho requests
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(HR_API_URL, json=payload, headers=headers)

        if response.status_code == 200:
            raw_text = response.text
            # ... (Logic parse JSON giữ nguyên như cũ) ...
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

            if (
                isinstance(data_obj, dict)
                and data_obj.get("success") == True
                and "data" in data_obj
            ):
                hr_list = data_obj["data"]

                # ... (Vòng lặp map dữ liệu giữ nguyên) ...
                for raw in hr_list:
                    emp = {
                        "employee_id": raw.get("employee_id", "N/A"),
                        "employee_name": raw.get("employee_name", "N/A"),
                        "employee_department": raw.get("employee_department", ""),
                        "employee_position": raw.get("employee_position", ""),
                        "employee_status": raw.get("employee_status", "Active"),
                        "employee_type": raw.get("employee_type", "Worker"),
                        "id": raw.get("id", ""),
                        "employee_gender": raw.get("employee_gender", ""),
                        "employee_birth_date": raw.get("employee_birth_date", ""),
                        "employee_old_id": raw.get("employee_old_id", ""),
                        "employee_join_date": raw.get("employee_join_date", ""),
                        "employee_left_date": raw.get("employee_left_date", ""),
                        "contract_type": raw.get("contract_type", ""),
                        "contract_id": raw.get("contract_id", ""),
                        "contract_begin": raw.get("contract_begin", ""),
                        "contract_end": raw.get("contract_end", ""),
                        "maternity_type": raw.get("maternity_type", ""),
                        "maternity_begin": raw.get("maternity_begin", ""),
                        "maternity_end": raw.get("maternity_end", ""),
                        "employee_image": f"/images/{raw.get('employee_id', '')}.png",
                        "last_printed_at": None,
                    }
                    final_employees.append(emp)

                # CẬP NHẬT CACHE
                CACHE_DATA["employees"] = final_employees
                CACHE_DATA["last_updated"] = current_time

                # LƯU BACKUP (Vẫn giữ để phòng khi restart server)
                try:
                    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
                        json.dump(final_employees, f, ensure_ascii=False, indent=4)
                except Exception as e:
                    logger.error(f"Backup failed: {e}")

                return final_employees

    except Exception as e:
        logger.error(f"HR CONNECTION ERROR: {e}")

    # 3. DÙNG BACKUP NẾU LỖI
    logger.warning("Switching to OFFLINE mode (Backup Data)...")
    if os.path.exists(BACKUP_FILE):
        try:
            with open(BACKUP_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            return []

    return []


# --- API ENDPOINTS ---


# Thêm từ khóa 'async' vào hàm định nghĩa
@router.get("/api/employees")
async def get_employees(db: Session = Depends(get_db)):
    # BƯỚC 1: Lấy danh sách từ HR (đã thêm await)
    hr_data = await fetch_hr_data_async()

    if not hr_data or len(hr_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hệ thống HR mất kết nối và không tìm thấy dữ liệu dự phòng.",
        )

    # BƯỚC 2: Lấy thông tin 'Lần in cuối' từ Database nội bộ
    # Query này vẫn dùng Sync Session của SQLAlchemy, nhưng vì nó chạy local DB và được tối ưu
    # nên chấp nhận được. Nếu muốn tối ưu tuyệt đối thì dùng 'databases' (asyncpg) nhưng phức tạp hơn.
    try:
        last_print_query = (
            db.query(
                models.PrintLog.employee_id,
                func.max(models.PrintLog.printed_at).label("last_printed"),
            )
            .group_by(models.PrintLog.employee_id)
            .all()
        )

        print_map = {row.employee_id: row.last_printed for row in last_print_query}
    except Exception as e:
        logger.error(f"Database Query Error (PrintLog): {e}")
        print_map = {}

    # BƯỚC 3: Ghép dữ liệu (Merge In-Memory)
    # Tốc độ ghép Dictionary này cực nhanh (O(N)), không cần tối ưu thêm
    final_list = []
    for emp in hr_data:
        emp_id = emp.get("employee_id")
        if emp_id in print_map:
            emp["last_printed_at"] = print_map[emp_id]
        final_list.append(emp)

    return final_list
