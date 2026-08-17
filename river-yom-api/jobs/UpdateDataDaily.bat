@echo off
echo ===============================
echo เริ่มอัพเดท Reservoir Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateReservoirData
echo.

echo ===============================
echo เริ่มอัพเดท Flow Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateFlowData
echo.

echo ===============================
echo เริ่มอัพเดท Gate Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateGateData
echo.

echo ===============================
echo เริ่มอัพเดท Model Data...
echo ===============================
curl -X POST https://wms-yom-right.rid.go.th/river-yom-api/api/model_input_data/update-from-main
echo.

@echo off
echo ===============================
echo เริ่ม download report rid3
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateDailyReportFiles
echo.

echo ===============================
echo เริ่มอัพเดท Gate Data...
echo ===============================
curl -s https://wms-yom-right.rid.go.th/river-yom-api/jobs/updateTeleData
echo.

echo งานทั้งหมดเสร็จสิ้น!

