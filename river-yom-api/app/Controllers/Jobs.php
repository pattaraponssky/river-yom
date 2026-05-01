<?php

namespace App\Controllers;
use DateTime;
use DateInterval;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\gateModel;
use App\Models\FlowModel;
use CodeIgniter\API\ResponseTrait;
use App\Models\RainModel;
use App\Models\FlowHourlyModel;

ini_set('max_execution_time', 600);
class Jobs extends BaseController
{
    protected $rainModel;
    protected $gateModel;
    public function __construct()
    {
        $this->gateModel = new gateModel();
        $this->rainModel = new RainModel();
    }
    public function updateReservoirData()
    {
        $db = \Config\Database::connect();
        $builder = $db->table('reservoir_data');

        // ---------- แหล่งข้อมูล: เขื่อน ----------
        $damUrl = 'https://app.rid.go.th/reservoir/api/dam/public';
        $damResponse = @file_get_contents($damUrl);

        if ($damResponse === false) {
            return $this->response->setStatusCode(ResponseInterface::HTTP_BAD_REQUEST)
                                  ->setJSON(['status' => 'fail', 'message' => 'Dam API request failed']);
        }

        $damData = json_decode($damResponse, true);
        $date = $damData['date'] ?? date('Y-m-d');

        foreach ($damData['data'] as $region) {
            foreach ($region['dam'] as $dam) {
                if ($dam['id'] === '200101') { // เขื่อนแม่งัด
                    $this->upsertReservoir($builder, 'pmp', $date, $dam['volume'], $dam['inflow'], $dam['outflow']);
                }
                if ($dam['id'] === '200102') { // เขื่อนแม่งัด
                    $this->upsertReservoir($builder, 'srk', $date, $dam['volume'], $dam['inflow'], $dam['outflow']);
                }
            }
        }

        // ---------- แหล่งข้อมูล: อ่างเก็บน้ำ ----------
        $resvUrl = 'https://app.rid.go.th/reservoir/api/reservoir/public';
        $resvResponse = @file_get_contents($resvUrl);

        if ($resvResponse === false) {
            return $this->response->setStatusCode(ResponseInterface::HTTP_BAD_REQUEST)
                                  ->setJSON(['status' => 'fail', 'message' => 'Reservoir API request failed']);
        }

        $resvData = json_decode($resvResponse, true);
        $resvDate = $resvData['date'] ?? date('Y-m-d');

        $reservoirMap = [
            // 'rsv389' => 'hkk',
            // 'rsv401' => 'htd',
            // 'rsv403' => 'ht',
            // 'rsv527' => 'hnl'
        ];
        
        if (isset($resvData['data'])) {
            foreach ($resvData['data'] as $region) {
                    foreach ($region['reservoir'] as $resv) {
                    if (isset($reservoirMap[$resv['id']])) {
                        $resCode = $reservoirMap[$resv['id']];
                        $this->upsertReservoir($builder, $resCode, $resvDate, $resv['volume'], $resv['inflow'], $resv['outflow']);
                    }
                }
            }
        }

        return $this->response->setJSON(['status' => 'success', 'message' => 'Updated reservoir data']);
    }

