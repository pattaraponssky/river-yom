@echo off
py C:\xampp\htdocs\river-yom-model\hec_ras_run.py
IF %ERRORLEVEL% EQU 0 (
    echo Success Run
) ELSE (
    echo Error: Script failed with exit code %ERRORLEVEL%.
)
pause
