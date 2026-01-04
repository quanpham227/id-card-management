@echo off
TITLE ID Card System Server
ECHO ======================================================
ECHO  DANG KHOI DONG HE THONG PI VINA ID CARD...
ECHO  Vui long khong tat cua so nay khi dang su dung.
ECHO ======================================================
ECHO.

cd backend

:: Cài đặt thư viện nếu thiếu (Chỉ chạy lần đầu, sau này có thể bỏ dòng này cho nhanh)
:: pip install -r requirements.txt

ECHO Dang khoi dong Python Server...
ECHO Truy cap web tai: http://localhost:8000
ECHO.

python -m app.main

PAUSE