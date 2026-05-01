<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

set_time_limit(0); // ไม่จำกัดเวลา
ini_set('max_execution_time', 0); 
ini_set('output_buffering', 'off');
ini_set('zlib.output_compression', 0);
ob_implicit_flush(true);
flush();

// ฟังก์ชันสำหรับรันคำสั่ง
function runCommand($command) {
    exec($command . " 2>&1", $output, $return_var);
    return [$return_var, $output];
}

$results = [];

// 1. รัน hec_ras_run.py
[$return1, $output1] = runCommand("\"C:\Users\Administrator\AppData\Local\Programs\Python\Python313\python.exe\" C:\\xampp\\htdocs\\swoc-model\\hec_ras_run.py");
$results[] = [
    "step" => "hec_ras_run.py",
    "success" => $return1 === 0,
    "output" => $output1
];
if ($return1 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ hec_ras_run.py failed", "results" => $results]);
    exit;
}

// 2. รัน ras-output.py
[$return2, $output2] = runCommand("\"C:\Users\Administrator\AppData\Local\Programs\Python\Python313\python.exe\" C:\\xampp\\htdocs\\swoc-model\\ras-output.py");
$results[] = [
    "step" => "ras-output.py",
    "success" => $return2 === 0,
    "output" => $output2
];
if ($return2 !== 0) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ ras-output.py failed", "results" => $results]);
    exit;
}

// ถ้าทุกอย่างผ่าน
http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "✅ All steps completed successfully",
    "results" => $results
]);
?>
