@echo off
setlocal

:: ตั้งค่าพื้นฐาน
set MYSQL_USER=root
set MYSQL_DB=swoc_thachin
set BACKUP_DIR=C:\xampp\backup

:: สร้างโฟลเดอร์ถ้ายังไม่มี
if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

:: ใช้ powershell ให้ได้วันที่แบบอังกฤษ (Fri-27-Sep-2025)
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"ddd-dd-MMM-yyyy\""') do set DATESTAMP=%%i

:: กำหนดชื่อไฟล์ backup
set BACKUP_FILE=%BACKUP_DIR%\%MYSQL_DB%_%DATESTAMP%.sql

:: รัน mysqldump
"C:\xampp\mysql\bin\mysqldump.exe" -u %MYSQL_USER% %MYSQL_DB% > %BACKUP_FILE%

echo ✅ Backup complete: %BACKUP_FILE%
endlocal
