@echo off
echo ===============================
echo เริ่มอัพเดท Rain Data...
echo ===============================
curl -s https://swocthachin.rid.go.th/swoc-api/jobs/updateRainData
echo.

echo ===============================
echo เริ่มอัพเดท waterlevel Hourly Data...
echo ===============================
curl -s https://swocthachin.rid.go.th/swoc-api/jobs/updateFlowHourlyData
echo.

echo งานทั้งหมดเสร็จสิ้น!

