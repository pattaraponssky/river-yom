<?php
// app/Models/FlowForecastModel.php
namespace App\Models;
use CodeIgniter\Model;

class FlowForecastModel extends Model
{
    protected $table      = 'flow_forecast';
    protected $primaryKey = 'id';

    protected $allowedFields = [
        'sta_code', 'cross_section', 'date', 'datetime',
        'wl', 'is_forecast',
    ];

    protected $useTimestamps = true;

    /**
     * Upsert: insert หรือ update ถ้ามีอยู่แล้ว
     */
    public function upsertForecast(array $rows): array
    {
        $inserted = 0;
        $updated  = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            $existing = $this
                ->where('sta_code', $row['sta_code'])
                ->where('datetime', $row['datetime'])
                ->first();

            if ($existing) {
                // อัปเดตเฉพาะถ้าค่าต่างกัน
                if ((float)$existing['wl'] !== (float)$row['wl']) {
                    $this->update($existing['id'], [
                        'wl'         => $row['wl'],
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
                    $updated++;
                } else {
                    $skipped++;
                }
            } else {
                $this->insert($row);
                $inserted++;
            }
        }

        return compact('inserted', 'updated', 'skipped');
    }

    /**
     * ดึงข้อมูลพยากรณ์ตามช่วงวันที่
     */
    public function getForecastByRange(
        string $startDate,
        string $endDate,
        ?string $staCode = null
    ): array {
        $builder = $this
            ->where('date >=', $startDate)
            ->where('date <=', $endDate)
            ->orderBy('sta_code', 'ASC')
            ->orderBy('datetime', 'ASC');

        if ($staCode) {
            $builder->where('sta_code', $staCode);
        }

        return $builder->findAll();
    }

    /**
     * ดึงข้อมูลล่าสุดแต่ละสถานี
     */
    public function getLatestForecast(): array
    {
        return $this->db->query("
            SELECT f.*
            FROM flow_forecast f
            INNER JOIN (
                SELECT sta_code, MAX(datetime) AS max_dt
                FROM flow_forecast
                GROUP BY sta_code
            ) latest ON f.sta_code = latest.sta_code
                     AND f.datetime = latest.max_dt
            ORDER BY f.sta_code
        ")->getResultArray();
    }
}