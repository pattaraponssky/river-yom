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
        $today = date('Y-m-d');
        $result = [];

        foreach ($staCodes as $staCode) {

            // 1. ลองดึงข้อมูลเวลา 07:00 ของวันนี้ก่อน
            $data = $this->db->table($this->table)
                ->where('sta_code', $staCode)
                ->where('datetime', $today . ' 07:00:00')
                ->get()
                ->getRowArray();

            // 2. ถ้าไม่มีข้อมูล 07:00 ให้ดึงข้อมูลล่าสุดแทน
            if (empty($data)) {
                $data = $this->db->table($this->table)
                    ->where('sta_code', $staCode)
                    ->where('datetime <=', date('Y-m-d H:i:s'))
                    ->orderBy('datetime', 'DESC')
                    ->limit(1)
                    ->get()
                    ->getRowArray();
            }

            // 3. ถ้ามีข้อมูล ให้เพิ่มเข้า result
            if (!empty($data)) {
                $result[] = $data;
            }
        }

        return $result;
    }

    public function getTeleDataByCode($sta_code)
    {
        return $this->db->table('tele_data')
            ->where('sta_code', $sta_code)
            ->where("TIME(datetime)", '07:00:00')
            ->orderBy('datetime', 'ASC')
            ->get()
            ->getResultArray();
    }
    
    // public function getTeleDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    // {
        
    //     return $this->db->table('tele_data')
    //         ->select("DATE(datetime) as date, sta_code, wl, discharge, rain_mm")
    //         ->where('sta_code', $sta_code)
    //         ->where("YEAR(datetime) >=", $startYear)
    //         ->where("YEAR(datetime) <=", $endYear)
    //         ->where("TIME(datetime)", '07:00:00')
    //         ->orderBy('datetime', 'ASC')
    //         ->get()
    //         ->getResultArray();
    // }

    public function getTeleDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        $fromDate = ($startYear - 1) . '-12-31 00:00:00';
        $toDate   = $endYear . '-12-31 23:59:59';

        $sql = "
            SELECT
                d.sta_code,
                d.datetime,
                d.wl,
                d.discharge,
                COALESCE(r.rain_mm, 0) AS rain_mm
            FROM (
                -- wl / discharge: snapshot ใกล้ 07:00 ที่สุดของแต่ละวัน (เหมือน logic เดิมทุกอย่าง)
                SELECT *
                FROM (
                    SELECT t.*,
                        ABS(TIMESTAMPDIFF(SECOND, t.datetime,
                            TIMESTAMP(DATE(t.datetime), '07:00:00'))) AS diff_sec,
                        ROW_NUMBER() OVER (
                            PARTITION BY DATE(t.datetime)
                            ORDER BY ABS(TIMESTAMPDIFF(SECOND, t.datetime,
                                TIMESTAMP(DATE(t.datetime), '07:00:00')))
                        ) AS rn
                    FROM tele_data t
                    WHERE t.sta_code = ?
                    AND YEAR(t.datetime) BETWEEN ? AND ?
                ) snap
                WHERE rn = 1
            ) d
            LEFT JOIN (
                -- rain_mm: ผลรวมฝนรายชั่วโมง (diff) ของช่วง 07:00 เมื่อวาน ถึง 07:00 วันนี้
                SELECT
                    rain_day,
                    SUM(hourly_rain) AS rain_mm
                FROM (
                    SELECT
                        IF(TIME(hour_dt) <= '07:00:00', DATE(hour_dt), DATE(hour_dt) + INTERVAL 1 DAY) AS rain_day,
                        GREATEST(rain_mm - COALESCE(prev_rain_mm, 0), 0) AS hourly_rain
                    FROM (
                        SELECT
                            hour_dt,
                            rain_mm,
                            LAG(rain_mm) OVER (
                                PARTITION BY DATE(hour_dt)
                                ORDER BY hour_dt
                            ) AS prev_rain_mm
                        FROM (
                            SELECT t.*,
                                FROM_UNIXTIME(ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600) AS hour_dt,
                                ROW_NUMBER() OVER (
                                    PARTITION BY ROUND(UNIX_TIMESTAMP(t.datetime) / 3600)
                                    ORDER BY ABS(UNIX_TIMESTAMP(t.datetime) - ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600)
                                ) AS rn
                            FROM tele_data t
                            WHERE t.sta_code = ?
                            AND t.datetime BETWEEN ? AND ?
                        ) hourly_raw
                        WHERE rn = 1
                    ) with_prev
                ) hourly_diff
                GROUP BY rain_day
            ) r ON r.rain_day = DATE(d.datetime)
            ORDER BY d.datetime ASC
        ";

        return $this->db->query($sql, [
            $sta_code, $startYear, $endYear,
            $sta_code, $fromDate, $toDate,
        ])->getResultArray();
    }

    public function getTeleHourlyDataByCode($sta_code)
    {
        $sql = "
            SELECT sta_code, hour_dt AS datetime, wl, discharge, rain_mm
            FROM (
                SELECT t.*,
                    FROM_UNIXTIME(ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600) AS hour_dt,
                    ABS(UNIX_TIMESTAMP(t.datetime) - ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600) AS diff_sec,
                    ROW_NUMBER() OVER (
                        PARTITION BY ROUND(UNIX_TIMESTAMP(t.datetime) / 3600)
                        ORDER BY ABS(UNIX_TIMESTAMP(t.datetime) - ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600)
                    ) AS rn
                FROM tele_data t
                WHERE t.sta_code = ?
            ) ranked
            WHERE rn = 1
            ORDER BY hour_dt ASC
        ";
        return $this->db->query($sql, [$sta_code])->getResultArray();
    }

    public function getTeleHourlyDataByCodeAndYearRange($sta_code, $startYear, $endYear)
    {
        $sql = "
            SELECT sta_code, hour_dt AS datetime, wl, discharge,
                GREATEST(rain_mm - COALESCE(prev_rain_mm, 0), 0) AS rain_mm
            FROM (
                SELECT
                    sta_code,
                    hour_dt,
                    wl,
                    discharge,
                    rain_mm,
                    LAG(rain_mm) OVER (
                        PARTITION BY sta_code, DATE(hour_dt)
                        ORDER BY hour_dt
                    ) AS prev_rain_mm
                FROM (
                    SELECT t.*,
                        FROM_UNIXTIME(ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600) AS hour_dt,
                        ABS(UNIX_TIMESTAMP(t.datetime) - ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600) AS diff_sec,
                        ROW_NUMBER() OVER (
                            PARTITION BY ROUND(UNIX_TIMESTAMP(t.datetime) / 3600)
                            ORDER BY ABS(UNIX_TIMESTAMP(t.datetime) - ROUND(UNIX_TIMESTAMP(t.datetime) / 3600) * 3600)
                        ) AS rn
                    FROM tele_data t
                    WHERE t.sta_code = ?
                    AND YEAR(t.datetime) BETWEEN ? AND ?
                ) deduped
                WHERE rn = 1
            ) with_prev
            ORDER BY hour_dt ASC
        ";
        return $this->db->query($sql, [$sta_code, $startYear, $endYear])->getResultArray();
    }

    public function getTeleDataLast7Days()
    {
        $sevenDaysAgo = date('Y-m-d', strtotime('-7 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $sevenDaysAgo) 
                    ->where("TIME(datetime) = '07:00:00'")
                    ->orderBy('datetime', 'DESC')          
                    ->findAll();
    }

    public function getTeleDataLast14Days()
    {
        $fourteenDaysAgo = date('Y-m-d', strtotime('-14 days')) . ' 07:00:00'; // ✅ ระบุเวลา

        return $this->select('*')
                    ->where('datetime >=', $fourteenDaysAgo) 
                    ->where("TIME(datetime) = '07:00:00'")
                    ->orderBy('datetime', 'DESC')             
                    ->findAll();
    }

    public function getTeleRainDataLast7Days(array $staCodes): array
    {
        if (empty($staCodes)) {
            return [];
        }

        $startDate = date('Y-m-d 00:00:00', strtotime('-7 days'));
        $placeholders = implode(',', array_fill(0, count($staCodes), '?'));

        $sql = "
            SELECT
                sta_code,
                DATE(datetime) AS date,
                MAX(rain_mm) AS rainfall
            FROM tele_data
            WHERE sta_code IN ({$placeholders})
            AND datetime >= ?
            GROUP BY sta_code, DATE(datetime)
            ORDER BY date ASC
        ";

        $params = array_merge($staCodes, [$startDate]);

        return $this->db->query($sql, $params)->getResultArray();
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
