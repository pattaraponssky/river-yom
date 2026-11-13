@echo off
setlocal
set MYSQL_DB=river_yom
set BACKUP_DIR=C:\xampp\backup
set MYSQL_CNF=C:\xampp\secrets\mysql_backup.cnf

if not exist "%MYSQL_CNF%" (
    echo Missing %MYSQL_CNF%
    exit /b 1
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format \"ddd-dd-MMM-yyyy\""') do set DATESTAMP=%%i

set BACKUP_FILE=%BACKUP_DIR%\%MYSQL_DB%_%DATESTAMP%.sql

"C:\xampp\mysql\bin\mysqldump.exe" --defaults-extra-file="%MYSQL_CNF%" %MYSQL_DB% > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo Backup complete: %BACKUP_FILE%
) else (
    echo Backup FAILED!
)

endlocal