    private function upsertReservoir($builder, $resCode, $date, $volume, $inflow, $outflow)
    {
        $existing = $builder->where('res_code', $resCode)
                            ->where('date', $date)
                            ->get()
                            ->getRowArray();

        if ($existing) {
            $builder->set([
                'volume' => $volume,
                'inflow' => $inflow,
                'outflow' => $outflow
            ])->where('res_code', $resCode)
              ->where('date', $date)
              ->update();
        } else {
            $builder->insert([
                'res_code' => $resCode,
                'date' => $date,
                'volume' => $volume,
                'inflow' => $inflow,
                'outflow' => $outflow
            ]);
        }
    }
    public function updateReservoirFillData($startDate, $endDate)
{
    $db = \Config\Database::connect();
    $builder = $db->table('reservoir_data');

    $period = new \DatePeriod(
        new \DateTime($startDate),
        new \DateInterval('P1D'),
        (new \DateTime($endDate))->modify('+1 day')
    );

    $results = [];

    foreach ($period as $date) {
        $d = $date->format('Y-m-d');

        // ---------- เขื่อนแม่งัด ----------
        $damUrl = "https://app.rid.go.th/reservoir/api/dam/public/{$d}";
        $damResponse = @file_get_contents($damUrl);

        if ($damResponse !== false) {
            $damData = json_decode($damResponse, true);

            if (isset($damData['data'])) {
                foreach ($damData['data'] as $region) {
                    foreach ($region['dam'] as $dam) {
                        if ($dam['id'] === '200101') { 
                            $this->upsertDailyRecord($builder, 'pmp', $d, $dam['volume'], $dam['inflow'], $dam['outflow'], $results);
                        }
                        if ($dam['id'] === '200102') { 
                            $this->upsertDailyRecord($builder, 'srk', $d, $dam['volume'], $dam['inflow'], $dam['outflow'], $results);
                        }
                    }
                }
            } else {
                $results[] = ['date' => $d, 'type' => 'dam', 'status' => 'fail', 'message' => 'Invalid dam API response'];
            }
        } else {
            $results[] = ['date' => $d, 'type' => 'dam', 'status' => 'fail', 'message' => 'API request failed'];
        }

        // ---------- อ่างเก็บน้ำ (rsv389, rsv401) ----------
        $resvUrl = "https://app.rid.go.th/reservoir/api/reservoir/public/{$d}";
        $resvResponse = @file_get_contents($resvUrl);

        if ($resvResponse !== false) {
            $resvData = json_decode($resvResponse, true);

            // แมป id → res_code
            $reservoirMap = [
                // 'rsv403' => 'ht',
                // 'rsv389' => 'hkk',
                // 'rsv401' => 'htd',
                // 'rsv527' => 'hnl'
            ];

            if (isset($resvData['data'])) {
                foreach ($resvData['data'] as $region) {
                        foreach ($region['reservoir'] as $resv) {
                            if (isset($reservoirMap[$resv['id']])) {
                                $resCode = $reservoirMap[$resv['id']];
                                $this->upsertDailyRecord($builder, $resCode, $d, $resv['volume'], $resv['inflow'], $resv['outflow'], $results);
                            }
                        }
                    
                }
            } else {
                $results[] = ['date' => $d, 'type' => 'reservoir', 'status' => 'fail', 'message' => 'Invalid reservoir API response'];
            }
        } else {
            $results[] = ['date' => $d, 'type' => 'reservoir', 'status' => 'fail', 'message' => 'API request failed'];
        }
    }

    return $this->response->setJSON([
        'status' => 'success',
        'message' => "บันทึกข้อมูลอ่างเก็บน้ำย้อนหลังสำเร็จ",
        'details' => $results
    ]);
}

private function upsertDailyRecord($builder, $resCode, $date, $volume, $inflow, $outflow, &$results)
{
    $existing = $builder->where('res_code', $resCode)
                        ->where('date', $date)
                        ->get()
                        ->getRowArray();

    if ($existing) {
        $builder->set([
            'volume' => $volume,
            'inflow' => $inflow,
            'outflow' => $outflow
        ])->where('res_code', $resCode)->where('date', $date)->update();

        $results[] = ['date' => $date, 'res_code' => $resCode, 'status' => 'updated'];
    } else {
        $builder->insert([
            'res_code' => $resCode,
            'date' => $date,
            'volume' => $volume,
            'inflow' => $inflow,
            'outflow' => $outflow
        ]);
        $results[] = ['date' => $date, 'res_code' => $resCode, 'status' => 'inserted'];
    }
}

