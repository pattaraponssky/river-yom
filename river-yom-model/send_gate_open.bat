@echo off
python C:\xampp\htdocs\river-yom-model\send_gate_open.py
IF %ERRORLEVEL% EQU 0 (
    echo Success Run
) ELSE (
    echo Error: Script failed with exit code %ERRORLEVEL%.
)
pause
