<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Check for POST request and get the data
$request_body = file_get_contents('php://input');
$postData = json_decode($request_body, true);

// Check if all required data is present in the POST data
if (!isset($postData['sb_daily_values']) || !isset($postData['data3']) || !isset($postData['data2'])) {
    die("❌ ไม่พบข้อมูลที่จำเป็นใน POST request. กรุณาส่งข้อมูล 'sb_daily_values', 'data3' และ 'data2' มาพร้อมกัน");
}

$sb_daily_values = $postData['sb_daily_values'];
$data3 = $postData['data3']; // Use data3 from the POST request
$data2 = $postData['data2']; // Use data2 from the POST request

$stations = ['C.54', 'T.18', 'T.17', 'T.16', 'T.13'];
$flowData = [];

// Process data from the gate data sent via POST
if (isset($data3['data']) && is_array($data3['data'])) {
    foreach ($data3['data'] as $record) {
        if (in_array($record['sta_code'], $stations)) {
            $date_obj = new DateTime($record['date']);
            $formattedDate = $date_obj->format('d/m/Y');
            $flowData[$record['sta_code']][$formattedDate] = floatval($record['discharge'] ?? 0);
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

foreach ($variables as $var) {
    fwrite($file, "//$var/PRECIP-INC/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted  23:59:59   Tag:Tag        Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours;   End: " . $endDate->format("dMY") . " at 0700 hours;  Number: 15\n");
    fwrite($file, "Units: MM    Type: PER-CUM\n");

    $currentDate = clone $startDate;
    while ($currentDate <= $endDate) {
        $dateString = $currentDate->format("dMY");
        $dateKey = $currentDate->format("Y-m-d");
        $formattedDateApi2 = "00:00Z " . $dateKey;

        // Use the POST data first, then fallback to data2 if no data is found
        $value1 = $sb_daily_values[$var][$dateKey] ?? 0;
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

// Define the names for each station
$stationMappings = [
    'C.54' => 'Gate1', 
    'T.18' => 'Gate2', 
    'T.17' => 'Gate3', 
    'T.16' => 'Gate4', 
    'T.13' => 'T.13'
];

foreach ($stations as $station) {
    $mappedName = $stationMappings[$station] ?? $station;
    fwrite($file, "//$mappedName/FLOW/$currentDateFormatted/1Day/GAGE/\n");
    fwrite($file, "RTD  Ver:  1   Prog:DssVue  LW:$currentDateFormatted 23:59:59 Tag:Tag Prec:9\n");
    fwrite($file, "Start: " . $startDate->format("dMY") . " at 0700 hours; End: " . $endDate->format("dMY") . " at 0700 hours; Number: 8\n");
    fwrite($file, "Units: CMS Type: INST-VAL\n");

    $today = new DateTime();
    $currentDate = clone $startDate;
    while ($currentDate <= $today) {
        $dateString = $currentDate->format("dMY");
        $formattedDate = $currentDate->format("d/m/Y");

        $valueFlow = $flowData[$station][$formattedDate] ?? "0";

        if ($valueFlow !== "0" && is_numeric($valueFlow)) {
            $valueFlow = number_format((float)$valueFlow, 9, '.', '');
        }

        fwrite($file, "{$dateString}, 0700;\t$valueFlow\n");
        $currentDate->modify("+1 day");
    }

    fwrite($file, "\tEND DATA\n");
}

fwrite($file, "\tEND FILE\n");
fclose($file);

echo "✅ สร้างไฟล์ $fileName (ท่าจีน) สำเร็จ!!";

// --- START: New code to run the BAT file ---
$batFile = 'C:\\xampp\\htdocs\\swoc-model\\HMS_Thachin\\input-hms\\input-hms.bat';

// Execute the .bat file and wait for it to finish.
// The `exec` command without `start /B` is blocking.
exec("\"$batFile\"", $output, $return_var);

// Check the result and set a success or failure message.
if ($return_var === 0) {
    echo "✅ สร้างไฟล์ $fileName (ท่าจีน) สำเร็จ!! และรันไฟล์ BAT เรียบร้อย";
} else {
    echo "❌ สร้างไฟล์ $fileName (ท่าจีน) สำเร็จ!! แต่มีข้อผิดพลาดในการรันไฟล์ BAT.";
}
// --- END: New code to run the BAT file ---

?>