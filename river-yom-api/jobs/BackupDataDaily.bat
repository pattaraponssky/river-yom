@echo off
setlocal

:: ตั้งค่าพื้นฐาน
set MYSQL_USER=admin
set MYSQL_PASSWORD=admin1234
set MYSQL_DB=river_yom
set BACKUP_DIR=C:\xampp\backup

:: สร้างโฟลเดอร์ถ้ายังไม่มี
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: ใช้ PowerShell ให้ได้วันที่แบบอังกฤษ เช่น Fri-14-Aug-2026
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"ddd-dd-MMM-yyyy\""') do set DATESTAMP=%%i

:: กำหนดชื่อไฟล์ backup
set BACKUP_FILE=%BACKUP_DIR%\%MYSQL_DB%_%DATESTAMP%.sql

:: รัน mysqldump
"C:\xampp\mysql\bin\mysqldump.exe" -u%MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DB% > "%BACKUP_FILE%"

:: ตรวจสอบผลลัพธ์
if %ERRORLEVEL% EQU 0 (
    echo Backup complete: %BACKUP_FILE%
) else (
    echo Backup FAILED!
)

endlocal