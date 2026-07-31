<?php

namespace App\Models;

use CodeIgniter\Model;

class RainModel extends Model
{
    protected $table = 'rain_data';
    protected $allowedFields = ['sta_code', 'datetime', 'rain_mm']; 

    public function getRainInfo()
    {
        return $this->db->table('rain_info')->get()->getResultArray();
    }

    public function getRainDataByCode($sta_code)
    {
        return $this->db->table('rain_data')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    public function getRainDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('rain_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear) 
            ->where("YEAR(datetime) <=", $endYear)    
            ->orderBy('datetime', 'ASC')              
            ->get()
            ->getResultArray();
    }

    public function getRainDataLast7Days()
    {
        $sevenDaysAgo = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $sevenDaysAgo) 
                    ->orderBy('datetime', 'DESC')          
                    ->findAll();
    }

    public function getRainDataLast14Days()
    {
        $fourteenDaysAgo = date('Y-m-d', strtotime('-14 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $fourteenDaysAgo) 
                    ->orderBy('datetime', 'DESC')             
                    ->findAll();
    }

    public function updateRainData(string $sta_code, string $date, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }

        $convertedDateTime = $this->convertDateFormat($date); // ✅ คืนค่าพร้อมเวลา 07:00
        $builder = $this->db->table($this->table);

        $exists = $builder->where('sta_code', $sta_code)
                        ->where('datetime', $convertedDateTime) // ✅
                        ->get()
                        ->getRow();

        $fullData = array_merge($updateData, [
            'sta_code' => $sta_code,
            'datetime' => $convertedDateTime // ✅
        ]);

        if ($exists) {
            return $builder->where('sta_code', $sta_code)
                        ->where('datetime', $convertedDateTime) // ✅
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
            $datetime = $this->convertDateFormat($data['date']); // ✅

            $updateData = $data;
            unset($updateData['sta_code'], $updateData['date']);

            if (empty($updateData)) {
                continue;
            }

            $builder = $this->db->table($this->table);

            $exists = $builder->where('sta_code', $sta_code)
                            ->where('datetime', $datetime) // ✅
                            ->get()
                            ->getRow();

            $fullData = array_merge($updateData, [
                'sta_code' => $sta_code,
                'datetime' => $datetime // ✅
            ]);

            if ($exists) {
                $updated = $builder->where('sta_code', $sta_code)
                                ->where('datetime', $datetime) // ✅
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
        $convertedDateTime = $this->convertDateFormat($date); // ✅

        return (bool) $this->db->table($this->table)
            ->where('sta_code', $sta_code)
            ->where('datetime', $convertedDateTime) // ✅
            ->countAllResults();
    }

    // ✅ คืนค่าเป็น datetime string พร้อมเวลา 07:00:00 เสมอ
    private function convertDateFormat(string $date): string
    {
        $dateTime = \DateTime::createFromFormat('j/n/Y', $date);
        if ($dateTime) {
            return $dateTime->format('Y-m-d') . ' 07:00:00'; // ✅
        }

        $dateTime = \DateTime::createFromFormat('Y-m-d', $date);
        if ($dateTime) {
            return $dateTime->format('Y-m-d') . ' 07:00:00'; // ✅
        }

        return $date; // fallback
    }
}