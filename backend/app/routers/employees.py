import os
import json
import logging
import time
from typing import List, Optional, Dict, Any
from datetime import datetime
# Thay thế requests bằng httpx để chạy bất đồng bộ
import httpx

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.config import HR_API_URL

# Cấu hình URL HR

router = APIRouter()
logger = logging.getLogger(__name__)

# --- CẤU HÌNH CACHE ĐƠN GIẢN ---
CACHE_DATA = {"employees": [], "last_updated": 0}
CACHE_TIMEOUT = 300  # 5 phút



def normalize_date(date_str):
    """
    Chuyển đổi các định dạng ngày lộn xộn (DD/MM/YYYY, YYYY-MM-DD...)
    về chuẩn duy nhất: YYYY-MM-DD để Frontend không bị hiểu nhầm.
    """
    if not date_str or str(date_str).strip() == "":
        return None
    
    s = str(date_str).strip()
    
    # Cắt bỏ phần giờ nếu có (ví dụ: 2026-01-09T00:00:00)
    if "T" in s:
        s = s.split("T")[0]
    elif " " in s:
        s = s.split(" ")[0]

    # Danh sách các format ưu tiên thử parse
    # ƯU TIÊN SỐ 1: DD/MM/YYYY (Format Việt Nam) -> Để sửa lỗi 09/01 bị hiểu nhầm
    formats = [
        "%d/%m/%Y",  # 09/01/2026 -> 9 Jan
        "%Y-%m-%d",  # 2026-01-09 -> 9 Jan
        "%d-%m-%Y",  # 09-01-2026
        "%m/%d/%Y",  # Format Mỹ (Thử cuối cùng)
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime("%Y-%m-%d") # Trả về chuẩn ISO
        except ValueError:
            continue
            
    return s # Nếu bó tay thì trả về nguyên gốc

# --- HÀM HELPER: GỌI HR (ASYNC) ---
async def fetch_hr_data_async() -> Dict[str, Any]:
    # 1. KIỂM TRA CACHE TRƯỚC (RAM)
    current_time = time.time()
    if CACHE_DATA["employees"] and (
        current_time - CACHE_DATA["last_updated"] < CACHE_TIMEOUT
    ):
        logger.info("Serving HR data from CACHE (RAM)")
        return {"data": CACHE_DATA["employees"], "source": "online"}

    payload = {"arg_UserId": "", "arg_Pass": ""}
    headers = {"Content-Type": "application/json; charset=utf-8"}
    final_employees = []

    # 2. GỌI HR SERVER
    try:
        logger.info(f"Connecting to HR System (Async): {HR_API_URL}")

        async with httpx.AsyncClient(timeout=15.0) as client: # Tăng timeout lên 15s cho chắc
            response = await client.post(HR_API_URL, json=payload, headers=headers)

        if response.status_code == 200:
            raw_text = response.text
            
            # Logic parse JSON đặc thù của webservice .asmx
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
                        "employee_old_id": raw.get("employee_old_id", ""),
                        
                        # 🔥 CHUẨN HÓA DATE TẠI ĐÂY (SỬA LỖI)
                        "employee_birth_date": normalize_date(raw.get("employee_birth_date")),
                        "employee_join_date": normalize_date(raw.get("employee_join_date")),
                        "employee_left_date": normalize_date(raw.get("employee_left_date")),
                        "contract_begin": normalize_date(raw.get("contract_begin")),
                        "contract_end": normalize_date(raw.get("contract_end")),
                        "maternity_begin": normalize_date(raw.get("maternity_begin")),
                        "maternity_end": normalize_date(raw.get("maternity_end")),
                        # -----------------------------------

                        "contract_type": raw.get("contract_type", ""),
                        "contract_id": raw.get("contract_id", ""),
                        "maternity_type": raw.get("maternity_type", ""),
                        
                        "employee_image": f"/images/{raw.get('employee_id', '')}.png",
                        "last_printed_at": None,
                    }
                    final_employees.append(emp)

                # CẬP NHẬT CACHE RAM
                CACHE_DATA["employees"] = final_employees
                CACHE_DATA["last_updated"] = current_time

                return {"data": final_employees, "source": "online"}

    except Exception as e:
        logger.error(f"HR CONNECTION ERROR: {e}")

    # 3. TRẢ VỀ LỖI
    logger.error("Failed to fetch HR Data. Returning empty list.")
    return {"data": [], "source": "error"}

# --- ROUTE CHÍNH: LẤY DANH SÁCH NHÂN VIÊN ---
@router.get("/api/employees")
async def get_employees(db: Session = Depends(get_db)):
    # BƯỚC 1: Lấy kết quả từ hàm fetch
    hr_result = await fetch_hr_data_async()
    
    hr_data = hr_result["data"]
    source = hr_result["source"]

    # --- SỬA ĐỔI: Chặn ngay nếu nguồn dữ liệu báo lỗi ---
    # Vì logic "No Backup", nên nếu lỗi là trả về 503 luôn để Frontend bắt vào catch
    if source == "error":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Mất kết nối đến hệ thống nhân sự (HR Server).",
        )

    # BƯỚC 2: Lấy thông tin 'Lần in cuối' từ Database nội bộ
    # (Phần này giữ nguyên: Nếu DB nội bộ lỗi thì vẫn hiển thị list nhân viên bình thường)
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
    for emp in hr_data:
        emp_id = emp.get("employee_id")
        if emp_id in print_map:
            emp["last_printed_at"] = print_map[emp_id]

    # TRẢ VỀ
    return {
        "source": "online", # Lúc nào cũng là online vì nếu lỗi đã raise Exception ở trên rồi
        "data": hr_data
    }