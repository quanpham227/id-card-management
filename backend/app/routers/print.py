import logging
from datetime import datetime
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
        # 1. Thống kê Thẻ Nhân Viên
        # SỬA LỖI: Dùng ilike (không phân biệt hoa thường) và % để bắt các biến thể chuỗi
        emp_stats = (
            db.query(
                func.strftime("%Y-%m", models.PrintLog.printed_at).label("month"),
                # Đếm Pregnancy (Bắt tất cả: Pregnancy Register, Pregnancy >7 months...)
                func.sum(
                    case((models.PrintLog.reason.ilike("%Pregnancy%"), 1), else_=0)
                ).label("pregnancy"),
                # Đếm Has Baby
                func.sum(
                    case((models.PrintLog.reason.ilike("%Baby%"), 1), else_=0)
                ).label("has_baby"),
                # Đếm Normal (Staff, Worker, Manager...)
                # Logic: Nếu không phải Bầu và không phải Con nhỏ thì là Normal
                func.sum(
                    case(
                        (
                            ~models.PrintLog.reason.ilike("%Pregnancy%")
                            & ~models.PrintLog.reason.ilike("%Baby%"),
                            1,
                        ),
                        else_=0,
                    )
                ).label("normal"),
            )
            .group_by("month")
            .all()
        )

        # 2. Thống kê Thẻ Công Cụ
        tool_stats = (
            db.query(
                func.strftime("%Y-%m", models.ToolPrintLog.printed_at).label("month"),
                func.sum(models.ToolPrintLog.quantity).label("tool_total"),
            )
            .group_by("month")
            .all()
        )

        # 3. Gộp dữ liệu (Merge Data)
        combined = {}

        # - Xử lý nhân viên
        for row in emp_stats:
            month = row.month
            combined[month] = {
                "month": month,
                "Pregnancy": int(row.pregnancy or 0),
                "HasBaby": int(row.has_baby or 0),
                "Normal": int(row.normal or 0),
                "Tools": 0,
                "total": 0,
            }

        # - Xử lý công cụ (Nếu tháng đó chưa có trong dict thì tạo mới)
        for row in tool_stats:
            month = row.month
            val = int(row.tool_total or 0)

            if month not in combined:
                combined[month] = {
                    "month": month,
                    "Pregnancy": 0,
                    "HasBaby": 0,
                    "Normal": 0,
                    "Tools": 0,
                    "total": 0,
                }

            combined[month]["Tools"] = val

        # 4. Tính tổng và chuyển về List
        final_result = []
        for key, item in combined.items():
            item["total"] = (
                item["Pregnancy"] + item["HasBaby"] + item["Normal"] + item["Tools"]
            )
            final_result.append(item)

        # Sắp xếp theo tháng
        return sorted(final_result, key=lambda x: x["month"])

    except Exception as e:
        logger.error(f"Stats Error: {e}")
        return []


# ============================================================
# 3. API GHI NHẬN IN THẺ PHỤ/CÔNG CỤ
# ============================================================
@router.post("/log-tool")
def log_tool_print(request: schemas.ToolPrintCreate, db: Session = Depends(get_db)):
    try:
        new_log = models.ToolPrintLog(
            card_type=request.card_type,
            serial_number=request.serial_number,
            quantity=request.quantity,
            orientation=request.orientation,
            printed_by=request.printed_by,
            printed_at=datetime.now(),
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return {"status": "success", "id": new_log.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Lỗi lưu log in thẻ phụ: {e}")
        raise HTTPException(status_code=500, detail="Không thể lưu lịch sử in công cụ")
