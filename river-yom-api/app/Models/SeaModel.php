<?php

namespace App\Models;

use CodeIgniter\Model;

class SeaModel extends Model
{
    protected $table = 'sea_data'; // ชื่อตารางจริงในฐานข้อมูล
    protected $allowedFields = ['sta_code', 'datetime', 'wl']; 

    public function getSeaInfo()
    {
        return $this->db->table('sea_info')->get()->getResultArray();
    }

    // ดึงข้อมูลจาก sea_data โดยใช้ sta_code
    public function getSeaDataByCode($sta_code)
    {
        return $this->db->table('sea_data')
            ->where('sta_code', $sta_code)
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }

    // ดึงข้อมูลจาก sea_data ตาม sta_code และช่วงปี (ใช้ datetime)
    public function getSeaDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('sea_data')
            ->where('sta_code', $sta_code)
            ->where('YEAR(datetime) >=', $startYear)
            ->where('YEAR(datetime) <=', $endYear)
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getSeaDataToday()
    {
        $today = date('Y-m-d');
        $start = $today . ' 00:00:00';
        $end = $today . ' 23:59:59';
    
        return $this->where('datetime >=', $start)
                    ->where('datetime <=', $end)
                    ->orderBy('datetime', 'ASC') // หรือ DESC ตามลำดับเวลาที่ต้องการ
                    ->findAll();
    }
    
    public function getSeaDataCurrentYear()
    {
        $currentYear = date('Y');
        $startDate = "$currentYear-01-01 00:00:00";
        $endDate = "$currentYear-12-31 23:59:59";

        return $this->where('datetime >=', $startDate)
                    ->where('datetime <=', $endDate)
                    ->orderBy('datetime', 'ASC')
                    ->findAll();
    }
    public function updateSeaData(string $sta_code, string $datetime, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }
    
        $convertedDatetime = $this->convertDateTimeFormat($datetime);
        $builder = $this->db->table($this->table);
    
        $exists = $builder->where('sta_code', $sta_code)
                          ->where('datetime', $convertedDatetime)
                          ->get()
                          ->getRow();
    
        $fullData = array_merge($updateData, [
            'sta_code' => $sta_code,
            'datetime' => $convertedDatetime
        ]);
    
        if ($exists) {
            return $builder->where('sta_code', $sta_code)
                           ->where('datetime', $convertedDatetime)
                           ->update($updateData);
        } else {
            return $builder->insert($fullData);
        }
    }
    
    public function updateMultipleSeaData(array $dataArray)
    {
        $updatedCount = 0;
    
        foreach ($dataArray as $data) {
            if (!isset($data['sta_code']) || !isset($data['datetime'])) {
                continue;
            }
    
            $sta_code = $data['sta_code'];
            $datetime = $this->convertDateTimeFormat($data['datetime']);
    
            $updateData = $data;
            unset($updateData['sta_code'], $updateData['datetime']);
    
            if (empty($updateData)) {
                continue;
            }
    
            $builder = $this->db->table($this->table);
    
            $exists = $builder->where('sta_code', $sta_code)
                              ->where('datetime', $datetime)
                              ->get()
                              ->getRow();
    
            $fullData = array_merge($updateData, [
                'sta_code' => $sta_code,
                'datetime' => $datetime
            ]);
    
            if ($exists) {
                $updated = $builder->where('sta_code', $sta_code)
                                   ->where('datetime', $datetime)
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
    
    public function recordExists(string $sta_code, string $datetime): bool
    {
        $convertedDatetime = $this->convertDateTimeFormat($datetime);
    
        return (bool) $this->db->table($this->table)
            ->where('sta_code', $sta_code)
            ->where('datetime', $convertedDatetime)
            ->countAllResults();
    }
    
    private function convertDateTimeFormat(string $datetime): string
    {
        $dateTime = \DateTime::createFromFormat('j/n/Y H:i', $datetime) // ป้อนเช่น 18/6/2025 09:00
                 ?? \DateTime::createFromFormat('Y-m-d H:i:s', $datetime)
                 ?? \DateTime::createFromFormat('Y-m-d\TH:i:s', $datetime); // รองรับ ISO
    
        return $dateTime ? $dateTime->format('Y-m-d H:i:s') : $datetime;
    }
    
    public function getSeaDataRange()
    {
        $today = date('Y-m-d');
        $startDate = date('Y-m-d 00:00:00', strtotime('-3 days', strtotime($today))); // ✅ ย้อนหลัง 3 วัน
        $endDate = date('Y-m-d 23:59:59', strtotime('+6 days', strtotime($today)));   // ✅ ล่วงหน้า 6 วัน

        return $this->where('datetime >=', $startDate)
                    ->where('datetime <=', $endDate)
                    ->orderBy('datetime', 'ASC')
                    ->findAll();
    }
}

