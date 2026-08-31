<?php
// กำหนดหัวข้อสำหรับ CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// *** ส่วนที่เพิ่มเพื่อแก้ไขปัญหา Timezone และการแสดงผล ***
// 1. ตั้งค่า Timezone เป็น Asia/Bangkok เพื่อให้แน่ใจว่าเวลาอ้างอิงถูกต้อง
date_default_timezone_set('Asia/Bangkok');

// ฟังก์ชันสำหรับตรวจสอบรูปแบบวันที่ (ใช้แสดงผลเพื่อ Debug)
function checkDateTimeFormat($date, $label) {
    $format = 'YmdH';
    $output = $date->format($format);
    echo "[$label] DateTime: " . $date->format('Y-m-d H:i:s') . " | Format Code ($format): **$output**<br>";
    return $output;
}
// *** สิ้นสุดส่วนที่เพิ่ม ***


// ฟังก์ชันสำหรับสร้าง URL ตามวันที่และเวลา
function generateFileUrl($date) {
    // ใช้ 'YmdH' ในการสร้าง URL path และ filename
    $date_format = $date->format('YmdH');
    return "https://hpc.tmd.go.th/static/csv/" . $date_format . "/p24h.d01." . $date_format . ".csv";
}

// ฟังก์ชันตรวจสอบว่าไฟล์สามารถดาวน์โหลดได้หรือไม่ โดยใช้ cURL
function downloadFileUsingCurl($url, $filename) {
    // ... (ฟังก์ชันเดิมของคุณ)
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
        echo "ไม่พบไฟล์: **" . $url . "**<br>";
        curl_close($ch);
        return false;
    }

    if ($file_content === false) {
        $error = curl_error($ch);
        echo "ไม่สามารถดาวน์โหลดไฟล์ได้! Error: " . ($error ?: "Unknown") . "<br>";
        curl_close($ch);
        return false;
    }
    
    // บันทึกข้อมูลลงในไฟล์
    file_put_contents($filename, $file_content);
    curl_close($ch);
    return true;
}

$folder = "./rain_grid"; 
if (!is_writable(dirname($folder))) { // ควรเช็คสิทธิ์การเขียนบน parent directory ก่อนสร้างโฟลเดอร์
    echo "โฟลเดอร์ที่อยู่เหนือ rain_grid ไม่มีสิทธิ์ในการเขียน<br>";
    // ออกจากโปรแกรมถ้าไม่สามารถดำเนินการต่อได้
    exit; 
} else {
    echo "สามารถเขียนไฟล์ลงในโฟลเดอร์ได้<br>";
}

// ตรวจสอบว่าโฟลเดอร์มีอยู่แล้วหรือไม่ ถ้าไม่มีให้สร้าง
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}

// สร้าง DateTime object สำหรับวันและเวลาเริ่มต้น
$today = new DateTime();
$today->setTime(18, 0); // ตั้งเวลาเป็น 18:00

// แสดงผลการตรวจสอบรูปแบบวันที่
echo "--- การตรวจสอบรูปแบบวันที่ (YYYYMMDDHH) ---<br>";
checkDateTimeFormat($today, "ไฟล์หลักที่คาดหวัง (วันนี้ 18:00)");
echo "-------------------------------------------------<br>";

$urls_to_try = [];
$urls_to_try[] = generateFileUrl($today);
    
$try_times = ['18', '12', '06', '00'];
foreach ($try_times as $time) {
    // สร้าง DateTime object ของเมื่อวาน แล้วตั้งเวลา
    $yesterday = (clone $today)->modify('-1 day');
    $yesterday->setTime($time, 0);
    
    // แสดงผลการตรวจสอบสำหรับไฟล์สำรอง
    checkDateTimeFormat($yesterday, "ไฟล์สำรอง (เมื่อวาน $time:00)");
    
    $urls_to_try[] = generateFileUrl($yesterday);
}
echo "-------------------------------------------------<br>";


// ลองดาวน์โหลดไฟล์
$downloaded = false;
foreach ($urls_to_try as $url) {
    $filename = $folder . "/" . basename($url); // ใช้พาธจากตัวแปร $folder
    if (downloadFileUsingCurl($url, $filename)) {
        echo "## ดาวน์โหลดไฟล์สำเร็จ: **" . $filename . "**<br>";
        $downloaded = true;
        break;
    }
}

if (!$downloaded) {
    echo "## ไม่สามารถดาวน์โหลดไฟล์ที่ถูกต้องได้เลย!";
}
?>