    public function updateFlowDataHourly()
    {
        $db = \Config\Database::connect();
        $builder = $db->table('flow_hourly');

        $url = "https://hyd-app-db.rid.go.th/webservice/getGroupHourlyWaterLevelReportAllHLWLCriteriaMSL.ashx";

        $headers = [
            "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept: application/json, text/javascript, */*; q=0.01",
            "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With: XMLHttpRequest",
            "Origin: https://hyd-app-db.rid.go.th",
            "Referer: https://hyd-app-db.rid.go.th/hydro2hd_admsl.html"
        ];

        // Map ตามที่คุณกำหนด (index 8-14 ตรงกับสถานีเหล่านี้)
        $stationMap = [
            8  => "Y.4",
            9  => "Y.15",
            10 => "Y.50",
            11 => "Y.16",
            12 => "Y.64",
            13 => "Y.51",
            14 => "Y.17",
        ];

        $endDate   = new \DateTime();
        $startDate = (clone $endDate)->modify('-7 days');

        $period = new \DatePeriod(
            $startDate,
            new \DateInterval('P1D'),
            (clone $endDate)->modify('+1 day')  // +1 เพื่อครอบคลุมวันนี้ + 24.00
        );

        $results = [];
        $totalInserted = 0;
        $totalUpdated  = 0;

        foreach ($period as $date) {
            $originalDate = $date->format('Y-m-d');
            $thaiDate     = $date->format("d/m/") . ($date->format("Y") + 543);

            $payload = http_build_query([
                "DW[UtokID]"       => 2,
                "DW[BasinID]"      => 8,
                "DW[TimeCurrent]"  => $thaiDate,
                "_search"          => "false",
                "nd"               => round(microtime(true) * 1000),
                "rows"             => 100,
                "page"             => 1,
                "sidx"             => "indexhourly",
                "sord"             => "asc"
            ]);

            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST       => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_HTTPHEADER => $headers,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT    => 30,
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            if (!$response) {
                $results[] = ["date" => $originalDate, "status" => "fail", "message" => "API request failed"];
                continue;
            }

            $json = json_decode($response, true);
            if (!isset($json["rows"]) || empty($json["rows"])) {
                $results[] = ["date" => $originalDate, "status" => "no_data", "message" => "No rows in response"];
                continue;
            }

            foreach ($json["rows"] as $row) {
                $hourlyRaw = $row["hourlytime"] ?? null;
                if (!$hourlyRaw) continue;

                $recordDate = $originalDate;
                $hourly     = str_replace('.', ':', trim($hourlyRaw));

                // จัดการ 24.00 → 00:00 ของวันถัดไป
                if ($hourly === "24:00" || $hourly === "24.00") {
                    $hourly = "00:00";
                    $recordDate = date('Y-m-d', strtotime($originalDate . ' +1 day'));
                } else {
                    $hourly = sprintf("%05s", $hourly); // เติม 0 ให้เป็น 01:00, 02:00, ...
                }

                $datetime = $recordDate . " " . $hourly . ":00";

                // ตรวจ datetime ถูกต้อง
                $dtCheck = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
                if (!$dtCheck || $dtCheck->format('Y-m-d H:i:s') !== $datetime) {
                    continue;
                }

                // วนตาม stationMap ของคุณ (index 8-14)
                foreach ($stationMap as $index => $staCode) {
                    $wlKey = "wlvalues" . $index;
                    $wl    = $row[$wlKey] ?? null;

                    // ข้ามถ้าไม่ใช่ตัวเลข หรือเป็น * หรือว่าง
                    if ($wl === null || $wl === '' || $wl === '*' || !is_numeric($wl)) {
                        continue;
                    }

                    $wl = floatval($wl);

                    // ตรวจว่ามี record อยู่แล้วหรือไม่
                    $existing = $builder->where([
                        'sta_code' => $staCode,
                        'datetime' => $datetime
                    ])->get()->getRowArray();

                    if ($existing) {
                        // Update ถ้ามีแล้ว
                        $builder->where([
                            'sta_code' => $staCode,
                            'datetime' => $datetime
                        ])->set(['wl' => $wl])->update();
                        $totalUpdated++;
                    } else {
                        // Insert ใหม่
                        $builder->insert([
                            'sta_code'   => $staCode,
                            'datetime'   => $datetime,
                            'wl'         => $wl,
                            'discharge'  => null,  // ถ้าต้องการ qvalues{$index} ค่อยเพิ่ม
                        ]);
                        $totalInserted++;
                    }
                }
            }
        }

        return $this->response->setJSON([
            "status"         => "success",
            "message"        => "อัปเดตข้อมูลรายชั่วโมงย้อนหลัง 7 วัน + วันนี้สำเร็จ (index 8-14 ตาม map)",
            "inserted"       => $totalInserted,
            "updated"        => $totalUpdated,
            "total"          => $totalInserted + $totalUpdated,
            "details"        => $results  // สำหรับ debug ถ้าต้องการ
        ]);
    }


use ResponseTrait;
public function updateFlowData()
{
    helper('date');

    $apiUrl = 'https://hyd-app-db.rid.go.th/webservice/getDailyWaterLevelListReportMSL.ashx?option=2';
    $utokIds = [2]; // Example: An array of different 'DW[UtokID]' values [2, 7, 5] for different station groups
    $allStationsAllowed = ['Y.4', 'Y.15', 'Y.50', 'Y.16', 'Y.64','Y.51','Y.17',]; // All stations from all APIs
    $today = date('Y-m-d');
    $insertData = [];

    foreach ($utokIds as $utokId) {
        $postData = [
            'option' => 2,
            'DW[UtokID]' => $utokId,
            'DW[TimeCurrent]' => date('d/m') . '/' . (date('Y') + 543),
            '_search' => 'false',
            'nd' => round(microtime(true) * 1000),
            'rows' => 1000,
            'page' => 1,
            'sidx' => 'indexcount',
            'sord' => 'asc',
        ];

        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($response === false || $httpCode !== 200) {
                // Log or handle the error for this specific API call, but continue with the next one
                log_message('error', "API call with UtokID={$utokId} failed: HTTP Code {$httpCode}");
                continue;
            }

            $json = json_decode($response, true);
            if (!$json || !isset($json['rows'])) {
                log_message('error', "API response for UtokID={$utokId} is invalid.");
                continue;
            }

            foreach ($json['rows'] as $row) {
                if (!in_array($row['stationcode'], $allStationsAllowed)) {
                    continue;
                }

                $q1 = explode('|', $row['waterlevelvalueQ1']);
                $wl = (isset($q1[0]) && floatval($q1[0]) != 0) ? floatval($q1[0]) : null;
                $discharge = (isset($q1[1]) && floatval($q1[1]) != 0) ? floatval($q1[1]) : null;

                $insertData[] = [
                    'sta_code' => $row['stationcode'],
                    'date' => $today,
                    'wl' => $wl,
                    'discharge' => $discharge,
                ];
            }
        } catch (\Exception $e) {
            log_message('error', "Exception during API call with UtokID={$utokId}: " . $e->getMessage());
            continue;
        }
    }

    if (empty($insertData)) {
        return $this->fail('ไม่พบข้อมูลสถานีที่กำหนดจากทุก API');
    }

    $model = new FlowModel();

