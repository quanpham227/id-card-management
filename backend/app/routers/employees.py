import os
import json
import requests
import logging
from typing import List, Optional

# [MỚI] Import các thành phần để làm việc với Database
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

from app.config import BACKUP_FILE

# Cấu hình URL HR
HR_API_URL = "http://113.160.232.187:81/pidn/api/gwhrWebService.asmx/GetEmployeeList"

router = APIRouter()
logger = logging.getLogger(__name__)

# --- HÀM HELPER: GỌI HR & BACKUP (GIỮ NGUYÊN NHƯ CŨ) ---
def fetch_hr_data_json():
    payload = {"arg_UserId": "", "arg_Pass": ""}
    headers = {"Content-Type": "application/json; charset=utf-8"}
    final_employees = []
    
    # 1. GỌI HR SERVER
    try:
        logger.info(f"Connecting to HR System: {HR_API_URL}")
        response = requests.post(HR_API_URL, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            raw_text = response.text
            decoder = json.JSONDecoder()
            json_response, idx = decoder.raw_decode(raw_text)
            
            if "d" in json_response:
                data_obj = json.loads(json_response["d"]) if isinstance(json_response["d"], str) else json_response["d"]
            else:
                data_obj = json_response

            if isinstance(data_obj, dict) and data_obj.get("success") == True and "data" in data_obj:
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
                        
                        # [MỚI] Mặc định giá trị này là None, sẽ được điền ở bước sau
                        "last_printed_at": None 
                    }
                    final_employees.append(emp)

                # LƯU BACKUP
                try:
                    with open(BACKUP_FILE, "w", encoding="utf-8") as f:
                        json.dump(final_employees, f, ensure_ascii=False, indent=4)
                    logger.info(f"Backup updated: {len(final_employees)} records")
                except Exception as e:
                    logger.error(f"Backup failed: {e}")
                
                return final_employees

    except Exception as e:
        logger.error(f"HR CONNECTION ERROR: {e}")

    # 2. DÙNG BACKUP NẾU LỖI
    logger.warning("Switching to OFFLINE mode (Backup Data)...")
    if os.path.exists(BACKUP_FILE):
        try:
            with open(BACKUP_FILE, "r", encoding="utf-8") as f:
                backup_data = json.load(f)
                return backup_data
        except Exception as e:
            logger.error(f"Backup read error: {e}")
            return []
    
    return []

# --- API ENDPOINTS (ĐÃ CẬP NHẬT LOGIC MERGE) ---

@router.get("/api/employees")
def get_employees(db: Session = Depends(get_db)): # [MỚI] Thêm Session DB
    # BƯỚC 1: Lấy danh sách từ HR (nguồn chính)
    hr_data = fetch_hr_data_json()
    
    if not hr_data or len(hr_data) == 0:
        logger.error("CRITICAL: HR and Backup both failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hệ thống HR mất kết nối và không tìm thấy dữ liệu dự phòng."
        )

    # BƯỚC 2: [MỚI] Lấy thông tin 'Lần in cuối' từ Database nội bộ
    # Logic: Tìm thời gian in mới nhất (MAX date) của từng nhân viên trong bảng PrintLog
    try:
        last_print_query = db.query(
            models.PrintLog.employee_id,
            func.max(models.PrintLog.printed_at).label("last_printed")
        ).group_by(models.PrintLog.employee_id).all()

        # Chuyển kết quả thành Dictionary để tra cứu nhanh: {'NV001': datetime(...), 'NV002': ...}
        print_map = {row.employee_id: row.last_printed for row in last_print_query}
    except Exception as e:
        logger.error(f"Database Query Error (PrintLog): {e}")
        print_map = {} # Nếu lỗi DB thì coi như chưa ai in, vẫn trả về danh sách HR bình thường

    # BƯỚC 3: [MỚI] Ghép dữ liệu (Merge)
    # Duyệt qua danh sách HR, nếu thấy ai có trong print_map thì cập nhật ngày in
    final_list = []
    for emp in hr_data:
        emp_id = emp.get("employee_id")
        
        # Nếu tìm thấy mã nhân viên trong lịch sử in -> Gán ngày vào
        if emp_id in print_map:
            emp["last_printed_at"] = print_map[emp_id]
        
        final_list.append(emp)

    return final_list