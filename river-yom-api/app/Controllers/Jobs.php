<?php

namespace App\Controllers;
use DateTime;
use DateInterval;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\gateModel;
use App\Models\gateOpen;
use App\Models\FlowModel;
use CodeIgniter\API\ResponseTrait;
use App\Models\RainModel;
use App\Models\FlowHourlyModel;

ini_set('max_execution_time', 600);
class Jobs extends BaseController
{
    protected $rainModel;
    protected $gateModel;
    protected $gateOpen;
    public function __construct()
    {
        $this->gateModel = new gateModel();
        $this->gateOpen = new gateOpen();
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
        $date = ($damData['datetime'] ?? date('Y-m-d')) . ' 07:00:00';

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
        $resvDate = $resvData['datetime'] ?? date('Y-m-d') . ' 07:00:00';

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
                            ->where('datetime', $date)
                            ->get()
                            ->getRowArray();

        if ($existing) {
            $builder->set([
                'volume' => $volume,
                'inflow' => $inflow,
                'outflow' => $outflow
            ])->where('res_code', $resCode)
              ->where('datetime', $date)
              ->update();
        } else {
            $builder->insert([
                'res_code' => $resCode,
                'datetime' => $date,
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
        $datetime = $d . ' 07:00:00';

        // ---------- เขื่อนแม่งัด ----------
        $damUrl = "https://app.rid.go.th/reservoir/api/dam/public/{$d}";
        $damResponse = @file_get_contents($damUrl);

        if ($damResponse !== false) {
            $damData = json_decode($damResponse, true);

            if (isset($damData['data'])) {
                foreach ($damData['data'] as $region) {
                    foreach ($region['dam'] as $dam) {
                        if ($dam['id'] === '200101') { 
                            $this->upsertDailyRecord($builder, 'pmp', $datetime, $dam['volume'], $dam['inflow'], $dam['outflow'], $results);
                        }
                        if ($dam['id'] === '200102') { 
                            $this->upsertDailyRecord($builder, 'srk', $datetime, $dam['volume'], $dam['inflow'], $dam['outflow'], $results);
                        }
                    }
                }
            } else {
                $results[] = ['datetime' => $datetime, 'type' => 'dam', 'status' => 'fail', 'message' => 'Invalid dam API response'];
            }
        } else {
            $results[] = ['datetime' => $datetime, 'type' => 'dam', 'status' => 'fail', 'message' => 'API request failed'];
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
                $results[] = ['datetime' => $d, 'type' => 'reservoir', 'status' => 'fail', 'message' => 'Invalid reservoir API response'];
            }
        } else {
            $results[] = ['datetime' => $d, 'type' => 'reservoir', 'status' => 'fail', 'message' => 'API request failed'];
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
                        ->where('datetime', $date)
                        ->get()
                        ->getRowArray();

    if ($existing) {
        $builder->set([
            'volume' => $volume,
            'inflow' => $inflow,
            'outflow' => $outflow
        ])->where('res_code', $resCode)->where('datetime', $date)->update();

        $results[] = ['datetime' => $date, 'res_code' => $resCode, 'status' => 'updated'];
    } else {
        $builder->insert([
            'res_code' => $resCode,
            'datetime' => $date,
            'volume' => $volume,
            'inflow' => $inflow,
            'outflow' => $outflow
        ]);
        $results[] = ['datetime' => $date, 'res_code' => $resCode, 'status' => 'inserted'];
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
        $db = \Config\Database::connect();
        $builder = $db->table('flow_data');

        $url = "https://hyd-app-db.rid.go.th/webservice/getGroupHourlyWaterLevelReportAllHLWLCriteriaMSL.ashx";

        $headers = [
            "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept: application/json, text/javascript, */*; q=0.01",
            "Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With: XMLHttpRequest",
            "Origin: https://hyd-app-db.rid.go.th",
            "Referer: https://hyd-app-db.rid.go.th/hydro2hd_admsl.html"
        ];

        $basinConfigs = [
            8 => [
                10  => "Y.3A",
                12  => "Y.4",
                13  => "Y.15",
                14 => "Y.50",
                15 => "Y.16",
                16 => "Y.64",
                17 => "Y.51",
                18 => "Y.17",
                19 => "Y.52",
            ],
            9 => [
                2 => "N.84",
                5 => "N.2B",
                6 => "N.60",
                7 => "N.27A",
                12 => "N.5A",
                14 => "N.24A",
                16 => "N.7A",
                17 => "N.43A",
                19 => "N.8B",
                20 => "N.67",
            ],
        ];

        $now    = new \DateTime();
        $cutoff = (clone $now)->modify('-24 hours');

        $datesToFetch = [
            (clone $now)->modify('-1 day'),
            clone $now,
        ];

        $totalInserted = 0;
        $totalUpdated  = 0;
        $results = [];

        // ✅ วนทุก Basin
        foreach ($basinConfigs as $basinId => $stationMap) {

            foreach ($datesToFetch as $date) {
                $originalDate = $date->format('Y-m-d');
                $thaiDate     = $date->format("d/m/") . ($date->format("Y") + 543);

                $payload = http_build_query([
                    "DW[UtokID]"       => 2,
                    "DW[BasinID]"      => $basinId, // ✅ ใช้ตัวแปรแทน hardcode
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
                    $results[] = ["basin" => $basinId, "date" => $originalDate, "status" => "fail", "message" => "API request failed"];
                    continue;
                }

                $json = json_decode($response, true);
                if (!isset($json["rows"]) || empty($json["rows"])) {
                    $results[] = ["basin" => $basinId, "date" => $originalDate, "status" => "no_data", "message" => "No rows in response"];
                    continue;
                }

                foreach ($json["rows"] as $row) {
                    $hourlyRaw = $row["hourlytime"] ?? null;
                    if (!$hourlyRaw) continue;

                    $recordDate = $originalDate;
                    $hourly     = str_replace('.', ':', trim($hourlyRaw));

                    if ($hourly === "24:00" || $hourly === "24.00") {
                        $hourly = "00:00";
                        $recordDate = date('Y-m-d', strtotime($originalDate . ' +1 day'));
                    } else {
                        $hourly = sprintf("%05s", $hourly);
                    }

                    $datetime = $recordDate . " " . $hourly . ":00";

                    $dtCheck = \DateTime::createFromFormat('Y-m-d H:i:s', $datetime);
                    if (!$dtCheck || $dtCheck->format('Y-m-d H:i:s') !== $datetime) {
                        continue;
                    }

                    if ($dtCheck < $cutoff || $dtCheck > $now) {
                        continue;
                    }

                    // ✅ ใช้ stationMap ของ basin นี้โดยเฉพาะ
                    foreach ($stationMap as $index => $staCode) {
                        $wlKey = "wlvalues" . $index;
                        $qKey  = "qvalues" . $index;
                        $wl    = $row[$wlKey] ?? null;
                        $q     = $row[$qKey] ?? null;

                        if ($wl === null || $wl === '' || $wl === '*' || !is_numeric($wl)) {
                            continue;
                        }

                        $wl = floatval($wl);
                        $discharge = (is_numeric($q) && $q !== '*') ? floatval($q) : null;

                        $existing = $builder->where([
                            'sta_code' => $staCode,
                            'datetime' => $datetime
                        ])->get()->getRowArray();

                        if ($existing) {
                            $builder->where([
                                'sta_code' => $staCode,
                                'datetime' => $datetime
                            ])->set([
                                'wl' => $wl,
                                'discharge' => $discharge
                            ])->update();
                            $totalUpdated++;
                        } else {
                            $builder->insert([
                                'sta_code'  => $staCode,
                                'datetime'  => $datetime,
                                'wl'        => $wl,
                                'discharge' => $discharge,
                            ]);
                            $totalInserted++;
                        }
                    }
                }
            }
        }

        return $this->response->setJSON([
            "status"    => "success",
            "message"   => "อัปเดตข้อมูล flow รายชั่วโมงย้อนหลัง 24 ชม. สำเร็จ (หลาย Basin)",
            "inserted"  => $totalInserted,
            "updated"   => $totalUpdated,
            "total"     => $totalInserted + $totalUpdated,
            "details"   => $results
        ]);
    }

    public function updateFlowFillData($startDate, $endDate)
    {
        $db      = \Config\Database::connect();
        $builder = $db->table('flow_data');

        $basinConfigs = [
            8 => [
                10 => "Y.3A",
                12 => "Y.4",
                13 => "Y.15",
                14 => "Y.50",
                15 => "Y.16",
                16 => "Y.64",
                17 => "Y.51",
                18 => "Y.17",
                19 => "Y.52",
            ],
            9 => [
                2  => "N.84",
                5  => "N.2B",
                6  => "N.60",
                7  => "N.27A",
                12 => "N.5A",
                14 => "N.24A",
                16 => "N.7A",
                17 => "N.43A",
                19 => "N.8B",
                20 => "N.67",
            ],
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
        $results = [];

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

        // ✅ วนทุก Basin ก่อน แล้วค่อยวนแต่ละวันในนั้น (เหมือน updateFlowData)
        foreach ($basinConfigs as $basinId => $stationMap) {

            foreach ($period as $date) {
                $originalDate  = $date->format('Y-m-d');
                $thaiDate      = $date->format('d/m/') . ($date->format('Y') + 543);

                $payload = http_build_query([
                    "DW[UtokID]"      => 2,
                    "DW[BasinID]"     => $basinId, // ✅ ใช้ตัวแปรแทน hardcode 8
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
                        "Referer: https://hyd-app-db.rid.go.th/hydro2hd_admsl.html",
                    ],
                ]);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if (!$response || $httpCode !== 200) {
                    log_message('error', "Hourly API failed for basin {$basinId}, {$originalDate} | HTTP: {$httpCode}");
                    $results[] = ["basin" => $basinId, "date" => $originalDate, "status" => "fail", "message" => "HTTP {$httpCode}"];
                    continue;
                }

                $json = json_decode($response, true);
                if (!$json || !isset($json['rows']) || empty($json['rows'])) {
                    log_message('info', "ไม่มีข้อมูลรายชั่วโมงสำหรับ basin {$basinId}, วันที่: {$originalDate}");
                    $results[] = ["basin" => $basinId, "date" => $originalDate, "status" => "no_data"];
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

                    // ✅ ใช้ stationMap ของ basin นี้โดยเฉพาะ (แทน index 8-14 hardcode เดิม)
                    foreach ($stationMap as $index => $staCode) {
                        $wlKey = "wlvalues{$index}";
                        $qKey  = "qvalues{$index}"; // ✅ เพิ่มดึง discharge เหมือน updateFlowData
                        $wlRaw = $row[$wlKey] ?? null;
                        $qRaw  = $row[$qKey] ?? null;

                        if ($wlRaw === null || $wlRaw === '' || $wlRaw === '*' || !is_numeric($wlRaw)) {
                            continue;
                        }

                        $wl = floatval($wlRaw);
                        $discharge = (is_numeric($qRaw) && $qRaw !== '*') ? floatval($qRaw) : null;

                        $existing = $builder->where([
                            'sta_code' => $staCode,
                            'datetime' => $datetimeStr
                        ])->get()->getRowArray();

                        if ($existing) {
                            $builder->where([
                                'sta_code' => $staCode,
                                'datetime' => $datetimeStr
                            ])->set([
                                'wl' => $wl,
                                'discharge' => $discharge // ✅ อัปเดต discharge ด้วย (เดิมไม่มี)
                            ])->update();
                            $totalUpdated++;
                        } else {
                            $builder->insert([
                                'sta_code'  => $staCode,
                                'datetime'  => $datetimeStr,
                                'wl'        => $wl,
                                'discharge' => $discharge // ✅ เดิม hardcode เป็น null เสมอ
                            ]);
                            $totalInserted++;
                        }
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
            'message'       => 'อัปเดตข้อมูลรายชั่วโมงย้อนหลังสำเร็จ (หลาย Basin: ยม + น่าน)',
            'from'          => $startDate,
            'to'            => $endDate,
            'inserted'      => $totalInserted,
            'updated'       => $totalUpdated,
            'total_records' => $totalInserted + $totalUpdated,
            'details'       => $results
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
            helper('datetime');

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
                                            ->where('datetime', $data['datetime'])
                                            ->first();

                    if ($existingRecord) {
                        // ถ้าข้อมูลมีอยู่แล้ว ให้อัปเดต
                        $this->rainModel
                            ->where('sta_code', $data['sta_code'])
                            ->where('datetime', $data['datetime'])
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
                            'datetime' => $yesterday,
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
                        'datetime' => $formattedDate,
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
        helper('datetime');

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
                            'datetime' => $dateRecord,
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
                            'datetime' => $date,
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

        $fetched = $this->fetchRidGateData($stationList, $currentDate, $currentDate);

        if (empty($fetched['opening']) && empty($fetched['data'])) {
            return $this->fail('ไม่พบข้อมูลจาก API');
        }

        $recordsAddedOpening   = 0;
        $recordsUpdatedOpening = 0;
        $recordsAddedData      = 0;
        $recordsUpdatedData    = 0;

        $this->gateModel->db->transStart(); // ใช้ transaction ร่วมกัน

        // ───── บันทึก gate_opening ─────
        foreach ($fetched['opening'] as $row) {
            $existing = $this->gateOpen
                ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                ->first();

            if ($existing) {
                $this->gateOpen
                    ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                    ->set($row)
                    ->update();
                $recordsUpdatedOpening++;
            } else {
                $this->gateOpen->insert($row);
                $recordsAddedOpening++;
            }
        }

        // ───── บันทึก gate_data ─────
        // สมมติว่ามี model ชื่อ $this->gateModel
        foreach ($fetched['data'] as $row) {
            $existing = $this->gateModel
                ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                ->first();

            if ($existing) {
                $this->gateModel
                    ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                    ->set($row)
                    ->update();
                $recordsUpdatedData++;
            } else {
                $this->gateModel->insert($row);
                $recordsAddedData++;
            }
        }

        $this->gateModel->db->transComplete();

        return $this->respond([
            'status' => 'success',
            'gate_opening' => [
                'added'   => $recordsAddedOpening,
                'updated' => $recordsUpdatedOpening,
            ],
            'gate_data' => [
                'added'   => $recordsAddedData,
                'updated' => $recordsUpdatedData,
            ],
            'total_fetched' => count($fetched['opening']),
        ]);
    }

    private function fetchRidGateData(array $stationList, string $startDate, string $endDate)
    {
        $client = \Config\Services::curlrequest();
        $openingResult = []; // สำหรับตาราง gate_opening
        $dataResult    = []; // สำหรับตาราง gate_data

        $stationMap = [
            'tng' => [
                'code'     => 'RID3-01',
                'base_url' => 'http://wms-rio3.rid.go.th/thanangngam'
            ],
            'wst' => [
                'code'     => 'RID3-03',
                'base_url' => 'http://wms-rio3.rid.go.th/wangsatue'
            ],
            'kpk' => [
                'code'     => 'RID3-04',
                'base_url' => 'http://wms-rio3.rid.go.th/wangsatue'
            ],
        ];

        foreach ($stationList as $sta) {
            if (!isset($stationMap[$sta])) continue;

            $code    = $stationMap[$sta]['code'];
            $baseUrl = $stationMap[$sta]['base_url'];
            $url     = "{$baseUrl}/api/rid/water-data?code={$code}&startDate={$startDate}&endDate={$endDate}";

            try {
                $response = $client->get($url);
                $data = json_decode($response->getBody(), true);

                if (empty($data) || !is_array($data)) {
                    log_message('warning', "No data returned for station {$sta}");
                    continue;
                }

                foreach ($data as $item) {
                    if (empty($item['datetime'])) continue;

                    $itemTime = \DateTime::createFromFormat('Y-m-d\TH:i:s', $item['datetime']);
                    if (!$itemTime) {
                        $itemTime = \DateTime::createFromFormat('Y-m-d H:i:s', $item['datetime']);
                    }
                    if (!$itemTime) continue;

                    $datetimeStr = $itemTime->format('Y-m-d H:i:s');

                    // ── ข้อมูลสำหรับตาราง gate_opening (ระยะเปิดบาน) ──
                    $openingRow = [
                        'sta_code' => $sta,
                        'datetime' => $datetimeStr,
                    ];
                    for ($i = 1; $i <= 7; $i++) {
                        $apiKey = "gate{$i}_ht";
                        $dbKey  = "gate{$i}_height";
                        $openingRow[$dbKey] = array_key_exists($apiKey, $item) ? $item[$apiKey] : null;
                    }
                    $openingResult[] = $openingRow;

                    // ── ข้อมูลสำหรับตาราง gate_data (ระดับน้ำ + discharge + ฝน) ──
                    $dataResult[] = [
                        'sta_code'  => $sta,
                        'datetime'  => $datetimeStr,
                        'wl_upper'  => $item['upper_water'] ?? null,
                        'wl_lower'  => $item['lower_water'] ?? null,
                        'discharge' => $item['flow'] ?? null,
                        'rain_mm'   => $item['rainfall'] ?? null,
                    ];
                }

            } catch (\Exception $e) {
                log_message('error', "Fetch RID error for {$sta}: " . $e->getMessage());
            }
        }

        return [
            'opening' => $openingResult,
            'data'    => $dataResult,
        ];
    }


    public function updateGateFillData(string $startDate, string $endDate)
    {
        $stationList = ['tng', 'wst', 'kpk'];

        $fetched = $this->fetchRidGateData($stationList, $startDate, $endDate);

        if (empty($fetched['opening']) && empty($fetched['data'])) {
            return $this->respond(['status' => 'fail', 'message' => 'ไม่พบข้อมูลจาก API']);
        }

        $recordsAddedOpening   = 0;
        $recordsUpdatedOpening = 0;
        $recordsAddedData      = 0;
        $recordsUpdatedData    = 0;

        $this->gateModel->db->transStart();

        // gate_opening
        foreach ($fetched['opening'] as $row) {
            $existing = $this->gateOpen
                ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                ->first();

            if ($existing) {
                $this->gateOpen
                    ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                    ->set($row)
                    ->update();
                $recordsUpdatedOpening++;
            } else {
                $this->gateOpen->insert($row);
                $recordsAddedOpening++;
            }
        }

        // gate_data
        foreach ($fetched['data'] as $row) {
            $existing = $this->gateModel
                ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                ->first();

            if ($existing) {
                $this->gateModel
                    ->where(['sta_code' => $row['sta_code'], 'datetime' => $row['datetime']])
                    ->set($row)
                    ->update();
                $recordsUpdatedData++;
            } else {
                $this->gateModel->insert($row);
                $recordsAddedData++;
            }
        }

        $this->gateModel->db->transComplete();

        return $this->respond([
            'status'  => 'success',
            'message' => 'Backfill completed (รายชั่วโมง)',
            'gate_opening' => [
                'added'   => $recordsAddedOpening,
                'updated' => $recordsUpdatedOpening,
            ],
            'gate_data' => [
                'added'   => $recordsAddedData,
                'updated' => $recordsUpdatedData,
            ],
            'range' => [$startDate, $endDate],
        ]);
    }

}
