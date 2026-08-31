@echo off

REM Path to HEC-DSSVue executable ตำแหน่งไฟล์ โปรแกรม HEC-DSSVue.exe
set DSSVUE_PATH="C:\Program Files\HEC\HEC-DSSVue\HEC-DSSVue.exe"

set SCRIPT_PATH="C:\xampp\htdocs\rid3-model\ras-output-gate.py"

REM Run the Python script through HEC-DSSVue
%DSSVUE_PATH% -s %SCRIPT_PATH%

REM Check if the command was successful
if %ERRORLEVEL%==0 (
    echo Success
) else (
    echo Error 
)

pause
