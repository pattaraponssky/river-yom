<?php

namespace App\Models;

use CodeIgniter\Model;

class FlowModel extends Model
{
    protected $table = 'flow_data';
    protected $allowedFields = ['sta_code', 'datetime', 'wl', 'discharge']; // ✅ เปลี่ยน 'date' -> 'datetime'

    public function getFlowInfo()
    {
        return $this->db->table('flow_info')->get()->getResultArray();
    }

    public function getActualFlowData($sta_code, $date)
    {
        $datetime = $this->convertDateFormat($date); // ✅ แปลงเป็น datetime พร้อมเวลา 07:00

        return $this->where('sta_code', $sta_code)
                    ->where('datetime', $datetime) 
                    ->first();
    }

    public function getTodayFlowDataByStationCodes(array $staCodes): array
    {
        $today7am = date('Y-m-d') . ' 07:00:00'; // ✅ ระบุเวลา 07:00 ตรงๆ

        $data = $this->db->table($this->table)
            ->whereIn('sta_code', $staCodes)
            ->where('datetime', $today7am)
            ->get()
            ->getResultArray();

        return $data;
    }

    public function getFlowDataByCode($sta_code)
    {
        return $this->db->table('flow_data')
            ->where('sta_code', $sta_code)
            ->where("TIME(datetime) =", '07:00:00')
            ->get()
            ->getResultArray();
    }

    public function getFlowDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('flow_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear) // ✅ เปลี่ยนเป็น datetime
            ->where("YEAR(datetime) <=", $endYear)    // ✅ เปลี่ยนเป็น datetime
            ->where("TIME(datetime) =", '07:00:00')
            ->orderBy('datetime', 'ASC')              // ✅ เปลี่ยนเป็น datetime
            ->get()
            ->getResultArray();
    }


    public function getFlowHourlyDataByCode($sta_code)
    {
        return $this->db->table('flow_data')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    public function getFlowHourlyDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('flow_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear) // ✅ เปลี่ยนเป็น datetime
            ->where("YEAR(datetime) <=", $endYear)    // ✅ เปลี่ยนเป็น datetime
            ->orderBy('datetime', 'ASC')              // ✅ เปลี่ยนเป็น datetime
            ->get()
            ->getResultArray();
    }

    public function getFlowDataLast7Days()
    {
        $sevenDaysAgo = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $sevenDaysAgo) // ✅ เปลี่ยนเป็น datetime
                    ->where("TIME(datetime) = '07:00:00'")
                    ->orderBy('datetime', 'DESC')          // ✅ เปลี่ยนเป็น datetime
                    ->findAll();
    }

    public function getFlowDataModelLast8Days(array $staCodes)
    {
        $today = date('Y-m-d') . ' 07:00:00';
        $startDate = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        // ดึงเฉพาะเวลา 07:00 ของแต่ละวัน
        $builder = $this->db->table('flow_data'); 
        $builder->select("
            sta_code,
            DATE(datetime) AS date,
            discharge
        ");
        $builder->whereIn('sta_code', $staCodes);
        $builder->where('datetime >=', $startDate);
        $builder->where('datetime <=', $today);
        $builder->where("TIME(datetime) = '07:00:00'");  
        $builder->orderBy('datetime', 'ASC');

        return $builder->get()->getResultArray();
    }

    public function getFlowDataLast14Days()
    {
        $fourteenDaysAgo = date('Y-m-d', strtotime('-14 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $fourteenDaysAgo) // ✅ เปลี่ยนเป็น datetime
                    ->where("TIME(datetime) = '07:00:00'")
                    ->orderBy('datetime', 'DESC')             // ✅ เปลี่ยนเป็น datetime
                    ->findAll();
    }

    public function updateFlowData(string $sta_code, string $date, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }

        $convertedDateTime = $this->convertDateFormat($date); // ✅ คืนค่าเป็น datetime พร้อมเวลา 07:00
        $builder = $this->db->table($this->table);

        $exists = $builder->where('sta_code', $sta_code)
                        ->where('datetime', $convertedDateTime) // ✅ เปลี่ยนเป็น datetime
                        ->get()
                        ->getRow();

        $fullData = array_merge($updateData, [
            'sta_code' => $sta_code,
            'datetime' => $convertedDateTime // ✅ เปลี่ยนเป็น datetime
        ]);

        if ($exists) {
            return $builder->where('sta_code', $sta_code)
                        ->where('datetime', $convertedDateTime) // ✅ เปลี่ยนเป็น datetime
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
            $datetime = $this->convertDateFormat($data['date']); // ✅ คืนค่าเป็น datetime พร้อมเวลา

            $updateData = $data;
            unset($updateData['sta_code'], $updateData['date']);

            if (empty($updateData)) {
                continue;
            }

            $builder = $this->db->table($this->table);

            $exists = $builder->where('sta_code', $sta_code)
                            ->where('datetime', $datetime) // ✅ เปลี่ยนเป็น datetime
                            ->get()
                            ->getRow();

            $fullData = array_merge($updateData, [
                'sta_code' => $sta_code,
                'datetime' => $datetime // ✅ เปลี่ยนเป็น datetime
            ]);

            if ($exists) {
                $updated = $builder->where('sta_code', $sta_code)
                                ->where('datetime', $datetime) // ✅ เปลี่ยนเป็น datetime
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
        $convertedDateTime = $this->convertDateFormat($date); // ✅ คืนค่าเป็น datetime พร้อมเวลา

        return (bool) $this->db->table($this->table)
            ->where('sta_code', $sta_code)
            ->where('datetime', $convertedDateTime) // ✅ เปลี่ยนเป็น datetime
            ->countAllResults();
    }

    // ✅ แก้ให้คืนค่าเป็น datetime string พร้อมเวลา 07:00:00 เสมอ
    private function convertDateFormat(string $date): string
    {
        // กรณีรับมาเป็น "j/n/Y" เช่น 28/2/2026
        $dateTime = \DateTime::createFromFormat('j/n/Y', $date);

        if ($dateTime) {
            return $dateTime->format('Y-m-d') . ' 07:00:00'; 
        }

        // กรณีรับมาเป็น "Y-m-d" อยู่แล้ว (เช่น จาก DB หรือ frontend)
        $dateTime = \DateTime::createFromFormat('Y-m-d', $date);
        if ($dateTime) {
            return $dateTime->format('Y-m-d') . ' 07:00:00'; 
        }

        // ถ้ารูปแบบไม่ตรงเลย ส่งค่าเดิมกลับไปตรงๆ (fallback)
        return $date;
    }
}