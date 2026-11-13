@echo off
setlocal
echo ===============================
echo เริ่มอัพเดท Flow Forecast Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/flow_forecast/import_forecast
echo.

echo ===============================
echo เก็บผล Flow Forecast Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/snapshot/run
echo.

echo งานทั้งหมดเสร็จสิ้น!
endlocal
