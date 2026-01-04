import os
import json
import logging
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.schemas import PrintRequest
from datetime import datetime
from sqlalchemy import func, case
from app import models


# Import từ các module khác trong app
from app.schemas import PrintLogRequest
from app.config import LOG_FILE

# Khởi tạo Router và Logger
router = APIRouter(prefix="/api/print", tags=["Print & Stats"])
logger = logging.getLogger(__name__)


# 1. API Ghi nhận in (Gửi từ BulkPrintModal.jsx)
@router.post("/log")
def log_print(request: schemas.PrintRequest, db: Session = Depends(get_db)):
    try:
        count = 0
        for item in request.employees:
            # Lấy reason từ chính object nhân viên gửi lên, nếu không có thì lấy reason mặc định của request
            final_reason = item.reason if item.reason else request.reason
            new_log = models.PrintLog(
                employee_id=item.employee_id,
                employee_name=item.employee_name,
                department=item.department,
                reason=final_reason,
                printed_by=request.printed_by,
                printed_at=datetime.now()
            )
            db.add(new_log)
            count += 1
        db.commit()
        return {"status": "success", "message": f"Logged {count} prints"}
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi lưu log in: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# app/routers/print.py
from sqlalchemy import func, case 

@router.get("/stats")
def get_print_stats(db: Session = Depends(get_db)):
    try:
        # 1. Truy vấn thống kê từ bảng PrintLog (Thẻ nhân viên)
        # Sử dụng từ khóa Tiếng Anh để lọc chính xác tuyệt đối
        emp_stats = db.query(
            func.strftime('%Y-%m', models.PrintLog.printed_at).label('month'),
            func.sum(case((models.PrintLog.reason == 'pregnancy', 1), else_=0)).label('pregnancy'),
            func.sum(case((models.PrintLog.reason == 'has_baby', 1), else_=0)).label('has_baby'),
            func.sum(case((models.PrintLog.reason == 'normal', 1), else_=0)).label('normal')
        ).group_by('month').all()

        # 2. Truy vấn thống kê từ bảng ToolPrintLog (Thẻ phụ/Công cụ)
        tool_stats = db.query(
            func.strftime('%Y-%m', models.ToolPrintLog.printed_at).label('month'),
            func.sum(models.ToolPrintLog.quantity).label('tool_total')
        ).group_by('month').all()

        # 3. Gộp dữ liệu từ hai bảng vào một Dictionary chung
        combined = {}

        # Xử lý dữ liệu thẻ nhân viên
        for row in emp_stats:
            month = row.month
            combined[month] = {
                "month": month,
                "Pregnancy": int(row.pregnancy or 0),
                "HasBaby": int(row.has_baby or 0),
                "Normal": int(row.normal or 0),
                "Tools": 0,
                "total": 0  # Sẽ tính sau
            }

        # Xử lý gộp dữ liệu thẻ phụ (Tools)
        for row in tool_stats:
            month = row.month
            val = int(row.tool_total or 0)
            if month in combined:
                combined[month]["Tools"] = val
            else:
                combined[month] = {
                    "month": month,
                    "Pregnancy": 0,
                    "HasBaby": 0,
                    "Normal": 0,
                    "Tools": val,
                    "total": 0
                }

        # 4. Tính toán tổng số lượng cho mỗi tháng và chuyển về dạng danh sách (List)
        final_result = []
        for key in combined:
            item = combined[key]
            item["total"] = item["Pregnancy"] + item["HasBaby"] + item["Normal"] + item["Tools"]
            final_result.append(item)

        # Sắp xếp kết quả theo thứ tự tháng tăng dần
        return sorted(final_result, key=lambda x: x['month'])

    except Exception as e:
        # Xử lý lỗi và ghi log
        logger.error(f"Database Error: {e}")
        # Trả về mảng rỗng để Frontend không bị crash
        return []
# app/routers/print.py (hoặc file tương đương)

@router.post("/log-tool")
def log_tool_print(request: schemas.ToolPrintCreate, db: Session = Depends(get_db)):
    try:
        new_log = models.ToolPrintLog(
            card_type=request.card_type,
            serial_number=request.serial_number,
            quantity=request.quantity,
            orientation=request.orientation,
            printed_by=request.printed_by,
            printed_at=datetime.now()
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return {"status": "success", "id": new_log.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi lưu log in thẻ phụ: {e}")
        raise HTTPException(status_code=500, detail="Không thể lưu lịch sử in công cụ")
    
