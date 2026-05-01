<?php
namespace App\Controllers;
use CodeIgniter\Controller;
use Config\Database;
use App\Models\ReservoirModel; 
use App\Models\RainModel; 
use App\Models\FlowModel; 
use App\Models\GateModel; 
use App\Models\SeaModel; 
use CodeIgniter\API\ResponseTrait;

class API extends Controller
{
    use ResponseTrait;

    protected $stationMapping = [
        "Y.15" => 194202,
        "Y.16" => 143157,
        "Y.4" => 125488,
        "Y.50" => 84876,
        "Y.64" => 55628,
        "Y.51" => 55628,
        "Y.17" => 55628,
    ];

    public function getFilteredRasOutput()
    {
        $filePath = 'C:\xampp\htdocs\ras-output\output_ras.csv'; 
        
        if (!file_exists($filePath)) {
            return $this->failNotFound('CSV file not found at the specified path.');
        }

        $csvFile = fopen($filePath, 'r');
        if (!$csvFile) {
            return $this->failServerError('Could not open CSV file.');
        }

        $header = fgetcsv($csvFile);
        $dateIndex = array_search('Date', $header);
        $crossSectionIndex = array_search('Cross Section', $header);
        $elevationIndex = array_search('Water_Elevation', $header);

        if ($dateIndex === false || $crossSectionIndex === false || $elevationIndex === false) {
            fclose($csvFile);
            return $this->failServerError('Missing required columns in CSV.');
        }

        $today = new \DateTime();
        $startDate = (clone $today)->modify('-6 days');
        $endDate = (clone $today)->modify('+7 days');

        $parsedData = [];
        $parsedWaterData = [];
        $stationMaxMap = [];

        while (($row = fgetcsv($csvFile)) !== false) {
            $rawTime = trim($row[$dateIndex]);
            $crossSection = (int) trim($row[$crossSectionIndex]);
            $elevation = (float) trim($row[$elevationIndex]);

            if (empty($rawTime)) continue;

            list($datePart, $timePart) = explode(" ", $rawTime);
            list($day, $month, $year) = explode("/", $datePart);
            $formattedDate = sprintf('%04d-%02d-%02d %s', $year, $month, $day, $timePart);
            $itemDate = new \DateTime($formattedDate);
            
            if ($itemDate >= $startDate && $itemDate <= $endDate) {
                // For WaterLevelData
                $isoDateStr = sprintf('%04d-%02d-%02dT%s', $year, $month, $day, str_replace(':', '', $timePart));
                $station = array_search($crossSection, $this->stationMapping);

                if ($station !== false) {
                    $parsedData[] = [
                        'time' => $isoDateStr,
                        'station' => $station,
                        'elevation' => $elevation
                    ];

                    // Track max elevation
                    if (!isset($stationMaxMap[$station]) || $elevation > $stationMaxMap[$station]) {
                        $stationMaxMap[$station] = $elevation;
                    }
                }

                $parsedWaterData[] = [
                    'CrossSection' => $crossSection,
                    'Date' => $formattedDate,
                    'WaterLevel' => $elevation,
                ];
            }
        }
        
        fclose($csvFile);

        $response = [
            'parsedData' => $parsedData,
            'parsedWaterData' => $parsedWaterData,
            'stationMaxMap' => $stationMaxMap,
        ];

        return $this->respond($response, 200);
    }

