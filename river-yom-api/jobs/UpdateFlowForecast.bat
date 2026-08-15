@echo off
echo ===============================
echo เริ่มอัพเดท Flow Forecast Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/api/flow_forecast/import_forecast
echo.

@echo off
echo ===============================
echo เก็บผล Flow Forecast Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/snapshot/run/SwocThachinForecastSnapshot2025
echo.


echo งานทั้งหมดเสร็จสิ้น!

