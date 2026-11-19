@echo off
setlocal
set "MYSQL_USER=admin"
set "MYSQL_PASSWORD=admin1234"
set "MYSQL_DB=river_yom"
set "BACKUP_DIR=C:\xampp\backup"

if not exist "%BACKUP_DIR%\." mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\." exit /b 1

set "DATESTAMP="
for /f "delims=" %%i in ('powershell.exe -NoProfile -Command "[DateTime]::Now.ToString('ddd-dd-MMM-yyyy',[Globalization.CultureInfo]::InvariantCulture)"') do set "DATESTAMP=%%i"
if not defined DATESTAMP (
    echo Backup failed: could not determine the date.
    exit /b 1
)

set "BACKUP_FILE=%BACKUP_DIR%\%MYSQL_DB%_%DATESTAMP%.sql"

"C:\xampp\mysql\bin\mysqldump.exe" -u "%MYSQL_USER%" "-p%MYSQL_PASSWORD%" "%MYSQL_DB%" > "%BACKUP_FILE%"
if errorlevel 1 (
    echo Backup failed.
    exit /b 1
)

echo Backup complete: "%BACKUP_FILE%"
endlocal
exit /b 0
