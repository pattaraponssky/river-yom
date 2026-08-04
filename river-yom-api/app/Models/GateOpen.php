<?php

namespace App\Models;

use CodeIgniter\Model;

class GateOpen extends Model
{

    protected $table = 'gate_opening'; // ชื่อตารางจริงในฐานข้อมูลของคุณ
    protected $allowedFields = ['sta_code', 'datetime', 'gate1_height','gate2_height', 'gate3_height', 'gate4_height', 'gate5_height', 'gate6_height', 'gate7_height']; // กำหนดฟิลด์ที่แก้ไขได้ (ถ้าจำเป็น)
    
      public function getGateInfo()
    {
        return $this->db->table('gate_info')->get()->getResultArray();
    }

    // เมธอดสำหรับดึงข้อมูลจาก Gate_data โดยใช้ sta_code
    public function getGateDataByCode($sta_code)
    {
        return $this->db->table('gate_opening')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    public function getActualGateData($sta_code, $date)
    {
        return $this->where('sta_code', $sta_code)
                    ->where('datetime', $date)
                    ->first(); // ดึงข้อมูลแถวเดียว (หรือจะใช้ findAll() ก็ได้ถ้าคาดว่ามีหลายแถว)
    }

    // ดึงข้อมูลจาก Gate_data ตาม sta_code และช่วงปี
    public function getGateDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('gate_opening')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear)
            ->where("YEAR(datetime) <=", $endYear)
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getGateDataLast7Days()
    {
        return $this->select('*')
                    ->where('datetime >=', date('Y-m-d 00:00:00', strtotime('-7 days')))
                    ->orderBy('datetime', 'DESC')
                    ->findAll();
    }

    public function getGateDataLast14Days()
    {
        return $this->select('*')
                    ->where('datetime >=', date('Y-m-d 00:00:00', strtotime('-14 days')))
                    ->orderBy('datetime', 'DESC')
                    ->findAll();
    }
      public function findByStationAndDate(string $stationId, string $date)
    {
        return $this->where(['sta_code' => $stationId, 'datetime' => $date])->first();
    }
    
    public function getGateDataLast8Days(array $stationCodes)
    {
        $today = date('Y-m-d 23:59:59');
        $startDate = date('Y-m-d 00:00:00', strtotime('-7 days')); // รวมวันนี้ = 8 วัน

        return $this->select('sta_code, datetime, discharge')  // เปลี่ยน date → datetime
                    ->whereIn('sta_code', $stationCodes)
                    ->where('datetime >=', $startDate)
                    ->where('datetime <=', $today)
                    ->findAll();
    }
}
