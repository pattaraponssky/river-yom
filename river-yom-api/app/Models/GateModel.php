<?php

namespace App\Models;

use CodeIgniter\Model;

class GateModel extends Model
{
    protected $table = 'gate_data';
    protected $allowedFields = ['sta_code', 'datetime', 'wl_upper', 'wl_lower', 'discharge', 'rain_mm']; // ✅ 'date' -> 'datetime'

    public function getGateInfo()
    {
        return $this->db->table('gate_info')->get()->getResultArray();
    }

    public function getGateDataByCode($sta_code)
    {
        return $this->db->table('gate_data')
            ->where('sta_code', $sta_code)
            ->get()
            ->getResultArray();
    }

    public function getActualGateData($sta_code, $date)
    {
        $datetime = $this->convertDateFormat($date); // ✅ แปลงเป็น datetime พร้อมเวลา 07:00

        return $this->where('sta_code', $sta_code)
                    ->where('datetime', $datetime) 
                    ->first();
    }

    public function getGateDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        return $this->db->table('gate_data')
            ->where('sta_code', $sta_code)
            ->where("YEAR(datetime) >=", $startYear) 
            ->where("YEAR(datetime) <=", $endYear)    
            ->orderBy('datetime', 'ASC')              
            ->get()
            ->getResultArray();
    }

    public function getGateDataLast7Days()
    {
        $sevenDaysAgo = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $sevenDaysAgo) 
                    ->orderBy('datetime', 'DESC')          
                    ->findAll();
    }

    public function getGateDataLast14Days()
    {
        $fourteenDaysAgo = date('Y-m-d', strtotime('-14 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $fourteenDaysAgo) 
                    ->orderBy('datetime', 'DESC')             
                    ->findAll();
    }

    public function updateGateData(string $sta_code, string $date, array $updateData)
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

    public function updateMultipleGateData(array $dataArray)
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

    public function findByStationAndDate(string $stationId, string $date)
    {
        $datetime = $this->convertDateFormat($date); // ✅

        return $this->where(['sta_code' => $stationId, 'datetime' => $datetime])->first(); // ✅
    }

    public function getGateDataLast8Days(array $stationCodes)
    {
        $today = date('Y-m-d') . ' 07:00:00'; // ✅ ระบุเวลา
        $startDate = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('sta_code, datetime, discharge') 
                    ->whereIn('sta_code', $stationCodes)
                    ->where('datetime >=', $startDate) 
                    ->where('datetime <=', $today)      
                    ->findAll();
    }

    public function getGateOpeningLast14Days()
    {
        return $this->db->query("
            SELECT
                g.datetime,
                g.sta_code,
                g.wl_upper,
                g.wl_lower,
                g.discharge,
                o.gate1_height,
                o.gate2_height,
                o.gate3_height,
                o.gate4_height,
                o.gate5_height,
                o.gate6_height
            FROM gate_data g
            LEFT JOIN gate_opening o
                ON g.sta_code = o.sta_code
                AND g.datetime = o.datetime
            WHERE g.datetime >= DATE_SUB(CURDATE(), INTERVAL 14 DAY) + INTERVAL 7 HOUR
            ORDER BY g.sta_code, g.datetime DESC
        ")->getResultArray();
    }
}