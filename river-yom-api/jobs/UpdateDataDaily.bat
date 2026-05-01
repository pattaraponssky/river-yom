@echo off
echo ===============================
echo เริ่มอัพเดท Reservoir Data...
echo ===============================
curl -s https://swocthachin.rid.go.th/swoc-api/jobs/updateReservoirData
echo.

echo ===============================
echo เริ่มอัพเดท Flow Data...
echo ===============================
curl -s https://swocthachin.rid.go.th/swoc-api/jobs/updateFlowData
echo.

echo ===============================
echo เริ่มอัพเดท Gate Data...
echo ===============================
curl -s https://swocthachin.rid.go.th/swoc-api/jobs/updateGateData
echo.

echo ===============================
echo เริ่มอัพเดท Model Data...
echo ===============================
curl -X POST https://swocthachin.rid.go.th/swoc-api/api/model_input_data/update-from-main
echo.

echo งานทั้งหมดเสร็จสิ้น!

