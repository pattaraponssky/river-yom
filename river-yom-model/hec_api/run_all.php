<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
set_time_limit(1200);
// ฟังก์ชันสำหรับสร้าง URL ตามวันที่และเวลา
function generateFileUrl($date) {
    return "https://hpc.tmd.go.th/static/csv/" . $date->format('YmdH') . "/p24h.d01." . $date->format('YmdH') . ".csv";
}

// ฟังก์ชันตรวจสอบว่าไฟล์สามารถดาวน์โหลดได้หรือไม่ โดยใช้ cURL
function downloadFileUsingCurl($url, $filename) {
    echo "กำลังพยายามดาวน์โหลดไฟล์: " . $url . "\n";
    $ch = curl_init($url);
    
    // กำหนดตัวเลือกให้ cURL
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $file_content = curl_exec($ch);
    
    // ตรวจสอบว่าเกิดข้อผิดพลาดหรือไม่
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($http_code == 404) {
        echo "ไม่พบไฟล์: " . $url . "\n";
        curl_close($ch);
        return false;
    }

    if ($file_content === false) {
        echo "ไม่สามารถดาวน์โหลดไฟล์ได้! (Curl Error: " . curl_error($ch) . ")\n";
        curl_close($ch);
        return false;
    }
    
    // บันทึกข้อมูลลงในไฟล์
    file_put_contents($filename, $file_content);
    curl_close($ch);
    return true;
}

$folder = "./rain_grid"; 
if (!is_writable($folder)) {
    echo "โฟลเดอร์ไม่มีสิทธิ์ในการเขียน: " . $folder . "\n";
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ โฟลเดอร์ไม่มีสิทธิ์ในการเขียน"]);
    exit;
} else {
    echo "สามารถเขียนไฟล์ลงในโฟลเดอร์ได้: " . $folder . "\n";
}

// ตรวจสอบว่าโฟลเดอร์มีอยู่แล้วหรือไม่ ถ้าไม่มีให้สร้าง
if (!is_dir($folder)) {
    echo "กำลังสร้างโฟลเดอร์: " . $folder . "\n";
    if (!mkdir($folder, 0777, true)) {
        echo "ไม่สามารถสร้างโฟลเดอร์ได้: " . $folder . "\n";
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "❌ ไม่สามารถสร้างโฟลเดอร์ได้"]);
        exit;
    }
}

// สร้าง DateTime object สำหรับวันและเวลาเริ่มต้น
$today = new DateTime();
$today->setTime(18, 0); // ตั้งเวลาเป็น 18:00 (6 โมงเย็น)

$urls_to_try = [];
$urls_to_try[] = generateFileUrl($today);

// ลองเวลาอื่น ๆ จากเมื่อวานเผื่อไฟล์ 18:00 วันนี้ยังไม่ออก
$try_times = ['18', '12', '06', '00'];
foreach ($try_times as $time) {
    $yesterday = (clone $today)->modify('-1 day');
    $yesterday->setTime($time, 0);
    $urls_to_try[] = generateFileUrl($yesterday);
}

// ลองดาวน์โหลดไฟล์
$downloaded = false;
foreach ($urls_to_try as $url) {
    $filename = $folder . "/" . basename($url); 
    if (downloadFileUsingCurl($url, $filename)) {
        echo "✅ ดาวน์โหลดไฟล์สำเร็จ: " . $filename . "\n";
        $downloaded = true;
        break;
    }
}

if (!$downloaded) {
    echo "❌ ไม่สามารถดาวน์โหลดไฟล์ใด ๆ ได้เลย!\n";
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ไม่สามารถดาวน์โหลดไฟล์ข้อมูลฝนได้"]);
    exit; 
}

// กำหนด API URLs
$apiUrl1 = "http://localhost/swoc-api/hec_api/input_hms.php";
$apiUrl2 = "http://localhost/swoc-api/hec_api/filter_rain_grid_api.php";
$apiUrl3 = "http://localhost/swoc-api/API/api_flow_hydro3_8day.php";

// ฟังก์ชันสำหรับดึงข้อมูล API
function fetchApiData($url) {
    echo "กำลังดึงข้อมูลจาก API: " . $url . "\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        die("❌ ไม่สามารถดึงข้อมูลจาก API: $url (HTTP Code: $httpCode)\n");
    }
    echo "✅ ดึงข้อมูลจาก API สำเร็จ: " . $url . "\n";
    return json_decode($response, true);
}