    // Begin a transaction for atomic operations on the database
    $model->transBegin();

    try {
        // Delete existing data for today for all relevant stations
        $model->whereIn('sta_code', $allStationsAllowed)
              ->where('date', $today)
              ->delete();

        // Batch insert all the collected data at once for better performance
        $model->insertBatch($insertData);

        if ($model->transStatus() === false) {
            $model->transRollback();
            return $this->fail('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } else {
            $model->transCommit();
            return $this->respond([
                'status' => 'success',
                'message' => 'บันทึกข้อมูลสำเร็จ',
                'count' => count($insertData),
                'date' => $today
            ]);
        }
    } catch (\Exception $e) {
        $model->transRollback();
        return $this->fail('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage());
    }
}

    public function updateFlowFillData($startDate, $endDate)
    {
        helper(['date', 'text']);

        $model = new FlowModel();
        // เพิ่ม C.30 เข้าในรายชื่อสถานี
        $stationsAllowed = ['Y.4', 'Y.15', 'Y.50', 'Y.16', 'Y.64','Y.51','Y.17'];
        // กำหนด UtokID ของแต่ละกลุ่ม
        $utokIds = [2]; 

        $start = strtotime($startDate);
        $end = strtotime($endDate);

        if ($start > $end) {
            return $this->respond([
                'status' => 'fail',
                'message' => 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
            ]);
        }

        $insertedCount = 0;

        for ($date = $start; $date <= $end; $date += 86400) {
            $day = date('d/m', $date);
            $yearBuddhist = date('Y', $date) + 543;
            $thaiDate = $day . '/' . $yearBuddhist;
            $today = date('Y-m-d', $date);

            foreach ($utokIds as $utokId) {
                $apiUrl = 'https://hyd-app-db.rid.go.th/webservice/getDailyWaterLevelListReportMSL.ashx?option=2';
                $postData = [
                    'option' => 2,
                    'DW[UtokID]' => $utokId,
                    'DW[TimeCurrent]' => $thaiDate,
                    '_search' => 'false',
                    'nd' => round(microtime(true) * 1000),
                    'rows' => 1000,
                    'page' => 1,
                    'sidx' => 'indexcount',
                    'sord' => 'asc',
                ];

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $apiUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $response = curl_exec($ch);
                curl_close($ch);

                if (!$response) {
                    log_message('error', "API call failed for UtokID={$utokId}, Date={$today}");
                    continue;
                }

                $json = json_decode($response, true);
                if (!$json || !isset($json['rows'])) {
                    log_message('error', "Invalid response for UtokID={$utokId}, Date={$today}");
                    continue;
                }

                foreach ($json['rows'] as $row) {
                    if (!in_array($row['stationcode'], $stationsAllowed)) {
                        continue;
                    }

                    $q1 = explode('|', $row['waterlevelvalueQ1']);
                    $wl = (isset($q1[0]) && floatval($q1[0]) != 0) ? floatval($q1[0]) : null;
                    $discharge = (isset($q1[1]) && floatval($q1[1]) != 0) ? floatval($q1[1]) : null;

                    $data = [
                        'sta_code' => $row['stationcode'],
                        'date' => $today,
                        'wl' => $wl,
                        'discharge' => $discharge,
                    ];

                    $model->upsert($data);
                    $insertedCount++;
                }
            }
        }

        return $this->respond([
            'status' => 'success',
            'message' => 'บันทึกข้อมูลน้ำท่าย้อนหลังสำเร็จ',
            'count' => $insertedCount,
            'from' => $startDate,
            'to' => $endDate
        ]);
    }

    private $stationMapping = [
        'LKBU' => '120142', 
        'YOM008' => '390022', 
        'YOM007' => '590042', 
        'KRMT' => '590082',
    ];

    /**
     * ดึงข้อมูลฝนจาก API และบันทึกลงในฐานข้อมูล
     *
     * @param string $startDate วันที่เริ่มต้นในรูปแบบ YYYY-MM-DD
     * @param string $endDate วันที่สิ้นสุดในรูปแบบ YYYY-MM-DD
     * @return ResponseInterface
     */
    public function updateRainData()
        {
            helper('date');

            // Step 1: ดึงข้อมูลจาก API ที่ 1
            $dataFromApi1 = $this->fetchDataFromApi1();
            if ($dataFromApi1 === null) {
                return $this->fail('API ไม่สามารถเรียกได้ หรือข้อมูลไม่ถูกต้อง', 500);
            }

            // Step 2: ดึงข้อมูลจาก API ที่ 2
            $dataFromApi2 = $this->fetchDataFromApi2();
            if ($dataFromApi2 === null) {
                return $this->fail('ไม่สามารถเชื่อมต่อกับ API ได้ หรือข้อมูลไม่ถูกต้อง', 500);
            }

            // รวมและประมวลผลข้อมูล
            $combinedData = $this->processAndCombineData($dataFromApi1, $dataFromApi2);
            
            if (empty($combinedData)) {
                return $this->fail('ไม่พบข้อมูลที่ต้องการบันทึก', 404);
            }

            $totalSaved = 0;
            $totalUpdated = 0;

            // เริ่ม Transaction เพื่อความปลอดภัยของข้อมูล
            $this->rainModel->db->transStart();

            foreach ($combinedData as $data) {
                    // ค้นหาข้อมูลที่มี sta_code และ date ที่ตรงกัน
                    $existingRecord = $this->rainModel
                                            ->where('sta_code', $data['sta_code'])
                                            ->where('date', $data['date'])
                                            ->first();

                    if ($existingRecord) {
                        // ถ้าข้อมูลมีอยู่แล้ว ให้อัปเดต
                        $this->rainModel
                            ->where('sta_code', $data['sta_code'])
                            ->where('date', $data['date'])
                            ->update(null, $data); // ใช้ update() โดยตรง
                        $totalUpdated++;
                    } else {
                        // ถ้าข้อมูลยังไม่มี ให้เพิ่มข้อมูลใหม่
                        $this->rainModel->insert($data); // ใช้ insert() โดยตรง
                        $totalSaved++;
                    }

            }
            
            // สิ้นสุด Transaction
            $this->rainModel->db->transComplete();

            $message = "บันทึกข้อมูลใหม่แล้ว {$totalSaved} รายการ, อัปเดตข้อมูลแล้ว {$totalUpdated} รายการ";
            log_message('info', $message);
            return $this->respondCreated(['status' => 'success', 'message' => $message]);
        }
        private function fetchDataFromApi1()
        {
            $utokIds = [2];
            $filteredData = [];
            $stationsAllowed = [
                '120161', '380012', '390220'
            ];

            // กำหนดวันที่เมื่อวาน (ใช้เก็บในฐานข้อมูล)
            $yesterday = date('Y-m-d', strtotime('-1 day'));

            // วันที่วันนี้ (ใช้ส่งไปยัง API)
            $todayThai = date('d/m') . '/' . (date('Y') + 543);

            foreach ($utokIds as $utokId) {
                $apiUrl = 'http://hyd-app-db.rid.go.th/webservice/getDailyRainfallListReport.ashx?option=2';
                $postData = [
                    'option' => 2,
                    'DW[UtokID]' => $utokId,
                    'DW[TimeCurrent]' => $todayThai,
                    '_search' => 'false',
                    'nd' => round(microtime(true) * 1000),
                    'rows' => 1000,
                    'page' => 1,
                    'sidx' => 'indexcount',
                    'sord' => 'asc',
                ];

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $apiUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $response = curl_exec($ch);
                curl_close($ch);

                $json = json_decode($response, true);

                if (!$json || !isset($json['rows'])) {
                    continue;
                }

                foreach ($json['rows'] as $row) {
                    if (in_array($row['stationcode'], $stationsAllowed)) {
                        $filteredData[] = [
                            'sta_code' => $row['stationcode'],
                            'date' => $yesterday,
                            'rain_mm' => isset($row['RF1']) ? floatval($row['RF1']) : 0
                        ];
                    }
                }
            }

            return $filteredData;
        }


        /**
         * Fetches data from the second API.
         *
         * @return array|null
         */
        private function fetchDataFromApi2()
        {
            $apiUrl2 = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/thailand_main_rain';

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $apiUrl2);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || $response === false) {
                log_message('error', 'Failed to fetch data from API. HTTP Code: ' . $httpCode);
                return null;
            }