    public function previewUpdate()
    {
        $input = $this->request->getJSON(true);
        if (!is_array($input)) {
            return $this->response->setStatusCode(400, 'Invalid input format');
        }
    
        $result = [];
    
        // --- เช็กข้อมูลอ่างเก็บน้ำ ---
        if (isset($input['reservoir'])) {
            $model = new ReservoirModel();
            foreach ($input['reservoir'] as $data) {
                if (!isset($data['res_code'], $data['date'])) continue;
    
                $exists = $model->recordExists($data['res_code'], $data['date']);
                $result[] = [
                    'type' => 'reservoir',
                    'code' => $data['res_code'],
                    'date' => $data['date'],
                    'status' => $exists ? 'update' : 'insert',
                    'data' => $data,
                ];
            }
        }
    
        // --- เช็กข้อมูลฝน ---
        if (isset($input['rain'])) {
            $model = new RainModel();
            foreach ($input['rain'] as $data) {
                if (!isset($data['sta_code'], $data['date'])) continue;
    
                $exists = $model->recordExists($data['sta_code'], $data['date']);
                $result[] = [
                    'type' => 'rain',
                    'code' => $data['sta_code'],
                    'date' => $data['date'],
                    'status' => $exists ? 'update' : 'insert',
                    'data' => $data,
                ];
            }
        }
    
        // --- เช็กข้อมูลระดับน้ำ ---
        if (isset($input['flow'])) {
            $model = new FlowModel();
            foreach ($input['flow'] as $data) {
                if (!isset($data['sta_code'], $data['date'])) continue;
    
                $exists = $model->recordExists($data['sta_code'], $data['date']);
                $result[] = [
                    'type' => 'flow',
                    'code' => $data['sta_code'],
                    'date' => $data['date'],
                    'status' => $exists ? 'update' : 'insert',
                    'data' => $data,
                ];
            }
        }

        if (isset($input['gate'])) {
            $model = new GateModel();
            foreach ($input['gate'] as $data) {
                if (!isset($data['sta_code'], $data['date'])) continue;
    
                $exists = $model->recordExists($data['sta_code'], $data['date']);
                $result[] = [
                    'type' => 'gate',
                    'code' => $data['sta_code'],
                    'date' => $data['date'],
                    'status' => $exists ? 'update' : 'insert',
                    'data' => $data,
                ];
            }
        }

          // --- เช็กข้อมูลระดับน้ำ ---
          if (isset($input['sea'])) {
            $model = new SeaModel();
            foreach ($input['sea'] as $data) {
                if (!isset($data['sta_code'], $data['datetime'])) continue;
    
                $exists = $model->recordExists($data['sta_code'], $data['datetime']);
                $result[] = [
                    'type' => 'sea',
                    'code' => $data['sta_code'],
                    'datetime' => $data['datetime'],
                    'status' => $exists ? 'update' : 'insert',
                    'data' => $data,
                ];
            }
        }
    
        return $this->response->setJSON($result);
    }

