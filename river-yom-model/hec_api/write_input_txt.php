<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 1. **แก้ไข URL API 3 ให้ชี้ไปยัง model_input_data**
$apiUrl1 = "http://localhost/swoc-model/hec_api/input_hms.php";
$apiUrl2 = "http://localhost/swoc-model/hec_api/filter_rain_grid_api.php";
$apiUrl3 = "https://swocthachin.rid.go.th/swoc-api/api/model_input_data";

function fetchApiData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        // ใช้ error_log แทน die เพื่อให้สคริปต์ทำงานต่อหากมีปัญหา แต่บันทึกข้อผิดพลาดไว้
        error_log("❌ ไม่สามารถดึงข้อมูลจาก API: $url (HTTP Code: $httpCode)");
        return null;
    }
    return json_decode($response, true);
}

$data1 = fetchApiData($apiUrl1);
$data2 = fetchApiData($apiUrl2);
// ดึงข้อมูลจาก API ใหม่ (ซึ่งจะมีทั้ง 'rain' และ 'flow')
$data3 = fetchApiData($apiUrl3);

$stations = ['C.54', 'T.18', 'T.17', 'T.16','T.13'];
$flowData = [];

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
        }
    }
}

$fileName = "C:/xampp/htdocs/swoc-model/HMS_Thachin/input-hms/input-hms.txt";

$startDate = new DateTime();
$startDate->modify("-7 days");
$endDate = clone $startDate;
$endDate->modify("+13 days");

$currentDateFormatted = $startDate->format("dMY");

$variables = ['SB-01', 'SB-02', 'SB-03', 'SB-04', 'SB-05', 'SB-06', 'SB-07', 'SB-08', 'SB-09', 'SB-10', 'SB-11'];

$file = fopen($fileName, "w");

// --- ส่วนที่ 1: ข้อมูลฝน (PRECIP-INC) ---
foreach ($variables as $var) {
    fwrite($file, "//$var/PRECIP-INC/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59    Tag:Tag     Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;  End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 15\n");
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
    'C.54' => 'Gate1', 
    'T.18' => 'Gate2', 
    'T.17' => 'Gate3', 
    'T.16' => 'Gate4', 
    'T.13' => 'T.13'
];

$today = new DateTime();

foreach ($stations as $station) {
    $mappedName = $stationMappings[$station] ?? $station;

    // *** แก้ไขตรงนี้: รวม 'T.13' เข้าไปในกลุ่มที่ใช้ Logic ดึงค่าล่าสุดที่ไม่เป็น 0 ***
    $isGateOrT13 = in_array($station, ['C.54', 'T.18', 'T.17', 'T.16', 'T.13']);
    
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
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours; End: " . $endDate->format("dMY") . " at 0700 hours; Number: 8\n"); 
    fwrite($file, "Units: CMS Type: INST-VAL\n");

    $currentDate = clone $startDate;
    // วนลูปถึงวันปัจจุบัน (รวมวันนี้)
    while ($currentDate <= $today) { 
        $dateString = $currentDate->format("dMY");
        $formattedDate = $currentDate->format("d/m/Y");

        // ดึงค่า discharge จากข้อมูลที่จัดระเบียบใหม่
        $valueFlow = $flowData[$station][$formattedDate] ?? 0;
        
        // **Logic การปรับปรุง**: ถ้าเป็น Gate หรือ T.13 และค่าปัจจุบันเป็น 0 (หรือไม่มีข้อมูล) ให้ใช้ค่าล่าสุดที่ไม่เป็นศูนย์
        if ($isGateOrT13 && ($valueFlow == 0)) {
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
fclose($file);

echo "✅ สร้างไฟล์ $fileName (ท่าจีน) สำเร็จ!!";
?>

