import logging
from datetime import datetime
import pytz
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_

# Import nội bộ
from app.database import get_db
from app import models, schemas
from app.config import LOG_FILE

# Khởi tạo Router và Logger
router = APIRouter(prefix="/api/print", tags=["Print & Stats"])
logger = logging.getLogger(__name__)


# ============================================================
# 1. API GHI NHẬN IN (Batch Log)
# ============================================================
@router.post("/log")
def log_print(request: schemas.PrintRequest, db: Session = Depends(get_db)):
    try:
        count = 0
        for item in request.employees:
            # Ưu tiên lý do của từng nhân viên, nếu không có thì lấy lý do chung
            final_reason = item.reason if item.reason else request.reason

            new_log = models.PrintLog(
                employee_id=item.employee_id,
                employee_name=item.employee_name,
                department=item.department,
                reason=final_reason,  # Lưu ý: Frontend cần gửi đúng format (vd: 'pregnancy', 'normal')
                printed_by=request.printed_by,
                printed_at=datetime.now(),
            )
            db.add(new_log)
            count += 1

        db.commit()
        return {"status": "success", "message": f"Logged {count} prints"}

    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi lưu log in: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 2. API THỐNG KÊ (Đã sửa logic so sánh chuỗi)
# ============================================================
@router.get("/stats")
def get_print_stats(db: Session = Depends(get_db)):
    try:
        # Tự động chọn hàm lấy tháng tùy theo loại DB (Postgres hay SQLite)
        engine_name = db.get_bind().dialect.name
        if engine_name == 'postgresql':
            date_format = func.to_char(models.PrintLog.printed_at, 'YYYY-MM')
            tool_date_format = func.to_char(models.ToolPrintLog.printed_at, 'YYYY-MM')
        else:
            date_format = func.strftime("%Y-%m", models.PrintLog.printed_at)
            tool_date_format = func.strftime("%Y-%m", models.ToolPrintLog.printed_at)

        # 1. Thống kê Thẻ Nhân Viên
        emp_stats = (
            db.query(
                date_format.label("month"),
                func.sum(case((models.PrintLog.reason.ilike("%Pregnancy%"), 1), else_=0)).label("pregnancy"),
                func.sum(case((models.PrintLog.reason.ilike("%Baby%"), 1), else_=0)).label("has_baby"),
                # Cách đếm Normal an toàn hơn: Tổng số dòng trừ đi Pregnancy và Baby
                func.count(models.PrintLog.id).label("total_emp_logs")
            )
            .group_by("month")
            .all()
        )

        # 2. Thống kê Thẻ Công Cụ
        tool_stats = (
            db.query(
                tool_date_format.label("month"),
                func.sum(models.ToolPrintLog.quantity).label("tool_total"),
            )
            .group_by("month")
            .all()
        )

        combined = {}

        # 3. Gộp dữ liệu nhân viên
        for row in emp_stats:
            month = row.month or "Unknown"
            preg = int(row.pregnancy or 0)
            baby = int(row.has_baby or 0)
            total_logs = int(row.total_emp_logs or 0)
            
            # Tính Normal bằng cách lấy Tổng trừ các loại đặc biệt
            normal = total_logs - preg - baby
            if normal < 0: normal = 0

            combined[month] = {
                "month": month,
                "Pregnancy": preg,
                "HasBaby": baby,
                "Normal": normal,
                "Tools": 0,
                "total": 0,
            }

        # 4. Gộp dữ liệu công cụ
        for row in tool_stats:
            month = row.month or "Unknown"
            val = int(row.tool_total or 0)
            if month not in combined:
                combined[month] = {"month": month, "Pregnancy": 0, "HasBaby": 0, "Normal": 0, "Tools": 0, "total": 0}
            combined[month]["Tools"] = val

        # 5. Tính tổng cuối cùng
        final_result = []
        for item in combined.values():
            item["total"] = item["Pregnancy"] + item["HasBaby"] + item["Normal"] + item["Tools"]
            final_result.append(item)

        return sorted(final_result, key=lambda x: x["month"])

    except Exception as e:
        logger.error(f"Stats Error chi tiết: {str(e)}")
        return []


# ============================================================
# 3. API GHI NHẬN IN THẺ PHỤ/CÔNG CỤ
# ============================================================
@router.post("/log-tool")
def log_tool_print(request: schemas.ToolPrintCreate, db: Session = Depends(get_db)):
    try:
        # 1. Xử lý múi giờ Việt Nam (Hoặc dùng datetime.utcnow())
        tz_vietnam = pytz.timezone('Asia/Ho_Chi_Minh')
        current_time = datetime.now(tz_vietnam)

        # 2. Tạo đối tượng Log mới
        new_log = models.ToolPrintLog(
            card_type=request.card_type,
            serial_number=request.serial_number,
            # Ép kiểu số để an toàn cho tính toán thống kê sau này
            quantity=int(request.quantity or 0), 
            orientation=request.orientation,
            printed_by=request.printed_by,
            printed_at=current_time, 
        )

        db.add(new_log)
        db.flush() # Đẩy dữ liệu vào staging để kiểm tra lỗi ràng buộc trước khi commit
        db.commit()
        db.refresh(new_log)

        logger.info(f"Đã lưu log in thẻ phụ cho: {request.card_type}")
        return {"status": "success", "id": new_log.id}

    except Exception as e:
        db.rollback()
        # Log chi tiết lỗi ra console/file để debug dễ hơn
        logger.error(f"Lỗi lưu log in thẻ phụ chi tiết: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Không thể lưu lịch sử in công cụ: {str(e)}"
        )
