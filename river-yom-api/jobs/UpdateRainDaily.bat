@echo off
echo ===============================
echo เริ่มอัพเดท Rain Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateRainData
echo.

echo ===============================
echo เริ่มอัพเดท waterlevel Hourly Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateFlowHourlyData
echo.

echo งานทั้งหมดเสร็จสิ้น!

