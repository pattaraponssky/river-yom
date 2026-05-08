<?php

namespace App\Models;

use CodeIgniter\Model;

class GateOpen extends Model
{

    protected $table = 'gate_opening'; // ชื่อตารางจริงในฐานข้อมูลของคุณ
    protected $allowedFields = ['sta_code', 'date', 'gate1_height','gate2_height', 'gate3_height', 'gate4_height', 'gate5_height', 'gate6_height']; // กำหนดฟิลด์ที่แก้ไขได้ (ถ้าจำเป็น)
    
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
                    ->where('date', $date)
                    ->first(); // ดึงข้อมูลแถวเดียว (หรือจะใช้ findAll() ก็ได้ถ้าคาดว่ามีหลายแถว)
    }

    // ดึงข้อมูลจาก Gate_data ตาม sta_code และช่วงปี
    public function getGateDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('gate_opening')
            ->where('sta_code', $sta_code)
            ->where("YEAR(date) >=", $startYear)
            ->where("YEAR(date) <=", $endYear)
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getGateDataLast7Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 7 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-7 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }

    public function getGateDataLast14Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 14 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-14 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }

      public function findByStationAndDate(string $stationId, string $date)
    {
        return $this->where(['sta_code' => $stationId, 'date' => $date])->first();
    }
    
     public function getGateDataLast8Days(array $stationCodes) // <--- ชื่อฟังก์ชันนี้ต้องตรง
    {
        // กำหนดช่วงวันที่ย้อนหลัง 8 วัน (รวมวันนี้)
        $today = date('Y-m-d');
        $startDate = date('Y-m-d', strtotime('-7 days')); // รวมวันนี้ก็คือ 8 วัน

        return $this->select('sta_code, date, discharge')
                    ->whereIn('sta_code', $stationCodes)
                    ->where('date >=', $startDate)
                    ->where('date <=', $today)
                    ->findAll();
    }
}
