<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use Config\Database;

class Stations extends ResourceController
{
    use ResponseTrait;

    protected $format = 'json';

    /**
     * GET /api/stations
     * รายการสถานีทั้งหมด พร้อมจำนวนอุปกรณ์ที่ติดตั้งในแต่ละสถานี
     */
    public function index()
    {
        $db = Database::connect();

        $builder = $db->table('tele_info t');
        $builder->select('t.sta_code, t.sta_name, t.river, t.tambon, t.district, t.province,
                           t.capacity, t.lat, t.long, COUNT(e.id) AS equipment_count');
        $builder->join('equipment e', 'e.sta_code = t.sta_code', 'left');
        $builder->groupBy('t.sta_code, t.sta_name, t.river, t.tambon, t.district, t.province,
                            t.capacity, t.lat, t.long');
        $builder->orderBy('t.sta_code', 'ASC');

        $stations = $builder->get()->getResultArray();

        // แปลง equipment_count เป็น int (บาง driver คืนเป็น string)
        foreach ($stations as &$s) {
            $s['equipment_count'] = (int) $s['equipment_count'];
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงข้อมูลสถานีสำเร็จ',
            'data'    => $stations,
            'count'   => count($stations),
        ]);
    }

    /**
     * GET /api/stations/{sta_code}
     * ข้อมูลสถานีเดียวจาก tele_info (read-only)
     */
    public function show($staCode = null)
    {
        if (empty($staCode)) {
            return $this->fail('กรุณาระบุรหัสสถานี');
        }

        $db = Database::connect();

        $station = $db->table('tele_info')
                      ->where('sta_code', $staCode)
                      ->get()
                      ->getRowArray();

        if (!$station) {
            return $this->failNotFound('ไม่พบสถานีนี้ใน tele_info');
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงข้อมูลสถานีสำเร็จ',
            'data'    => $station,
        ]);
    }
}