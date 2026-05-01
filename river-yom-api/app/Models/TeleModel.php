<?php

namespace App\Models;

use CodeIgniter\Model;

class TeleModel extends Model
{

    protected $table = 'tele_data'; // ชื่อตารางจริงในฐานข้อมูลของคุณ
    protected $allowedFields = ['sta_code', 'datetime', 'wl', 'discharge', 'rain_mm']; // กำหนดฟิลด์ที่แก้ไขได้ (ถ้าจำเป็น)
    
      public function getTeleInfo()
    {
        return $this->db->table('tele_info')->get()->getResultArray();
    }

    public function getTodayTeleDataByStationCodes(array $staCodes): array
    {
        // ดึงข้อมูลทั้งหมดจากตาราง tele_data เท่านั้น (SELECT *)
        // กรองตามรหัสสถานีและวันที่ปัจจุบัน (ไม่มี JOIN กับ tele_info)
        $data = $this->db->table($this->table)
            ->whereIn('sta_code', $staCodes) // กรองตามรหัสสถานี
            ->where('DATE(datetime)', date('Y-m-d')) // กรองเฉพาะวันที่ปัจจุบัน
            ->get()
            ->getResultArray();

        return $data;
    }

    // เมธอดสำหรับดึงข้อมูลจาก tele_data โดยใช้ sta_code
    // public function getTeleDataByCode($sta_code)
    // {
    //     return $this->db->table('tele_data')
    //         ->where('sta_code', $sta_code)
    //         ->get()
    //         ->getResultArray();
    // }

    // // ดึงข้อมูลจาก tele_data ตาม sta_code และช่วงปี
    // public function getTeleDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    // {
    //     return $this->db->table('tele_data')
    //         ->where('sta_code', $sta_code)
    //         ->where("YEAR(datetime) >=", $startYear)
    //         ->where("YEAR(datetime) <=", $endYear)
    //         ->orderBy('datetime', 'ASC')
    //         ->get()
    //         ->getResultArray();
    // }

    // ดึงข้อมูลเวลา 7.00 น. ของทุกวันจาก tele_data ตาม sta_code 
    public function getTeleDataByCode($sta_code)
    {
        return $this->db->table('tele_data')
            ->where('sta_code', $sta_code)
            ->where("TIME(datetime)", '07:00:00')
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }
    public function getTeleDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        
        return $this->db->table('tele_data')
            ->select("DATE(datetime) as date, sta_code, wl, discharge, rain_mm")
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear)
            ->where("YEAR(datetime) <=", $endYear)
            ->where("TIME(datetime)", '07:00:00')
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }

        public function getTeleHourlyDataByCode($sta_code)
    {
        return $this->db->table('tele_data')
            ->where('sta_code', $sta_code)
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }
    public function getTeleHourlyDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('tele_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear)
            ->where("YEAR(datetime) <=", $endYear)
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getTeleDataLast7Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 7 วันล่าสุดจากทุกอ่าง
        return $this->select("DATE(datetime) as date, sta_code, wl, discharge, rain_mm")
                    ->where('datetime >=', date('Y-m-d', strtotime('-7 days')))
                    ->where("TIME(datetime)", '07:00:00')
                    ->orderBy('datetime', 'DESC')
                    ->findAll();
    }

    public function getTeleDataLast14Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 14 วันล่าสุดจากทุกอ่าง
        return $this->select("DATE(datetime) as date, sta_code, wl, discharge, rain_mm")
                ->where('datetime >=', date('Y-m-d', strtotime('-14 days')))
                ->where("TIME(datetime)", '07:00:00')
                ->orderBy('datetime', 'DESC')
                ->findAll();
    }


    public function updateTeleData(string $sta_code, string $date, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }

        $convertedDate = $this->convertDateFormat($date);
        $builder = $this->db->table($this->table);

        $exists = $builder->where('sta_code', $sta_code)
                        ->where('DATE(datetime)', $convertedDate)
                        ->get()
                        ->getRow();

        $fullData = array_merge($updateData, [
            'sta_code' => $sta_code,
            'datetime' => $convertedDate
        ]);

        if ($exists) {
            return $builder->where('sta_code', $sta_code)
                        ->where('DATE(datetime)', $convertedDate)
                        ->update($updateData);
        } else {
            return $builder->insert($fullData);
        }
    }

    public function updateMultipleTeleData(array $dataArray)
    {
        $updatedCount = 0;

        foreach ($dataArray as $data) {
            if (!isset($data['sta_code']) || !isset($data['date'])) {
                continue;
            }

            $sta_code = $data['sta_code'];
            $date = $this->convertDateFormat($data['date']);

            $updateData = $data;
            unset($updateData['sta_code'], $updateData['date']);

            if (empty($updateData)) {
                continue;
            }

            $builder = $this->db->table($this->table);

            $exists = $builder->where('sta_code', $sta_code)
                            ->where('DATE(datetime)', $date)
                            ->get()
                            ->getRow();

            $fullData = array_merge($updateData, [
                'sta_code' => $sta_code,
                'datetime' => $date
            ]);

            if ($exists) {
                $updated = $builder->where('sta_code', $sta_code)
                                ->where('DATE(datetime)', $date)
                                ->update($updateData);
            } else {
                $updated = $builder->insert($fullData);
            }

            if ($updated) {
                $updatedCount++;
            }
        }

        return $updatedCount;
    }

    public function recordExists(string $sta_code, string $date): bool
    {
        $convertedDate = $this->convertDateFormat($date);

        return (bool) $this->db->table($this->table)
            ->where('sta_code', $sta_code)
            ->where('DATE(datetime) ', $convertedDate)
            ->countAllResults();
    }

    private function convertDateFormat(string $date): string
    {
        $dateTime = \DateTime::createFromFormat('j/n/Y', $date);
        return $dateTime ? $dateTime->format('Y-m-d') : $date;
    }
    
}
