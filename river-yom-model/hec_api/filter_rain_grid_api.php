<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
// กำหนดพิกัด lat, lon และชื่อที่ต้องการ
$target_points = [
    // SB-01
    '16.497871,99.526566' => 'SB-01',
    '16.577560,99.526566' => 'SB-01',
    '16.577560,99.609700' => 'SB-01',
    '16.657227,99.526566' => 'SB-01',
    '16.657227,99.609700' => 'SB-01',
    '16.657227,99.692840' => 'SB-01',
    '16.736855,99.526566' => 'SB-01',
    '16.736855,99.609700' => 'SB-01',
    '16.736855,99.692840' => 'SB-01',
    '16.736855,99.775970' => 'SB-01',
    '16.816452,99.526566' => 'SB-01',
    '16.816452,99.609700' => 'SB-01',
    '16.816452,99.692840' => 'SB-01',
    '16.816452,99.775970' => 'SB-01',
    '16.816452,99.859100' => 'SB-01',
    '16.896017,99.526566' => 'SB-01',
    '16.896017,99.609700' => 'SB-01',
    '16.896017,99.692840' => 'SB-01',
    '16.896017,99.775970' => 'SB-01',
    '16.896017,99.859100' => 'SB-01',
    '16.896017,99.942245' => 'SB-01',
    '16.975548,99.609700' => 'SB-01',
    '16.975548,99.692840' => 'SB-01',
    '16.975548,99.775970' => 'SB-01',
    '16.975548,99.859100' => 'SB-01',
    '16.975548,99.942245' => 'SB-01',

    // SB-02
    '16.896000,99.942200'  => 'SB-02',
    '16.896000,100.025400' => 'SB-02',

    // SB-03
    '16.657200,99.942200'  => 'SB-03',
    '16.736900,99.942200'  => 'SB-03',
    '16.736900,100.025400' => 'SB-03',
    '16.736900,100.108500' => 'SB-03',
    '16.816500,99.942200'  => 'SB-03',
    '16.816500,100.025400' => 'SB-03',
    '16.816500,100.108500' => 'SB-03',
    '16.896000,99.942200'  => 'SB-03',
    '16.896000,100.025400' => 'SB-03',

    // SB-04
    '16.497900,99.526600' => 'SB-04',
    '16.497900,99.609700' => 'SB-04',
    '16.577600,99.609700' => 'SB-04',
    '16.577600,99.692800' => 'SB-04',
    '16.577600,99.776000' => 'SB-04',
    '16.577600,99.859100' => 'SB-04',
    '16.657200,99.692800' => 'SB-04',
    '16.657200,99.776000' => 'SB-04',
    '16.657200,99.859100' => 'SB-04',
    '16.657200,99.942200' => 'SB-04',
    '16.736900,99.776000' => 'SB-04',
    '16.736900,99.859100' => 'SB-04',
    '16.736900,99.942200' => 'SB-04',
    '16.816500,99.859100' => 'SB-04',
    '16.816500,99.942200' => 'SB-04',

    // SB-05
    '16.577600,99.859100'  => 'SB-05',
    '16.577600,99.942200'  => 'SB-05',
    '16.657227,99.942245'  => 'SB-05',
    '16.657227,100.025380' => 'SB-05',
    '16.657227,100.108520' => 'SB-05',
    '16.657227,100.191650' => 'SB-05',
    '16.736855,100.108520' => 'SB-05',
];

function find_file_by_date($base_dir, $date, $prefix = "p24h.d01.") {
    $time_slots = ["18", "12", "06", "00"]; // ช่วงเวลาที่ต้องการไล่หา
    foreach ($time_slots as $slot) {
        $filename = $base_dir . $prefix . $date . $slot . ".csv";
        if (file_exists($filename)) {
            return $filename; // หากพบไฟล์ ให้คืนค่าชื่อไฟล์
        }
    }
    return false; // หากไม่พบไฟล์
}

// กำหนดวันปัจจุบันในรูปแบบ YYYYMMDD
$current_date = date("Ymd");

// กำหนดที่อยู่ของไฟล์ที่ต้องการตรวจสอบ
$base_dir = "./rain_grid/";

// ค้นหาไฟล์ที่มีชื่อจากวันที่ปัจจุบัน
$filename = find_file_by_date($base_dir, $current_date);

if (!$filename) {
    // ลองย้อนหาวันที่ย้อนหลัง 3 วัน
    for ($i = 1; $i <= 3; $i++) {
        $prev_date = date("Ymd", strtotime("-{$i} day", strtotime($current_date)));
        $filename = find_file_by_date($base_dir, $prev_date);
        
        if ($filename) {
            break; // เจอไฟล์แล้ว ออกจากลูป
        }
    }
}

if (!$filename) {
    echo json_encode(["error" => "ไม่พบไฟล์ย้อนหลัง 3 วัน"]);
    exit;
}

// ถ้าพบไฟล์แล้ว ให้ทำการโหลดไฟล์ CSV
$data = [];
$headers = [];
$count_data = []; // ใช้นับจำนวนข้อมูลแต่ละคอลัมน์
if (($handle = fopen($filename, "r")) !== false) {
    while (($row = fgetcsv($handle, 0, ",", '"', "\\")) !== false) {
        if (empty($headers)) {
            // ดึงหัวข้อคอลัมน์
            $headers = $row;
            continue;
        }

        // จับคู่ข้อมูลตามหัวข้อคอลัมน์
        $row_assoc = array_combine($headers, $row);
        $lat_lon = $row_assoc["lat"] . "," . $row_assoc["lon"];

        // ตรวจสอบว่าพิกัดอยู่ในรายการที่กำหนดหรือไม่
        if (isset($target_points[$lat_lon])) {
            $name = $target_points[$lat_lon];

            // รวมข้อมูลตามชื่อสถานีและวันที่
            foreach ($row_assoc as $key_column => $value) {
                if ($key_column != "lat" && $key_column != "lon") {
                    $date = $key_column;  // วันที่จากชื่อคอลัมน์
                    // ตรวจสอบว่าเป็นตัวเลขก่อนที่จะรวมค่า
                    $float_value = is_numeric($value) ? floatval($value) : 0;

                    // สร้างคีย์ที่ประกอบด้วยสถานีและวันที่
                    $key = $name;
                    if (!isset($data[$key])) {
                        $data[$key] = [
                            "values" => []
                        ];
                        $count_data[$key] = [];
                    }

                    // เพิ่มค่าผลรวม
                    if (!isset($data[$key]["values"][$key_column])) {
                        $data[$key]["values"][$key_column] = 0;
                        $count_data[$key][$key_column] = 0;
                    }
                    $data[$key]["values"][$key_column] += $float_value;
                    $count_data[$key][$key_column]++; // เพิ่มจำนวนข้อมูลที่ใช้รวมค่า
                }
            }
        }
    }
    fclose($handle);
}

// คำนวณค่าเฉลี่ยโดยการหารค่าผลรวมด้วยจำนวนข้อมูลที่ใช้รวมค่า
foreach ($data as $key => &$station) {
    foreach ($station["values"] as $date => &$value) {
        if ($count_data[$key][$date] > 0) {
            $value = $value / $count_data[$key][$date]; // คำนวณค่าเฉลี่ย
        }
    }
}

// สร้าง JSON เป็นผลลัพธ์
header('Content-Type: application/json');
echo json_encode($data, JSON_PRETTY_PRINT);
?>

