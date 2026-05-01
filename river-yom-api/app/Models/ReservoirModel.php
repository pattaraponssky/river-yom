<?php

namespace App\Models;

use CodeIgniter\Model;

class ReservoirModel extends Model
{
    protected $table = 'reservoir_data'; // ชื่อตารางจริงในฐานข้อมูลของคุณ
    protected $allowedFields = ['res_code', 'date', 'volume', 'inflow', 'outflow']; // กำหนดฟิลด์ที่แก้ไขได้ (ถ้าจำเป็น)

  

    // เมธอดสำหรับดึงข้อมูลจาก reservoir_data โดยใช้ res_code
    public function getReservoirDataByCode($res_code)
    {
        return $this->db->table('reservoir_data')
            ->where('res_code', $res_code)
            ->get()
            ->getResultArray();
    }

    // เมธอดสำหรับดึงข้อมูลร่วมกันระหว่าง reservoir_info และ reservoir_data
    public function getReservoirRCByCode($res_code)
    {
        return $this->db->table('reservoir_rc')
            ->where('res_code', $res_code)
            ->get()
            ->getResultArray();
    }

    // ดึงข้อมูลจาก reservoir_data ตาม res_code และช่วงปี
    public function getReservoirDataByCodeAndYearRange($res_code, $startYear, $endYear)
    {
        return $this->db->table('reservoir_data')
            ->where('res_code', $res_code)
            ->where("YEAR(date) >=", $startYear)
            ->where("YEAR(date) <=", $endYear)
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getReservoirRCByCodeAndYearRange($res_code, $startYear, $endYear)
    {
        return $this->db->table('reservoir_rc')
            ->where('res_code', $res_code)
            ->where("YEAR(date) >=", $startYear)
            ->where("YEAR(date) <=", $endYear)
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();
    }

    public function getReservoirDataLast7Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 7 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-7 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }

    public function getReservoirDataLast14Days()
    {
        // สมมติ field วันเก็บข้อมูลชื่อ 'date' และข้อมูลเรียงตามวันที่
        // เอาข้อมูล 14 วันล่าสุดจากทุกอ่าง
        return $this->select('*')
                    ->where('date >=', date('Y-m-d', strtotime('-14 days')))
                    ->orderBy('date', 'DESC')
                    ->findAll();
    }
    // ฟังก์ชันสำหรับอัปเดตข้อมูล 1 รายการ
    public function updateReservoirData(string $res_code, string $date, array $updateData)
    {
        if (empty($updateData)) {
            throw new \InvalidArgumentException("No data to update");
        }

        // แปลงวันที่จาก d/m/Y เป็น Y-m-d
        $convertedDate = $this->convertDateFormat($date);

        $builder = $this->db->table($this->table);

        $exists = $builder->where('res_code', $res_code)
                        ->where('date', $convertedDate)
                        ->get()
                        ->getRow();

        $fullData = array_merge($updateData, [
            'res_code' => $res_code,
            'date' => $convertedDate
        ]);

        if ($exists) {
            return $builder->where('res_code', $res_code)
                        ->where('date', $convertedDate)
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
            $date = $this->convertDateFormat($data['date']); // ✅ แปลงรูปแบบวันที่

            $updateData = $data;
            unset($updateData['res_code'], $updateData['date']);

            if (empty($updateData)) {
                continue;
            }

            $builder = $this->db->table($this->table);

            $exists = $builder->where('res_code', $res_code)
                            ->where('date', $date)
                            ->get()
                            ->getRow();

            $fullData = array_merge($updateData, [
                'res_code' => $res_code,
                'date' => $date
            ]);

            if ($exists) {
                $updated = $builder->where('res_code', $res_code)
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

    public function recordExists(string $res_code, string $date): bool
    {
        $convertedDate = $this->convertDateFormat($date);
    
        return (bool) $this->db->table($this->table)
            ->where('res_code', $res_code)
            ->where('date', $convertedDate)
            ->countAllResults();
    }

    private function convertDateFormat(string $date): string
    {
        // แปลง 5/1/2023 -> 2023-01-05
        $dateTime = \DateTime::createFromFormat('j/n/Y', $date);
        return $dateTime ? $dateTime->format('Y-m-d') : $date; // ถ้าแปลงไม่ได้ก็คืนค่าตามเดิม
    }


}
