<?php

namespace App\Models;

use CodeIgniter\Model;

class ReservoirModel extends Model
{
    protected $table = 'reservoir_data';
    protected $allowedFields = ['res_code', 'datetime', 'volume', 'inflow', 'outflow']; 

    public function getReservoirDataByCode($res_code)
    {
        return $this->db->table('reservoir_data')
            ->where('res_code', $res_code)
            ->get()
            ->getResultArray();
    }

    public function getReservoirRCByCode($res_code)
    {
        return $this->db->table('reservoir_rc')
            ->where('res_code', $res_code)
            ->get()
            ->getResultArray();
    }

    public function getReservoirDataByCodeAndYearRange($res_code, $startYear, $endYear)
    {
        return $this->db->table('reservoir_data')
            ->where('res_code', $res_code)
            ->where("YEAR(datetime) >=", $startYear)
            ->where("YEAR(datetime) <=", $endYear)   
            ->orderBy('datetime', 'ASC')             
            ->get()
            ->getResultArray();
    }

    public function getReservoirRCByCodeAndYearRange($res_code, $startYear, $endYear)
    {
        // ⚠️ ตาราง reservoir_rc — ถ้ายังใช้ column 'date' เดิม (ไม่ได้เปลี่ยนเป็น datetime)
        // ให้คงบรรทัดนี้ไว้แบบเดิม ไม่ต้องแก้ ดูหมายเหตุด้านล่าง
        return $this->db->table('reservoir_rc')
            ->where('res_code', $res_code)
            ->where("YEAR(datetime) >=", $startYear)
            ->where("YEAR(datetime) <=", $endYear)
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getReservoirDataLast7Days()
    {
        $sevenDaysAgo = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $sevenDaysAgo)
                    ->orderBy('datetime', 'DESC')         
                    ->findAll();
    }

    public function getReservoirDataLast14Days()
    {
        $fourteenDaysAgo = date('Y-m-d', strtotime('-14 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $fourteenDaysAgo)
                    ->orderBy('datetime', 'DESC')            
                    ->findAll();
    }

    public function updateReservoirData(string $res_code, string $date, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }

        $convertedDateTime = $this->convertDateFormat($date); 

        $builder = $this->db->table($this->table);

        $exists = $builder->where('res_code', $res_code)
                        ->where('datetime', $convertedDateTime) // ✅
                        ->get()
                        ->getRow();

        $fullData = array_merge($updateData, [
            'res_code' => $res_code,
            'datetime' => $convertedDateTime // ✅
        ]);

        if ($exists) {
            return $builder->where('res_code', $res_code)
                        ->where('datetime', $convertedDateTime) // ✅
                        ->update($updateData);
        } else {
            return $builder->insert($fullData);
        }
    }

    public function updateMultipleReservoirData(array $dataArray)
    {
        $updatedCount = 0;

        foreach ($dataArray as $data) {
            if (!isset($data['res_code']) || !isset($data['date'])) {
                continue;
            }

            $res_code = $data['res_code'];
            $datetime = $this->convertDateFormat($data['date']); // ✅

            $updateData = $data;
            unset($updateData['res_code'], $updateData['date']);

            if (empty($updateData)) {
                continue;
            }

            $builder = $this->db->table($this->table);

            $exists = $builder->where('res_code', $res_code)
                            ->where('datetime', $datetime) // ✅
                            ->get()
                            ->getRow();

            $fullData = array_merge($updateData, [
                'res_code' => $res_code,
                'datetime' => $datetime // ✅
            ]);

            if ($exists) {
                $updated = $builder->where('res_code', $res_code)
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

    public function recordExists(string $res_code, string $date): bool
    {
        $convertedDateTime = $this->convertDateFormat($date); // ✅

        return (bool) $this->db->table($this->table)
            ->where('res_code', $res_code)
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