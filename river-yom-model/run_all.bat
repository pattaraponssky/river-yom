@echo off
color F0
title Run Full Hydrology Workflow
echo ========= Start Full Workflow =========
echo.

:: STEP 1 - เรียก PHP สำหรับโหลดข้อมูลฝน
echo Step 1: Download rain grid
curl http://localhost/swoc-model/hec_api/dowload_rain_grid.php
echo.

:: STEP 2 - เขียน input TXT
echo Step 2: Write input txt
curl http://localhost/swoc-model/hec_api/write_input_txt.php
echo.

:: STEP 3 - Run HEC-DSSVue สำหรับ input-hms
echo Step 3: Run DSSVue for input-hms.py
set DSSVUE_PATH="C:\Program Files\HEC\HEC-DSSVue\HEC-DSSVue.exe"
set SCRIPT_PATH="C:\xampp\htdocs\swoc-model\HMS_Thachin\input-hms\input-hms.py"
%DSSVUE_PATH% -s %SCRIPT_PATH%
if %ERRORLEVEL%==0 (
    echo [OK] DSSVue input-hms.py finished
) else (
    echo [ERROR] DSSVue input-hms.py failed
    pause
    exit /b
)
echo.

:: STEP 4 - เขียน input TXT
echo Step 4: Write input txt
curl http://localhost/swoc-model/hec_api/write_input_gate.php
echo.

:: STEP 5 - Run HEC-DSSVue สำหรับ input-gate
echo Step 5: Run DSSVue for input-gate.py
set DSSVUE_PATH="C:\Program Files\HEC\HEC-DSSVue\HEC-DSSVue.exe"
set SCRIPT_PATH="C:\xampp\htdocs\swoc-model\RAS_Input\input-gate.py"
%DSSVUE_PATH% -s %SCRIPT_PATH%
if %ERRORLEVEL%==0 (
    echo [OK] DSSVue input-gate.py finished
) else (
    echo [ERROR] DSSVue input-gate.py failed
    pause
    exit /b
)
echo.

:: STEP 6 - Run HEC-HMS ผ่าน Jython
echo Step 6: Run HEC-HMS via Jython
set "HEC_HMS_PATH=C:\Program Files\HEC\HEC-HMS\4.13"
set "JYTHON_PATH=C:\jython2.7.4\bin\jython"
set "SCRIPT_PATH=C:\xampp\htdocs\swoc-model\hms-run.py"
set "USERPROFILE=C:\Users\Administrator"
set "PYTHONPATH=%HEC_HMS_PATH%\lib;%PYTHONPATH%"
set "JAVA_LIB_PATH=%HEC_HMS_PATH%\bin;%HEC_HMS_PATH%\bin\gdal"
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "CLASSPATH=%JAVA_HOME%\lib;%HEC_HMS_PATH%\hms.jar;%HEC_HMS_PATH%\lib\*"
set "PATH=%HEC_HMS_PATH%\bin\gdal;%PATH%"
%JYTHON_PATH% -Djava.library.path="%JAVA_LIB_PATH%" %SCRIPT_PATH%
if %ERRORLEVEL%==0 (
    echo [OK] HEC-HMS run complete
) else (
    echo [ERROR] HMS script failed
    pause
    exit /b
)
echo.

:: STEP 7 - Run HEC-RAS script
echo Step 7: Run hec_ras_run.py
py C:\xampp\htdocs\swoc-model\ras-set-data.py
py C:\xampp\htdocs\swoc-model\hec_ras_run.py
if %ERRORLEVEL%==0 (
    echo [OK] RAS Python run complete
) else (
    echo [ERROR] RAS Python script failed
    pause
    exit /b
)
echo.

:: STEP 8 - Run ras-output.py (สรุปผลลัพธ์ RAS)
echo Step 8: Run ras-output.py
py C:\xampp\htdocs\swoc-model\ras-output.py
if %ERRORLEVEL%==0 (
    echo [OK] ras-output.py run complete
) else (
    echo [ERROR] ras-output.py failed
    pause
    exit /b
)
echo.

@REM pause

echo ========= All Steps Completed Successfully =========
