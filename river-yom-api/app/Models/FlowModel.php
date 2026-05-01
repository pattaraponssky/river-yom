<?php

namespace App\Models;

use CodeIgniter\Model;

class FlowModel extends Model
{

    protected $table = 'flow_data'; // ชื่อตารางจริงในฐานข้อมูลของคุณ
    protected $allowedFields = ['sta_code', 'date', 'wl', 'discharge']; // กำหนดฟิลด์ที่แก้ไขได้ (ถ้าจำเป็น)
    
      public function getFlowInfo()
    {
        return $this->db->table('flow_info')->get()->getResultArray();
    }

    public function getTodayFlowDataByStationCodes(array $staCodes): array
    {
        // ดึงข้อมูลทั้งหมดจากตาราง flow_data เท่านั้น (SELECT *)
        // กรองตามรหัสสถานีและวันที่ปัจจุบัน (ไม่มี JOIN กับ flow_info)
        $data = $this->db->table($this->table)
            ->whereIn('sta_code', $staCodes) // กรองตามรหัสสถานี
            ->where('DATE(date)', date('Y-m-d')) // กรองเฉพาะวันที่ปัจจุบัน
            ->get()
            ->getResultArray();

        return $data;
    }

    // เมธอดสำหรับดึงข้อมูลจาก flow_data โดยใช้ sta_code
    public function getFlowDataByCode($sta_code)
    {
        return $this->db->table('flow_data')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    // ดึงข้อมูลจาก flow_data ตาม sta_code และช่วงปี
    public function getFlowDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('flow_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(date) >=", $startYear)
            ->where("YEAR(date) <=", $endYear)
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getFlowDataLast7Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 7 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-7 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }

    public function getFlowDataLast14Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 14 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-14 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }


    public function updateFlowData(string $sta_code, string $date, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }

        $convertedDate = $this->convertDateFormat($date);
        $builder = $this->db->table($this->table);

        $exists = $builder->where('sta_code', $sta_code)
                        ->where('date', $convertedDate)
                        ->get()
                        ->getRow();

        $fullData = array_merge($updateData, [
            'sta_code' => $sta_code,
            'date' => $convertedDate
        ]);

        if ($exists) {
            return $builder->where('sta_code', $sta_code)
                        ->where('date', $convertedDate)
                        ->update($updateData);
        } else {
            return $builder->insert($fullData);
        }
    }

    public function updateMultipleFlowData(array $dataArray)
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
                            ->where('date', $date)
                            ->get()
                            ->getRow();

            $fullData = array_merge($updateData, [
                'sta_code' => $sta_code,
                'date' => $date
            ]);

            if ($exists) {
                $updated = $builder->where('sta_code', $sta_code)
                                ->where('date', $date)
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
            ->where('date', $convertedDate)
            ->countAllResults();
    }

    private function convertDateFormat(string $date): string
    {
        $dateTime = \DateTime::createFromFormat('j/n/Y', $date);
        return $dateTime ? $dateTime->format('Y-m-d') : $date;
    }
    
}
