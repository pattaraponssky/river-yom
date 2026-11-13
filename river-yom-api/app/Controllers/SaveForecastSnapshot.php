<?php
// app/Controllers/ForecastSnapshot.php

namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;

class SaveForecastSnapshot extends BaseController
{
    use ResponseTrait;

    public function run()
    {
        $db = \Config\Database::connect();
        $today = date('Y-m-d'); // เช่น 2025-12-10

        try {

            $startOfDay = $today . ' 09:00:00';
            $endOfDay   = $today . ' 08:59:59';

            $deleted = $db->table('flow_forecast_record')
                          ->where('datetime >=', $startOfDay)
                          ->where('datetime <=', $endOfDay)
                          ->delete();

            $builder = $db->table('flow_forecast');
            $builder->select('sta_code, datetime, wl, discharge');
            $builder->where('datetime >=', $startOfDay);
            $builder->where('datetime <=', $endOfDay);
            $builder->whereIn('sta_code', ['Y.50', 'Y.15', 'Y.16', 'Y.64', 'Y.4']);
            $builder->orderBy('datetime', 'ASC');

            // 3. INSERT ลง flow_forecast_record (โครงสร้างเหมือนกันเป๊ะ)
            $sql = "INSERT INTO flow_forecast_record (sta_code, datetime, wl, discharge) " 
                   . $builder->getCompiledSelect();

            $db->query($sql);

            $inserted = $db->affectedRows();

            log_message('info', "Snapshot: บันทึกพยากรณ์วันที่ $today จำนวน $inserted แถว (แทนที่ข้อมูลเก่า $deleted แถว)");

            return $this->respond([
                'status'        => 'success',
                'message'       => 'บันทึกพยากรณ์วันนี้เรียบร้อย (แทนที่ข้อมูลเก่า)',
                'date'          => $today,
                'rows_inserted' => $inserted,
                'rows_replaced' => $deleted,
                'period'        => "$startOfDay ถึง $endOfDay",
                'saved_at'      => date('Y-m-d H:i:s')
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Snapshot Error: ' . $e->getMessage());

            return $this->respond([
                'status'  => 'error',
                'message' => 'เกิดข้อผิดพลาดในการบันทึกพยากรณ์',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}