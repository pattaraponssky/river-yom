<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

date_default_timezone_set('Asia/Bangkok');
$apiUrl3 = "https://wms-yom-right.rid.go.th/river-yom-api/api/model_input_data";

function fetchApiData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    // SSL verification bypass requested for this model input endpoint only.
    if ($url === 'https://wms-yom-right.rid.go.th/river-yom-api/api/model_input_data') {
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $curlErrno = curl_errno($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        // ใช้ error_log แทน die เพื่อให้สคริปต์ทำงานต่อหากมีปัญหา แต่บันทึกข้อผิดพลาดไว้
        error_log("❌ ไม่สามารถดึงข้อมูลจาก API: $url (HTTP Code: $httpCode; cURL $curlErrno: $curlError)");
        return null;
    }
    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : null;
}

// Run local JSON producers without depending on Apache's localhost virtual host.
function readLocalModelData($script, $modelInputData = null) {
    ob_start();
    try {
        include __DIR__ . '/' . $script;
        $json = ob_get_contents();
    } finally {
        ob_end_clean();
    }
    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : null;
}

$data3 = fetchApiData($apiUrl3);
if (!isset($data3['data']) || !is_array($data3['data']) || !$data3['data']) {
    http_response_code(502);
    exit('Cannot read model input API; see PHP error log for cURL details. Existing input-hms.txt was preserved.');
}
$data1 = readLocalModelData('input_hms.php', $data3);
$data2 = readLocalModelData('filter_rain_grid_api.php');

// Never overwrite the previous input file when a source cannot be read.
if (!isset($data1['sb_daily_values']) || !is_array($data1['sb_daily_values'])
    || !is_array($data2) || isset($data2['error'])
    || !isset($data3['data']) || !is_array($data3['data']) || !$data3['data']) {
    http_response_code(502);
    exit('Cannot read model input/rainfall APIs; existing input-hms.txt was preserved.');
}

$stations = ['Y.15'];
$flowData = [];
$ratingCurveDates = [];

// 2. **ปรับปรุง Logic การประมวลผลข้อมูล Flow จาก model_input_data**
if (isset($data3['data']) && is_array($data3['data'])) {
    foreach ($data3['data'] as $record) {
        // ตรวจสอบว่าเป็นสถานีที่ต้องการ และ data_type เป็น 'flow'
        if (in_array($record['sta_code'], $stations) && 
            isset($record['data_type']) && $record['data_type'] === 'flow' &&
            isset($record['date'])) {
            
            // ใช้ 'date' เพื่อสร้าง DateTime object
            $date_obj = new DateTime($record['date']); 
            $formattedDate = $date_obj->format('d/m/Y');
            
            // ใช้ 'value' สำหรับค่า Flow
            // เก็บข้อมูลในรูปแบบ [station][d/m/Y] = value
            $flowData[$record['sta_code']][$formattedDate] = floatval($record['value'] ?? 0);
            $ratingCurveDates[$record['sta_code']][$formattedDate] =
                ($record['flow_source'] ?? null) === 'rating_curve';
        }
    }
}

$fileName = dirname(__DIR__) . "/HMS-R-YR/Input-HMS/input-hms.txt";

$startDate = new DateTime('today');
$startDate->modify("-7 days");
$endDate = clone $startDate;
$endDate->modify("+13 days");

$currentDateFormatted = $startDate->format("dMY");

$variables = ['SB-01', 'SB-02', 'SB-03', 'SB-04', 'SB-05'];

$temporaryFile = tempnam(dirname($fileName), 'hms-');
if ($temporaryFile === false || ($file = fopen($temporaryFile, "w")) === false) {
    http_response_code(500);
    exit('Cannot create temporary HMS input file.');
}