// ดึงข้อมูลจาก API ต่างๆ
$data1 = fetchApiData($apiUrl1);
$data2 = fetchApiData($apiUrl2);
$data3 = fetchApiData($apiUrl3);

// ประมวลผลข้อมูลการไหล
$stations = ['E.91', 'E.87'];
$flowData = [];

foreach ($stations as $stationCode) {
    foreach ($data3 as $station) {
        if ($station["stationcode"] === $stationCode) {
            foreach ($station as $date => $value) {
                // ข้าม key ที่ไม่ใช่วันที่ (เช่น stationcode, basinname ฯลฯ)
                if (!preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $date)) {
                    continue;
                }
                
                if (!isset($flowData[$stationCode][$date])) {
                    $flowData[$stationCode][$date] = [];
                }
                $flowData[$stationCode][$date][] = $value;
            }
        }
    }
}

$fileName = "C:\\xampp\\htdocs\\swoc-model\\hms_thachin\\input-hms\\input-hms.txt";

$startDate = new DateTime();
$startDate->modify("-7 days");
$endDate = clone $startDate;
$endDate->modify("+13 days");

$currentDateFormatted = $startDate->format("dMY");

$variables = ['SB-01', 'SB-02', 'SB-03', 'SB-04', 'SB-05', 'SB-06', 'SB-07'];

echo "กำลังสร้างไฟล์: " . $fileName . "\n";
$file = fopen($fileName, "w");
if ($file === false) {
    echo "❌ ไม่สามารถเปิดไฟล์ " . $fileName . " เพื่อเขียนได้\n";
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ไม่สามารถสร้างไฟล์ input-hms.txt ได้"]);
    exit;
}

