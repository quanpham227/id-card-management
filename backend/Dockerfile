# Dùng Python 3.9 bản slim cho nhẹ
FROM python:3.10

# [THÊM MỚI 1] Cấu hình biến môi trường quan trọng cho Docker
# - PYTHONDONTWRITEBYTECODE: Ngăn Python tạo file .pyc (rác) trong container
# - PYTHONUNBUFFERED: Quan trọng! Giúp log hiện ngay lập tức ra màn hình console (nếu không có, log sẽ bị delay hoặc mất khi crash)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Đặt thư mục làm việc
WORKDIR /app

# [QUAN TRỌNG] Copy requirements trước để tận dụng Docker Cache
# Nếu bạn chỉ sửa code mà không sửa thư viện, Docker sẽ bỏ qua bước này -> Build siêu nhanh
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code backend vào
COPY . .

# Tạo thư mục chứa ảnh và cấp quyền ghi (Rất tốt)
RUN mkdir -p static/images && chmod -R 777 static/images

# Chạy server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