    public function dailySummary()
    {
        $rainModel = new RainModel();
        $flowModel = new FlowModel();
        $gateModel = new GateModel();
        $reservoirModel = new ReservoirModel();

        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));

        // 1. ฝนเฉลี่ยของทุกสถานี
        $stations = ['690171', '690151', '40052', '40062']; // <== ปรับตามชื่อสถานีของคุณ

        // 🔹 คำนวณฝนเฉลี่ยเฉพาะสถานีที่เลือก
        $avgRain = $rainModel
            ->selectAvg('rain_mm', 'avg_rain')
            ->where('date', $yesterday)
            ->whereIn('sta_code', $stations)
            ->first();

        // 2. Discharge Gate ของสถานีที่กำหนด
        $stations = ['tng', 'wst', 'kpk'];

        // 🔹 ดึงข้อมูลของ "วันนี้" ก่อน
        $dischargeGateData = $gateModel
            ->select('sta_code, discharge')
            ->where('date', $today)
            ->whereIn('sta_code', $stations)
            ->where('discharge IS NOT NULL', null, false)
            ->findAll();

        // แปลงเป็น associative array
        $dischargeSummaryGate = [];
        $allZeroGate = true;

        foreach ($dischargeGateData as $d) {
            $dischargeSummaryGate[$d['sta_code']] = $d['discharge'];
            if (floatval($d['discharge']) > 0) {
                $allZeroGate = false;
            }
        }

        // 🔸 ถ้าทุกสถานี discharge = 0 หรือไม่มีข้อมูล ให้ใช้ของเมื่อวานแทน
        if (empty($dischargeGateData) || $allZeroGate) {
            $dischargeGateDataYesterday = $gateModel
                ->select('sta_code, discharge')
                ->where('date', $yesterday)
                ->whereIn('sta_code', $stations)
                ->where('discharge IS NOT NULL', null, false)
                ->findAll();

            $dischargeSummaryGate = [];
            foreach ($dischargeGateDataYesterday as $d) {
                $dischargeSummaryGate[$d['sta_code']] = $d['discharge'];
            }
        }

         // 3. Discharge Flow ของสถานีที่กำหนด
        $stationsFlow = ['Y.15', 'Y.16', 'Y.4', 'Y.50', 'Y.64', 'Y.51', 'Y.17'];

        // 🔹 ดึงข้อมูลของ "วันนี้" ก่อน
        $dischargeFlowData = $flowModel
            ->select('sta_code, discharge')
            ->where('date', $today)
            ->whereIn('sta_code', $stationsFlow)
            ->where('discharge IS NOT NULL', null, false)
            ->findAll();

        // แปลงเป็น associative array
        $dischargeSummaryFlow = [];
        $allZeroFlow = true;

        foreach ($dischargeFlowData as $d) {
            $dischargeSummaryFlow[$d['sta_code']] = $d['discharge'];
            if (floatval($d['discharge']) > 0) {
                $allZeroFlow = false;
            }
        }

        // 🔸 ถ้าทุกสถานี discharge = 0 หรือไม่มีข้อมูล ให้ใช้ของเมื่อวานแทน
        if (empty($dischargeFlowData) || $allZeroFlow) {
            $dischargeFlowDataYesterday = $flowModel
                ->select('sta_code, discharge')
                ->where('date', $yesterday)
                ->whereIn('sta_code', $stationsFlow)
                ->where('discharge IS NOT NULL', null, false)
                ->findAll();

            $dischargeSummaryFlow = [];
            foreach ($dischargeFlowDataYesterday as $d) {
                $dischargeSummaryFlow[$d['sta_code']] = $d['discharge'];
            }
        }

        // 4. Volume น้ำรวมของอ่าง
       $todayData = $reservoirModel
            ->select('res_code, volume')
            ->where('date', $today)
            ->findAll();

        // ตรวจสอบว่ามีค่า volume เป็น 0 หรือไม่
        $hasZeroVolumeFlow = false;
        foreach ($todayData as $row) {
            if (floatval($row['volume']) == 0) {
                $hasZeroVolumeFlow = true;
                break;
            }
        }

        // 🔸 ถ้ามีค่า 0 → ใช้ข้อมูลของเมื่อวานแทน
        if ($hasZeroVolumeFlow || empty($todayData)) {
            $totalVolumeData = $reservoirModel
                ->selectSum('volume', 'total_volume')
                ->where('date', $yesterday)
                ->first()['total_volume'] ?? 0;
        } else {
            $totalVolumeData = $reservoirModel
                ->selectSum('volume', 'total_volume')
                ->where('date', $today)
                ->first()['total_volume'] ?? 0;
        }

        // 🔹 คำนวณค่ารวมสุทธิ
        $totalVolume = $totalVolumeData - 57.46;

        // 5. Flow: นับจำนวนสถานีที่ wl มากกว่าที่กำหนด
        $wlThresholds = [
            'Y.4' => 1.8,
            'Y.15' => 3.5,
            'Y.50' => 1.5,
            'Y.16' => 2.4,
            'Y.64' => 1.5,
            'Y.51' => 1.5,
            'Y.17' => 1.5,
        ];

        $stationsOverWL = 0;
        $flowToday = $flowModel->where('date', $today)->findAll();
        foreach ($flowToday as $f) {
            if (isset($wlThresholds[$f['sta_code']]) && $f['wl'] > $wlThresholds[$f['sta_code']]) {
                $stationsOverWL++;
            }
        }

        return $this->respond([
            'date' => $today,
            'avg_rain_mm' => round($avgRain['avg_rain'], 2),
            'discharge_gate' => $dischargeSummaryGate,
            'discharge_flow' => $dischargeSummaryFlow,
            // 'total_reservoir_volume' => round($totalVolume, 2),
            'flow_stations_over_wl' => $stationsOverWL
        ]);
    }

}
