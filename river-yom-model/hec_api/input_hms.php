<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- ฟังก์ชันดึงข้อมูลจาก API (ปรับปรุงให้แข็งแกร่งขึ้น) ---
function fetchData($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30); // เพิ่ม Timeout เผื่อ API ช้า
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // เพิ่ม Connection Timeout

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);

    curl_close($ch);

    if ($response === false) {
        error_log("CURL Error: Failed to fetch data from $url. Error: " . $curlError);
        return null;
    }
    
    // ตรวจสอบ HTTP Code อีกครั้ง หาก curl_exec ไม่คืนค่า false แต่ได้ HTTP error
    if ($httpCode >= 400) {
        error_log("CURL HTTP Error: Failed to fetch data from $url. HTTP Code: $httpCode. Response: " . substr($response, 0, 200));
        return null;
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("JSON Decode Error: Failed to decode JSON from $url. Error: " . json_last_error_msg() . " Raw response: " . substr($response, 0, 500));
        return null;
    }
    return $decoded;
}

// --- การจัดการวันที่ ---
date_default_timezone_set('Asia/Bangkok'); 

$today_ce = new DateTime('today');

// สร้างวันที่สำหรับแสดงผลย้อนหลัง 7 วัน (ไม่รวมวันปัจจุบัน)
$display_and_data_end_date_ce = (clone $today_ce)->modify('-1 day');
$display_and_data_start_date_ce = (clone $display_and_data_end_date_ce)->modify('-6 days');

$dates_display = [];
$date_map_ce_to_display = [];
$current_loop_date = clone $display_and_data_start_date_ce;
while ($current_loop_date <= $display_and_data_end_date_ce) {
    // แปลงปี ค.ศ. เป็น พ.ศ. สำหรับการแสดงผล (DD/MM/YYYY_BE)
    $year_be_display = (int)$current_loop_date->format('Y') + 543;
    $date_display_str = $current_loop_date->format('d/m/') . $year_be_display;
    $dates_display[] = $date_display_str;
    $date_map_ce_to_display[$current_loop_date->format('Y-m-d')] = $date_display_str;
    $current_loop_date->modify('+1 day');
}

// --- โหลดข้อมูลจาก API ใหม่ swocthachin.rid.go.th ---
// **แก้ไข URL ตามที่ร้องขอ**
$rid_api_url = "https://swocthachin.rid.go.th/swoc-api/api/model_input_data";
$rid_data_response = fetchData($rid_api_url); 
// เนื่องจาก API นี้อาจมีการจัดโครงสร้างข้อมูลที่แตกต่างกัน (เช่น มี 'data' key)
$rid_data_raw = isset($rid_data_response['data']) && is_array($rid_data_response['data']) ? $rid_data_response['data'] : (is_array($rid_data_response) ? $rid_data_response : []);

// --- รวมข้อมูลจาก API ทั้งสองแหล่งเข้าด้วยกัน (แต่ตอนนี้ใช้แหล่งเดียว) ---
$all_rain_data_by_station_date = [];
foreach ($rid_data_raw as $record) {
    if (isset($record['sta_code']) && isset($record['date']) && isset($record['data_type']) && $record['data_type'] === 'rain') {
        // ใช้ date แทน date และตรวจสอบ data_type ต้องเป็น 'rain' เท่านั้น
        $key = $record['sta_code'] . '_' . $record['date'];
        $all_rain_data_by_station_date[$key] = floatval($record['value'] ?? 0);
    }
}

// --- สัดส่วน Subbasin ---
$subbasin_ratios = [
    'SB-01' => ['690151' => 0.008663, '690171' => 0.100290, '040052' => 0.153813 , '040062' => 0.737233],
    'SB-02' => ['690151' => 0.132497, '690171' => 0.867503 ],
    'SB-03' => ['690171' => 0.397491, '040052' => 0.602509],
    'SB-04' => ['690171' => 0.994784, '040052' => 0.005216],
    'SB-05' => ['690171' => 0.096386, '040052' => 0.893483, '040062' => 0.010130],
    'SB-06' => ['600013' => 0.593401, '690171' => 0.013694, '040052' => 0.392904],
    'SB-07' => ['600023' => 0.220773, '690171' => 0.779227],
    'SB-08' => ['600013' => 0.073420, '600023' => 0.705110, '690171' => 0.147377, '040052' => 0.074092],
    'SB-09' => ['600023' => 0.978914, '230052' => 0.021086],
    'SB-10' => ['600013' => 0.528361, '600023' => 0.260375, '230052' => 0.211264],
    'SB-11' => ['600013' => 0.000012, '530012' => 0.311614, '230052' => 0.688374],
];

// --- คำนวณค่า Subbasin รายวัน ---
$sb_daily_values = [];

foreach ($subbasin_ratios as $sb => $ratios) {
    $sb_daily_values[$sb] = [];
    foreach ($dates_display as $date_display) {
        $sb_value = 0.0;
        // แปลงวันที่แสดงผลเป็น Y-m-d สำหรับการค้นหาข้อมูล
        $date_parts = explode('/', $date_display);
        $date_ce_str = ($date_parts[2] - 543) . '-' . $date_parts[1] . '-' . $date_parts[0];

        foreach ($ratios as $station_id => $ratio) {
            $key = $station_id . '_' . $date_ce_str;
            // ดึงค่าจากข้อมูลที่รวมแล้ว
            $rain = $all_rain_data_by_station_date[$key] ?? 0.0;
            $sb_value += $rain * $ratio;
        }
        $sb_daily_values[$sb][$date_display] = round($sb_value, 2);
    }
}

// --- ส่งออก JSON ---
echo json_encode([
    "dates_for_display" => $dates_display,
    "rid_data_api_url" => $rid_api_url, // แสดง URL ใหม่
    "rainfall_data_combined" => $all_rain_data_by_station_date,
    "subbasin_ratios_used" => $subbasin_ratios,
    "sb_daily_values" => $sb_daily_values
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

?>