// เขียนข้อมูลฝน
foreach ($variables as $var) {
    fwrite($file, "//$var/PRECIP-INC/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59   Tag:Tag        Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;   End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 15\n");
    fwrite($file, "Units: MM    Type: PER-CUM\n");

    $currentDate = clone $startDate;
    while ($currentDate <= $endDate) {
        $formattedDate = $currentDate->format("d/m/Y");
        $dateString = $currentDate->format("dMY");
        $dateKey = $currentDate->format("Y-m-d");

        $value1 = isset($data1['sb_daily_values'][$var][$formattedDate]) ? $data1['sb_daily_values'][$var][$formattedDate] : "0";
        $value2 = isset($data2[$var]['values']["00:00Z $dateKey"]) ? $data2[$var]['values']["00:00Z $dateKey"] : "0";

        $finalValue = ($value1 !== "0") ? $value1 : $value2;
        if ($finalValue !== "0" && is_numeric($finalValue)) {
            $finalValue = number_format((float)$finalValue, 9, '.', '');
        }

        fwrite($file, "{$dateString}, 0700;\t$finalValue\n");
        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

// เขียนข้อมูล Flow
foreach ($stations as $station) {
    fwrite($file, "//$station/FLOW/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted 23:59:59 Tag:Tag Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours; End: " . $endDate->format("dMY") . " at 0700 hours; Number: 8\n");
    fwrite($file, "Units: M3/S Type: PER-AVER\n");

    $today = new DateTime();
    $currentDate = clone $startDate;
    while ($currentDate <= $today) { // ข้อมูล Flow จะเขียนถึงแค่ปัจจุบัน
        $dateString = $currentDate->format("dMY");
        $formattedDate = $currentDate->format("d/m/Y");

        if (isset($flowData[$station][$formattedDate])) {
            // คำนวณค่าเฉลี่ยของข้อมูล Flow ที่มีหลายค่าต่อวัน
            $averageValue = array_sum($flowData[$station][$formattedDate]) / count($flowData[$station][$formattedDate]);
            $valueFlow = number_format((float)$averageValue, 9, '.', '');
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

echo "✅ สร้างไฟล์ $fileName (วังยาง) สำเร็จ!!\n";

// ฟังก์ชันสำหรับรันคำสั่งและเก็บผลลัพธ์
function runCommand($command) {
    $output = [];
    $return_var = 0;
    // ใช้ exec โดยตรงเพื่อรอให้คำสั่งทำงานเสร็จ
    exec($command . " 2>&1", $output, $return_var); 
    return [$return_var, $output];
}

$results = [];

// 1. รัน hms-run.bat (การคำนวณ HEC-HMS)
$batFileHMS = 'C:\\xampp\\htdocs\\swoc-model\\hms-run.bat';
echo "กำลังรัน: $batFileHMS\n";
[$returnHMS, $outputHMS] = runCommand($batFileHMS);
$results[] = [
    "step" => "hms-run.bat",
    "success" => $returnHMS === 0,
    "output" => $outputHMS
];
if ($returnHMS !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ hms-run.bat ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ hms-run.bat ทำงานเสร็จสิ้น.\n";
}

// 2. รัน ras_update_date.py
echo "กำลังรัน: ras_update_date.py\n";
[$return1, $output1] = runCommand("python C:\\xampp\\htdocs\\swoc-model\\ras_update_date.py");
$results[] = [
    "step" => "ras_update_date.py",
    "success" => $return1 === 0,
    "output" => $output1
];
if ($return1 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras_update_date.py ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ ras_update_date.py ทำงานเสร็จสิ้น.\n";
}

// 3. รัน hec_ras_compute.py
echo "กำลังรัน: hec_ras_compute.py\n";
[$return2, $output2] = runCommand("python C:\\xampp\\htdocs\\swoc-model\\hec_ras_compute.py");
$results[] = [
    "step" => "hec_ras_compute.py",
    "success" => $return2 === 0,
    "output" => $output2
];
if ($return2 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ hec_ras_compute.py ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ hec_ras_compute.py ทำงานเสร็จสิ้น.\n";
}

// 4. รัน ras-output-flow.bat
$batFileFlow = 'C:\\xampp\\htdocs\\swoc-model\\ras-output-flow.bat';
echo "กำลังรัน: $batFileFlow\n";
[$return3, $output3] = runCommand($batFileFlow);
$results[] = [
    "step" => "ras-output-flow.bat",
    "success" => $return3 === 0,
    "output" => $output3
];
if ($return3 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output-flow.bat ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ ras-output-flow.bat ทำงานเสร็จสิ้น.\n";
}

// 5. รัน ras-output-gate.bat
$batFileGate = 'C:\\xampp\\htdocs\\swoc-model\\ras-output-gate.bat';
echo "กำลังรัน: $batFileGate\n";
[$return4, $output4] = runCommand($batFileGate);
$results[] = [
    "step" => "ras-output-gate.bat",
    "success" => $return4 === 0,
    "output" => $output4
];
if ($return4 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output-gate.bat ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ ras-output-gate.bat ทำงานเสร็จสิ้น.\n";
}

// 6. รัน ras-output.py
echo "กำลังรัน: ras-output.py\n";
[$return5, $output5] = runCommand("python C:\\xampp\\htdocs\\swoc-model\\ras-output.py");
$results[] = [
    "step" => "ras-output.py",
    "success" => $return5 === 0,
    "output" => $output5
];
if ($return5 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output.py ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ ras-output.py ทำงานเสร็จสิ้น.\n";
}

// 7. รัน gate_json.bat
$batFileGateJson = 'C:\\xampp\\htdocs\\swoc-model\\gate_json.bat';
echo "กำลังรัน: $batFileGateJson\n";
[$return6, $output6] = runCommand($batFileGateJson);
$results[] = [
    "step" => "gate_json.bat",
    "success" => $return6 === 0,
    "output" => $output6
];
if ($return6 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ gate_json.bat ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ gate_json.bat ทำงานเสร็จสิ้น.\n";
}

// 8. รัน send_gate_open.bat
$batFileSendGate = 'C:\\xampp\\htdocs\\swoc-model\\send_gate_open.bat';
echo "กำลังรัน: $batFileSendGate\n";
[$return7, $output7] = runCommand($batFileSendGate);
$results[] = [
    "step" => "send_gate_open.bat",
    "success" => $return7 === 0,
    "output" => $output7
];
if ($return7 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ send_gate_open.bat ล้มเหลว", "results" => $results]);
    exit;
} else {
    echo "✅ send_gate_open.bat ทำงานเสร็จสิ้น.\n";
}

// ถ้าทุกอย่างผ่าน
http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "✅ ทุกขั้นตอนเสร็จสมบูรณ์เรียบร้อยแล้ว",
    "results" => $results
]);

?>