// --- ส่วนที่ 1: ข้อมูลฝน (PRECIP-INC) ---
foreach ($variables as $var) {
    fwrite($file, "//$var/PRECIP-INC/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59    Tag:Tag     Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;  End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 14\n");
    fwrite($file, "Units: MM    Type: PER-CUM\n");

    $currentDate = clone $startDate;
    while ($currentDate <= $endDate) {
        $dateString = $currentDate->format("dMY");
        $dateKey = $currentDate->format("Y-m-d");

        // สร้าง key สำหรับ API1 (แปลงเป็น พ.ศ.)
        $thaiYear = (int)$currentDate->format("Y") + 543;
        $formattedDateApi1 = $currentDate->format("d/m/") . $thaiYear;

        // key สำหรับ API2
        $formattedDateApi2 = "00:00Z " . $dateKey;

        // ดึงค่าจาก API1 (sb_daily_values) หรือ API2
        $value1 = $data1['sb_daily_values'][$var][$formattedDateApi1] ?? 0;
        $value2 = $data2[$var]['values'][$formattedDateApi2] ?? 0;

        $finalValue = ($value1 != 0) ? $value1 : $value2;

        if ($finalValue !== 0 && is_numeric($finalValue)) {
            $finalValue = number_format((float)$finalValue, 9, '.', '');
        } else {
            $finalValue = "0";
        }

        fwrite($file, "{$dateString}, 0700;\t$finalValue\n");
        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

// -------------------------------------------------------------
// --- ส่วนที่ 2: ข้อมูลน้ำท่า (FLOW) - ปรับปรุง Logic การดึงค่าล่าสุดที่ไม่เป็นศูนย์ ---
// -------------------------------------------------------------

// กำหนดชื่อที่ต้องการสำหรับแต่ละสถานี
$stationMappings = [
    'Y.15' => 'Y.15'
];

$today = new DateTime('today');

foreach ($stations as $station) {
    $mappedName = $stationMappings[$station] ?? $station;

    $isGateOrT13 = in_array($station, ['Y.15']);
    
    // เตรียมหาค่าล่าสุดที่ไม่เป็นศูนย์ (ถ้าจำเป็น)
    $lastNonZeroFlow = 0;
    if ($isGateOrT13 && isset($flowData[$station])) {
        // วนย้อนกลับจากวันปัจจุบันไปหาวันที่เก่าที่สุดในชุดข้อมูล เพื่อหาค่าล่าสุดที่ไม่ใช่ 0
        $flowDates = array_keys($flowData[$station]);
        // เรียงวันที่จากใหม่ไปเก่า
        usort($flowDates, function($a, $b) {
            return DateTime::createFromFormat('d/m/Y', $b) <=> DateTime::createFromFormat('d/m/Y', $a);
        });

        foreach ($flowDates as $dateKey) {
            $value = $flowData[$station][$dateKey];
            if ($value > 0) { // ตรวจสอบค่าที่ไม่เป็นศูนย์ (มากกว่า 0)
                $lastNonZeroFlow = $value;
                break;
            }
        }
    }
    
    // เริ่มเขียนไฟล์
    fwrite($file, "//$mappedName/FLOW/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted 23:59:59 Tag:Tag Prec:9\n");
    // NOTE: จำนวนข้อมูลที่เขียนใน Loop Flow จะขึ้นอยู่กับ $today (8 วัน)
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours; End: " . $today->format("dMY") . " at 0700 hours; Number: 8\n");
    fwrite($file, "Units: CMS Type: INST-VAL\n");

    $currentDate = clone $startDate;
    // วนลูปถึงวันปัจจุบัน (รวมวันนี้)
    while ($currentDate <= $today) { 
        $dateString = $currentDate->format("dMY");
        $formattedDate = $currentDate->format("d/m/Y");

        // ดึงค่า discharge จากข้อมูลที่จัดระเบียบใหม่
        $valueFlow = $flowData[$station][$formattedDate] ?? 0;
        
        // **Logic การปรับปรุง**: ถ้าเป็น Gate หรือ T.13 และค่าปัจจุบันเป็น 0 (หรือไม่มีข้อมูล) ให้ใช้ค่าล่าสุดที่ไม่เป็นศูนย์
        if ($isGateOrT13 && ($valueFlow == 0)
            && empty($ratingCurveDates[$station][$formattedDate])) {
            $valueFlow = $lastNonZeroFlow;
        }

        if (is_numeric($valueFlow)) {
            $valueFlow = number_format((float)$valueFlow, 9, '.', '');
        } else {
            $valueFlow = "0";
        }

        fwrite($file, "{$dateString}, 0700;\t$valueFlow\n");
        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

fwrite($file, "\tEND FILE\n");
$writeSucceeded = fflush($file);
fclose($file);
if (!$writeSucceeded || !rename($temporaryFile, $fileName)) {
    http_response_code(500);
    exit('Cannot publish HMS input file.');
}

echo "✅ สร้างไฟล์ $fileName (แม่ยมฝั่งขวา) สำเร็จ!!";
?>