            $apiData = json_decode($response, true);
            
            if (json_last_error() !== JSON_ERROR_NONE || !isset($apiData['data']) || !is_array($apiData['data'])) {
                log_message('error', 'Invalid JSON response from API.');
                return null;
            }

             $filteredData = [];
            foreach ($apiData['data'] as $record) {
                $api_sta_code = $record['station']['tele_station_oldcode'] ?? null;
                
                // ตรวจสอบว่ามีข้อมูล sta_code และอยู่ใน stationMapping
                if ($api_sta_code && array_key_exists($api_sta_code, $this->stationMapping)) {
                    $dateTimeObj = new DateTime($record['rainfall_datetime']);
                    
                    // ⭐️ การแก้ไข: ลบ 1 วันออกจากเวลาที่ได้จาก API
                    $dateTimeObj->sub(new DateInterval('P1D')); 
                    
                    $formattedDate = $dateTimeObj->format('Y-m-d');
                    
                    $filteredData[$api_sta_code] = [
                        'sta_code' => $this->stationMapping[$api_sta_code],
                        'date' => $formattedDate,
                        'rain_mm' => $record['rain_24h'] ?? null
                    ];
                }
            }

            return $filteredData;
        }

        /**
         * Combines data from both APIs into a single array, with API2 overriding API1.
         *
         * @param array $data1
         * @param array $data2
         * @return array
         */
        private function processAndCombineData(array $data1, array $data2)
        {
            return array_merge($data1, $data2);
        }

    public function updateRainFillData($startDate, $endDate)
    {
        helper('date');

        $model = new \App\Models\RainModel();

        // รหัสสถานีจาก RID (กรมชลฯ)
        $stationsRID = ['120161', '380012', '390220'];
        $utokIds = [2];

        $stationsThaiwater = ['664', '622', '645', '642'];
        $thaiwaterMapping = [
            '622' => '120142', 
            '664' => '390022', 
            '645' => '590042', 
            '642' => '590082', 
        ];

        $start = strtotime($startDate);
        $end = strtotime($endDate);

        if ($start > $end) {
            return $this->response->setJSON([
                'status' => 'fail',
                'message' => 'วันที่เริ่มต้องน้อยกว่าวันสิ้นสุด'
            ]);
        }

        $totalInserted = 0;

        for ($current = $start; $current <= $end; $current += 86400) {
            $date = date('Y-m-d', $current);
            $thaiDate = date('d/m', $current) . '/' . (date('Y', $current) + 543); // ex: 04/06/2568
            $dateRecord = date('Y-m-d', strtotime('-1 day', $current)); // วันที่ฝนจริง = เมื่อวาน
            // วน loop สำหรับแต่ละ utokId
            foreach ($utokIds as $utokId) {
                $apiUrl = 'http://hyd-app-db.rid.go.th/webservice/getDailyRainfallListReport.ashx?option=2';
                $postData = [
                    'option' => 2,
                    'DW[UtokID]' => $utokId, // ใช้ค่า utokId จาก loop
                    'DW[TimeCurrent]' => $thaiDate,
                    '_search' => 'false',
                    'nd' => round(microtime(true) * 1000),
                    'rows' => 1000,
                    'page' => 1,
                    'sidx' => 'indexcount',
                    'sord' => 'asc',
                ];

                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $apiUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $response = curl_exec($ch);
                curl_close($ch);

                if (!$response) {
                    continue;
                }

                $json = json_decode($response, true);
                if (!$json || !isset($json['rows'])) {
                    continue;
                }

                // โค้ดที่แก้ไขแล้ว
                    foreach ($json['rows'] as $row) {
                        // แก้ไข 'stationCode' เป็น 'stationcode'
                        if (!isset($row['stationcode']) || !in_array($row['stationcode'], $stationsRID)) {
                            continue;
                        }

                        $rain_mm = isset($row['RF1']) ? floatval($row['RF1']) : 0;
                        // แก้ไข 'stationCode' เป็น 'stationcode'
                        $sta_code = $row['stationcode']; 

                        $data = [
                            'sta_code' => $sta_code,
                            'date' => $dateRecord,
                            'rain_mm' => $rain_mm
                        ];

                        $model->upsert($data);
                        $totalInserted++;
                }
            }
        }

        /*
        ===============================
        2️⃣ ดึงข้อมูลจาก Thaiwater (รายเดือน)
        ===============================
        */
        foreach ($stationsThaiwater as $stationCode) {
            $mappedCode = $thaiwaterMapping[$stationCode] ?? $stationCode;

            // แปลงวันที่เริ่ม-สิ้นสุด เป็นเดือน/ปี
            $startMonth = (int)date('m', $start);
            $endMonth = (int)date('m', $end);
            $startYear = (int)date('Y', $start);
            $endYear = (int)date('Y', $end);

            for ($year = $startYear; $year <= $endYear; $year++) {
                $monthStart = ($year == $startYear) ? $startMonth : 1;
                $monthEnd = ($year == $endYear) ? $endMonth : 12;

                for ($month = $monthStart; $month <= $monthEnd; $month++) {
                    $apiUrlThaiwater = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_monthly_graph?station_id={$stationCode}&month={$month}&year={$year}";

                    $ch2 = curl_init();
                    curl_setopt($ch2, CURLOPT_URL, $apiUrlThaiwater);
                    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
                    curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
                    $response2 = curl_exec($ch2);
                    curl_close($ch2);

                    if (!$response2) continue;
                    

                    $json2 = json_decode($response2, true);
                    if (!$json2 || !isset($json2['data'])) continue;

                    foreach ($json2['data'] as $dayData) {
                        $date = $dayData['rainfall_datetime'] ?? null;
                        $rain_mm = $dayData['rainfall_value'];

                        if (!$date || $rain_mm === null) continue;
                        $dateTs = strtotime($date);
                        if ($dateTs < $start || $dateTs > $end) continue;

                        $data = [
                            'sta_code' => $mappedCode,
                            'date' => $date,
                            'rain_mm' => floatval($rain_mm)
                        ];

                        $model->upsert($data);
                        $totalInserted++;
                    }
                }
            }
        }

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'อัปเดตข้อมูลฝนย้อนหลังสำเร็จ (RID + Thaiwater)',
            'total_records' => $totalInserted,
        ]);
    }
    public function updateGateData()
    {
        $stationList = ['tng', 'wst', 'kpk'];
        $currentDate = date('Y-m-d');

        $recordsAdded = 0;
        $recordsUpdated = 0;

        // ✅ ดึงข้อมูลจาก API
        $allGateData = $this->fetchRidGateData($stationList, $currentDate);

        if (empty($allGateData)) {
            return $this->fail('ไม่พบข้อมูลจาก API');
        }

        $this->gateModel->db->transStart();

        foreach ($allGateData as $data) {

            log_message('info', json_encode($data));

            $existingRecord = $this->gateModel
                ->where([
                    'sta_code' => $data['sta_code'],
                    'date' => $data['date']
                ])
                ->first();

            if ($existingRecord) {
                $this->gateModel
                    ->where([
                        'sta_code' => $data['sta_code'],
                        'date' => $data['date']
                    ])
                    ->set($data)
                    ->update();

                $recordsUpdated++;
            } else {
                $this->gateModel->insert($data);
                $recordsAdded++;
            }
        }

        $this->gateModel->db->transComplete();

        return $this->respond([
            'status' => 'success',
            'records_added' => $recordsAdded,
            'records_updated' => $recordsUpdated,
            'data' => $allGateData
        ]);
    }

    private function fetchRidGateData(array $stationList, string $date)
    {
        $client = \Config\Services::curlrequest();
        $result = [];

       $stationMap = [
            'tng' => [
                'code' => 'RID3-01',
                'base_url' => 'https://rid3a.itthirit.io'
            ],
            'wst' => [
                'code' => 'RID3-03',
                'base_url' => 'https://rid3b.itthirit.io'
            ],
        ];

        foreach ($stationList as $sta) {

            if (!isset($stationMap[$sta])) continue;
            $code = $stationMap[$sta]['code'];
            $baseUrl = $stationMap[$sta]['base_url'];

            $url = "{$baseUrl}/api/rid/water-data?code={$code}&startDate={$date}&endDate={$date}";

            try {
                $response = $client->get($url);
                $data = json_decode($response->getBody(), true);

                if (!$data) continue;

                // 🔹 เอาค่าล่าสุดของวัน
                $last = end($data);

                if (!$last) continue;

                $result[] = [
                    'sta_code' => $sta,
                    'date' => substr($last['datetime'], 0, 10),
                    'wl_upper' => $last['upper_water'] ?? null,
                    'wl_lower' => $last['lower_water'] ?? null,
                    'discharge' => $last['flow'] ?? null,
                ];

            } catch (\Exception $e) {
                log_message('error', 'Fetch RID error: ' . $e->getMessage());
            }
        }

        return $result;
    }
    public function updateGateFillData(string $startDate, string $endDate)
    {
        $stationList = ['tng', 'wst'];
        $recordsAdded = 0;
        $recordsUpdated = 0;

        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);
        $end->modify('+1 day'); // ให้รวมวันสุดท้ายด้วย

        $this->gateModel->db->transStart();

        for ($date = $start; $date < $end; $date->modify('+1 day')) {

            $currentDate = $date->format('Y-m-d');
            log_message('info', "Processing date: {$currentDate}");

            // 🔹 ดึงข้อมูลของวันนั้น
            $allGateData = $this->fetchRidGateData($stationList, $currentDate);

            if (empty($allGateData)) {
                log_message('warning', "No data for {$currentDate}");
                continue;
            }

            foreach ($allGateData as $data) {

                $existingRecord = $this->gateModel
                    ->where([
                        'sta_code' => $data['sta_code'],
                        'date' => $data['date']
                    ])
                    ->first();

                if ($existingRecord) {
                    $this->gateModel
                        ->where([
                            'sta_code' => $data['sta_code'],
                            'date' => $data['date']
                        ])
                        ->set($data)
                        ->update();

                    $recordsUpdated++;
                } else {
                    $this->gateModel->insert($data);
                    $recordsAdded++;
                }
            }
        }

        $this->gateModel->db->transComplete();

        return $this->respond([
            'status' => 'success',
            'message' => 'Backfill completed',
            'records_added' => $recordsAdded,
            'records_updated' => $recordsUpdated,
            'range' => [$startDate, $endDate]
        ]);
    }

     /**
     * ดึงข้อมูลระดับน้ำรายชั่วโมงจาก RID ตามช่วงวันที่ที่กำหนด
     * เหมือน updateFlowFillData() แต่สำหรับรายชั่วโมง
     */
    public function updateFlowHourlyFillData($startDate, $endDate)
    {
        $db      = \Config\Database::connect();
        $builder = $db->table('flow_hourly');

        $stationMap = [
            8  => "Y.4",
            9  => "Y.15",
            10 => "Y.50",
            11 => "Y.16",
            12 => "Y.64",
            13 => "Y.51",
            14 => "Y.17",
        ];

        $url      = "https://hyd-app-db.rid.go.th/webservice/getGroupHourlyWaterLevelReportAllHLWLCriteriaMSL.ashx";
        $mainPage = "https://hyd-app-db.rid.go.th/hydro2hd_admsl.html";

        // Cookie file
        $cookieFile = WRITEPATH . 'cache/rid_hourly_cookie.txt';
        if (!is_dir(WRITEPATH . 'cache')) {
            mkdir(WRITEPATH . 'cache', 0755, true);
        }

        $start = new \DateTime($startDate);
        $end   = new \DateTime($endDate);
        $end->modify('+1 day');

        if ($start >= $end) {
            return $this->respond(['status' => 'fail', 'message' => 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด']);
        }

        $totalInserted = 0;
        $totalUpdated  = 0;

        // 1. เข้าหน้าเว็บก่อนเพื่อรับ Cookie (ถ้าจำเป็น)
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $mainPage,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEJAR      => $cookieFile,
            CURLOPT_COOKIEFILE     => $cookieFile,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_USERAGENT      => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        curl_exec($ch);
        curl_close($ch);

        $period = new \DatePeriod($start, new \DateInterval('P1D'), $end);

        foreach ($period as $date) {
            $originalDate  = $date->format('Y-m-d');
            $thaiDate      = $date->format('d/m/') . ($date->format('Y') + 543);

            $payload = http_build_query([
                "DW[UtokID]"      => 2,
                "DW[BasinID]"     => 8,
                "DW[TimeCurrent]" => $thaiDate,
                "_search"         => "false",
                "nd"              => round(microtime(true) * 1000),
                "rows"            => 100,
                "page"            => 1,
                "sidx"            => "indexhourly",
                "sord"            => "asc"
            ]);

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL            => $url,
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => 30,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_COOKIEJAR      => $cookieFile,
                CURLOPT_COOKIEFILE     => $cookieFile,
                CURLOPT_USERAGENT      => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                CURLOPT_HTTPHEADER     => [
                    "Accept: application/json, text/javascript, */*; q=0.01",
                    "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With: XMLHttpRequest",
                    "Origin: https://hyd-app-db.rid.go.th",
                    "Referer: https://hyd-app-db.rid.go.th/hydro2hd_admsl.html",  // ปรับ Referer ให้ตรงกับหน้าเดิม
                ],
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if (!$response || $httpCode !== 200) {
                log_message('error', "Hourly API failed for {$originalDate} | HTTP: {$httpCode}");
                continue;
            }

            $json = json_decode($response, true);
            if (!$json || !isset($json['rows']) || empty($json['rows'])) {
                log_message('info', "ไม่มีข้อมูลรายชั่วโมงสำหรับวันที่: {$originalDate}");
                continue;
            }

            foreach ($json['rows'] as $row) {
                $hourlyRaw = $row['hourlytime'] ?? null;
                if (!$hourlyRaw || strlen(trim($hourlyRaw)) < 3) continue;

                $recordDate = $originalDate;
                $hourly     = str_replace('.', ':', trim($hourlyRaw));

                if ($hourly === "24:00" || $hourly === "24.00") {
                    $hourly = "00:00";
                    $recordDate = date('Y-m-d', strtotime($originalDate . ' +1 day'));
                } else {
                    $hourly = sprintf("%05s", $hourly);
                }

                $datetimeStr = $recordDate . " " . $hourly . ":00";

                $dtCheck = \DateTime::createFromFormat('Y-m-d H:i:s', $datetimeStr);
                if (!$dtCheck || $dtCheck->format('Y-m-d H:i:s') !== $datetimeStr) {
                    log_message('error', "Invalid datetime: {$datetimeStr} (from {$hourlyRaw})");
                    continue;
                }

                // วนตาม index ใน stationMap (8-14)
                foreach ($stationMap as $index => $staCode) {
                    $wlKey   = "wlvalues{$index}";
                    $wlRaw   = $row[$wlKey] ?? null;

                    // ข้ามถ้า null, ว่าง, ไม่ใช่ตัวเลข, หรือเป็น "*"
                    if ($wlRaw === null || $wlRaw === '' || $wlRaw === '*' || !is_numeric($wlRaw)) {
                        continue;
                    }

                    $wl = floatval($wlRaw);

                    $existing = $builder->where([
                        'sta_code' => $staCode,
                        'datetime' => $datetimeStr
                    ])->get()->getRowArray();

                    if ($existing) {
                        $builder->where([
                            'sta_code' => $staCode,
                            'datetime' => $datetimeStr
                        ])->set(['wl' => $wl])->update();
                        $totalUpdated++;
                    } else {
                        $builder->insert([
                            'sta_code'   => $staCode,
                            'datetime'   => $datetimeStr,
                            'wl'         => $wl,
                            'discharge'  => null
                        ]);
                        $totalInserted++;
                    }
                }
            }
        }

        // ลบ cookie หลังใช้เสร็จ
        if (file_exists($cookieFile)) {
            @unlink($cookieFile);
        }

        return $this->respond([
            'status'        => 'success',
            'message'       => 'อัปเดตข้อมูลรายชั่วโมงสำเร็จ (ใช้ index 8-14 ตาม map ล่าสุด)',
            'from'          => $startDate,
            'to'            => $endDate,
            'inserted'      => $totalInserted,
            'updated'       => $totalUpdated,
            'total_records' => $totalInserted + $totalUpdated
        ]);
    }


}
