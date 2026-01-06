# HƯỚNG DẪN TRIỂN KHAI DỰ ÁN (DEPLOYMENT GUIDE)

Dự án sử dụng Docker để đóng gói. Quy trình deploy gồm 3 giai đoạn:
1. Build & Đóng gói (Trên máy Dev/Local).
2. Chuyển file lên Server (Ubuntu).
3. Chạy hệ thống (Trên Server).

---

## GIAI ĐOẠN 1: TẠO BỘ CÀI ĐẶT (Tại máy Dev)

**Bước 1: Chuẩn bị thư mục dữ liệu (Để tránh lỗi Docker)**
Mở terminal tại thư mục gốc dự án:
```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Path "data_storage\images" -Force
New-Item -ItemType File -Path "data_storage\sql_app.db"

# Mac/Linux
mkdir -p data_storage/images
touch data_storage/sql_app.db

Bước 2: Build Image (Tạo khuôn phần mềm)
# 1. Build Backend
docker build -t staffhub-backend:v1 -f backend/Dockerfile ./backend

# 2. Build Frontend (Sẽ mất vài phút)
docker build -t staffhub-frontend:v1 -f frontend/Dockerfile ./frontend

#Bước 3: Đóng gói thành file .tar (Tạo bộ cài)
docker save -o staffhub-deploy.tar staffhub-backend:v1 staffhub-frontend:v1


3 cho nó vô 1 thư mục , copy images và db copy sang ubuntu


docker-compose up -d
# Xem log
docker logs staffhub_backend
# dừng docker
docker-compose down

# dọn dẹp file không cần thiết
docker image prune -f

# 
docker exec -it staffhub_backend python create_super_admin.py

# đóng gói 
docker save -o staffhub-deploy.tar staffhub-backend:v1 staffhub-frontend:v1

deploy_package/
├── docker-compose.yml
├── staffhub-deploy.tar
├── nginx/
│   └── default.conf
└── data_storage/               <-- (Tên đúng phải là data_storage)
    ├── sql_app.db              <-- COPY FILE DB CŨ (CÓ DỮ LIỆU) VÀO ĐÂY (Xóa file mới đi)
    └── images/                 <-- COPY THƯ MỤC ẢNH CŨ VÀO ĐÂY
        ├── nhanvien1.jpg
        ├── nhanvien2.jpg
        └── ...

1. đăng nhập ubuntu 
ssh ubuntu_server
2. Mở PowerShell tại vị trí có thư mục deploy_package (hoặc mở PowerShell rồi cd đến đó).
scp -r deploy_package ubuntu_server:/home/quanpham/
3. mở tệp yml
nano docker-compose.yml
# lệnh tr+o để lưu nhấn enter rồi nhấn ctr + x

4. Chạy lại

sudo docker compose up -d

# xem logs
sudo docker logs staffhub_frontend
sudo docker logs staffhub_backend






# trên ubuntu 

# Dừng và xóa 2 container staffhub
sudo docker stop staffhub_frontend staffhub_backend
sudo docker rm staffhub_frontend staffhub_backend
# Xóa thư mục deploy_package cũ
sudo rm -rf ~/deploy_package

# copy sang ubuntu
scp -r deploy_package ubuntu_server:/home/quanpham/
# 1. Đi vào thư mục chứa bộ cài
cd ~/deploy_package

# 2. Cấp quyền sở hữu cho user hiện tại (quanpham)
sudo chown -R quanpham:quanpham .

# 3. Cấp quyền ghi tối đa cho thư mục chứa Database và Ảnh
# Việc này đảm bảo container Docker không bị lỗi "Permission Denied"
sudo chmod -R 777 data_storage

# 4. Kiểm tra lại quyền (thư mục data_storage phải có chữ drwxrwxrwx)
ls -ld data_storage

# Giả sử file của bạn tên là staffhub-deploy.tar
sudo docker load -i staffhub-deploy.tar

# Chạy ở chế độ chạy ngầm (detached)
sudo docker compose up -d

# Kiểm tra lại container
sudo docker ps

# xem log backend
sudo docker logs staffhub_backend

# Thiết lập Docker daemon tự động chạy khi bật máy
sudo systemctl enable docker

# Đảm bảo các container cũng tự khởi động (thêm dòng này vào docker-compose.yml nếu chưa có)
# restart: always

#!/bin/bash
# Tạo thư mục backup nếu chưa có
mkdir -p ~/deploy_package/backups
# Copy file db kèm theo ngày tháng
cp ~/deploy_package/data_storage/sql_app.db ~/deploy_package/backups/sql_app_$(date +%Y%m%d).db
# Xóa các bản backup cũ hơn 30 ngày để tiết kiệm dung lượng
find ~/deploy_package/backups -type f -mtime +30 -delete

#Mặc định Docker lưu log mãi mãi, nếu hệ thống chạy lâu ngày, file log có thể lên tới vài GB và làm treo server. Hãy giới hạn dung lượng log trong file docker-compose.yml:
nano docker-compose.yml
# thêm vào
services:
  staffhub_backend:
    # ... các config khác
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
# sau khi sửa tyhif khởi động lại
sudo docker compose up -d 
# kiểm tra :
sudo docker inspect staffhub_frontend --format='{{.HostConfig.LogConfig}}'

# Xem tiêu tốn bao nhieu dung lượng
sudo docker stats
#2. Xem log nhanh khi cần hỗ trợ người dùng
sudo docker logs --tail 20 staffhub_backend
#3. Dọn dẹp "rác" Docker (Nên làm sau mỗi lần cập nhật)
sudo docker image prune -f


# Cách xóa dư liêu cũ khi cần thiết:
# 1. Dừng hẳn hệ thống để giải phóng file
sudo docker compose down

# 2. Kiểm tra xem có file sqlite tạm nào không và xóa chúng (nếu có)
# Các file như sql_app.db-wal hoặc sql_app.db-shm có thể đang giữ dữ liệu cũ
rm -f data_storage/sql_app.db-wal data_storage/sql_app.db-shm

# 3. Thực hiện xóa dữ liệu một lần nữa khi container đã tắt
sqlite3 data_storage/sql_app.db "DELETE FROM tool_print_logs;"
sqlite3 data_storage/sql_app.db "DELETE FROM print_logs;"
sqlite3 data_storage/sql_app.db "VACUUM;"

# 4. Kiểm tra lại thời gian cập nhật file (Lúc này nó phải là giờ hiện tại)
ls -lh data_storage/sql_app.db

# 5. Khởi động lại hệ thống
sudo docker compose up -d