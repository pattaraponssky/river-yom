<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
$batFile = 'C:\\xampp\\htdocs\\river-yom-model\\hms-run.bat';
exec("\"$batFile\"", $output, $return_var);
if ($return_var === 0) {
    echo "การรันสำเร็จ";
} else {
    echo "การรันไม่สำเร็จ";
}