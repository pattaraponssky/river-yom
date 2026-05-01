<?php

namespace App\Models;

use CodeIgniter\Model;

class RainModel extends Model
{
    protected $table = 'rain_data'; // ชื่อตารางจริงในฐานข้อมูลของคุณ
    protected $allowedFields = ['sta_code', 'date', 'rain_mm']; 
    
      public function getRainInfo()
    {
        return $this->db->table('rain_info')->get()->getResultArray();
    }

    // เมธอดสำหรับดึงข้อมูลจาก rain_data โดยใช้ sta_code
    public function getRainDataByCode($sta_code)
    {
        return $this->db->table('rain_data')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    // ดึงข้อมูลจาก rain_data ตาม sta_code และช่วงปี
    public function getRainDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('rain_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(date) >=", $startYear)
            ->where("YEAR(date) <=", $endYear)
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getRainDataLast7Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 7 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-7 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }

    public function getRainDataLast14Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 14 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-14 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }

    public function updateRainData(string $sta_code, string $date, array $updateData)
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

    public function updateMultipleRainData(array $dataArray)
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
