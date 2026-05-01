<?php
// ตั้งค่า Header สำหรับการเข้าถึง API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

date_default_timezone_set("Asia/Bangkok");

// === ฟังก์ชันดึงข้อมูลจาก API ===
function fetchApiData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        $currentTime = date('Y-m-d H:i:s');
        die("❌ ดึงข้อมูลไม่สำเร็จ ณ $currentTime (HTTP Code: $httpCode)");
    }
    return json_decode($response, true);
}

// === API รายสถานี gate ===
$apiUrl = "https://swocthachin.rid.go.th/swoc-api/api/model_input_data";

// === 1. ดึงข้อมูลจาก API ===
$data = fetchApiData($apiUrl);

// === 2. ตั้งค่ารายชื่อสถานี ===
$stations = ['PPM', 'MSW', 'KYG', 'KTB', 'MHC', 'BYH', 'PBL', 'BBP', 'SPN', 'PTL'];

// === 3. เตรียมข้อมูลรายวัน ===
$tempData = [];
$dateList = [];

if (isset($data['data']) && is_array($data['data'])) {
    foreach ($data['data'] as $record) {
        if (in_array($record['sta_code'], $stations) && isset($record['date'])) {
            $isoDate = date('Y-m-d', strtotime($record['date']));
            $tempData[$record['sta_code']][$isoDate] = (float)($record['value'] ?? 0);
            $dateList[$isoDate] = true;
        }
    }
}

$dateList = array_keys($dateList);
sort($dateList);

// === 4. ทำ carry-forward (ดึงค่าก่อนหน้าถ้าวันนี้ = 0) ===
$flowData = [];

foreach ($stations as $station) {
    $flowData[$station] = [];
    $lastValue = 0.0;

    foreach ($dateList as $isoDate) {
        $currentValue = isset($tempData[$station][$isoDate]) ? (float)$tempData[$station][$isoDate] : 0.0;

        if ($currentValue > 0) {
            $lastValue = $currentValue;
        }
        $flowData[$station][$isoDate] = round($lastValue, 2);
    }
}

// === 5. ตั้งค่าช่วงวัน (ย้อนหลัง 7 วัน + ล่วงหน้า 7 วัน) ===
$current = new DateTime();
$startDate = (clone $current)->modify('-7 days');
$endDate = (clone $current)->modify('+7 days');
$totalDays = $endDate->diff($startDate)->days + 1;

$currentDateKey = $current->format('Y-m-d');
$currentDateHeader = $startDate->format('dMY');

// === 6. Mapping ชื่อสถานี ===
$stationNames = [
    'PPM' => 'Gate PPM',
    'MSW' => 'Gate MSW',
    'KYG' => 'Gate KYG',
    'KTB' => 'Gate KTB',
    'MHC' => 'Gate MHC',
    'BYH' => 'Gate BYH',
    'PBL' => 'Gate PBL',
    'BBP' => 'Gate BBP',
    'SPN' => 'Gate SPN',
    'PTL' => 'Gate PTL'
];

$gateMode = [
    'PPM' => 'real',   
    'MSW' => 'real',
    'KYG' => 'real',
    'KTB' => 'real',
    'MHC' => 'real',
    'BYH' => 'real',
    'PBL' => 'latest',
    'BBP' => 'latest',
    'SPN' => 'latest',
    'PTL' => 'latest'
];

// === 7. ดึงข้อมูลอ่างกระเสียว (KS) ย้อนหลัง 14 วัน ===
$resApi = "https://swocthachin.rid.go.th/swoc-api/api/reservoir_data_last_14_days";
$resData = fetchApiData($resApi);

$ksOutflow = [];

if (isset($resData['data']) && is_array($resData['data'])) {
    foreach ($resData['data'] as $rec) {
        if ($rec['res_code'] === 'ks') {
            $d = date('Y-m-d', strtotime($rec['date']));
            $ksOutflow[$d] = isset($rec['outflow']) ? (float)$rec['outflow'] : 0.0;
        }
    }
}

// จำกัดข้อมูล KS เฉพาะ "วันนี้ + ย้อนหลัง 7 วัน"
$ksStart = (new DateTime())->modify('-7 days');
$ksEnd   = (new DateTime())->modify('+7 days');
$ksTotalDays = $ksEnd->diff($ksStart)->days + 1;
// === 8. เขียนไฟล์ ===
$filePath = "C:/xampp/htdocs/swoc-model/RAS_Input/input-gate.txt";
// $filePath = "./input-gate.txt";
$f = fopen($filePath, "w");

// --- เขียน GATE ทั้งหมด --- //
foreach ($stations as $sta) {
    $staName = $stationNames[$sta];
    fwrite($f, "//{$staName}/FLOW/{$currentDateHeader}/1Day/GAGE/\n");
    fwrite($f, "RTS  Ver: 1   Prog:DssVue  LW:" . date("dMY H:i:s") . "  Tag:Tag        Prec:0\n");
    fwrite($f, "Start: " . $startDate->format("dMY") . " at 0700 hours;   End: " . $endDate->format("dMY") . " at 0700 hours;  Number: {$ksTotalDays}\n");
    fwrite($f, "Units: M3/S    Type: INST-VAL\n");

    $lastVal = 0.0;
    $loop = clone $startDate;

    while ($loop <= $endDate) {
        $dKey = $loop->format('Y-m-d');
        $displayDate = $loop->format('dMY');

        $isLatest = ($gateMode[$sta] ?? 'latest') === 'latest';

        if ($isLatest) {
            if (isset($tempData[$sta][$dKey]) && $tempData[$sta][$dKey] > 0) {
                $lastVal = $tempData[$sta][$dKey];
            }
            $val = $lastVal;
        } else {
            $val = isset($tempData[$sta][$dKey]) ? $tempData[$sta][$dKey] : 0.0;
        }

        fwrite($f, sprintf("%s, 0700;\t%.2f\n", $displayDate, $val));
        $loop->modify('+1 day');
    }

    fwrite($f, "\tEND DATA\n");
}

fwrite($f, "//KS/FLOW/{$ksStart->format('dMY')}/1Day/GAGE/\n");
fwrite($f, "RTS  Ver: 1   Prog:DssVue  LW:" . date("dMY H:i:s") . "  Tag:KS-Res   Prec:0\n");
fwrite($f, "Start: " . $ksStart->format("dMY") . " at 0700 hours;   End: " . $ksEnd->format("dMY") . " at 0700 hours;  Number: 8\n");
fwrite($f, "Units: M3/S    Type: INST-VAL\n");

$loop = clone $ksStart;
while ($loop <= $ksEnd) {
    $dKey = $loop->format('Y-m-d');
    $show = $loop->format('dMY');
    $valRaw = isset($ksOutflow[$dKey]) ? $ksOutflow[$dKey] : 0.0;  // ล้าน ลบ.ม./วัน
    $val = ($valRaw * 1000000) / 86400; 


    fwrite($f, sprintf("%s, 0700;\t%.2f\n", $show, $val));
    $loop->modify('+1 day');
}

fwrite($f, "\tEND DATA\n");

fwrite($f, "\tEND FILE\n");
fclose($f);

echo "✅ สร้างไฟล์สำเร็จ: {$filePath}";
?>
