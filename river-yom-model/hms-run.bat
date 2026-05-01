@echo off
echo Running Jython script...

set "HEC_HMS_PATH=C:\Program Files\HEC\HEC-HMS\4.13"
set "JYTHON_PATH=C:\jython2.7.4\bin\jython"
set "SCRIPT_PATH=C:\xampp\htdocs\swoc-model\hms-run.py"

:: กำหนด USERPROFILE ให้ไม่เกิด NullPointerException
set "USERPROFILE=C:\Users\Administrator"

:: เพิ่มเส้นทางของ HEC-HMS lib ไปยัง PYTHONPATH
set "PYTHONPATH=%HEC_HMS_PATH%\lib;%PYTHONPATH%"
set "JAVA_LIB_PATH=%HEC_HMS_PATH%\bin;%HEC_HMS_PATH%\bin\gdal"
set "PY_OPTS=-Dpython.path=%HEC_HMS_PATH%\lib\jython.jar;%HEC_HMS_PATH%\lib\jythonlib.jar"
set "JAVA_LIB_OPT=-Djava.library.path=%JAVA_LIB_PATH%"
set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "CLASSPATH=%JAVA_HOME%\lib;%HEC_HMS_PATH%\hms.jar;%HEC_HMS_PATH%\lib\*"
set "PATH=%HEC_HMS_PATH%\bin\gdal;%PATH%"

:: เรียกใช้ Jython พร้อมเส้นทางที่ตั้งไว้
%JYTHON_PATH% -Djava.library.path="C:\Program Files\HEC\HEC-HMS\4.13\bin;C:\Program Files\HEC\HEC-HMS\4.13\bin\gdal" %SCRIPT_PATH%

pause
