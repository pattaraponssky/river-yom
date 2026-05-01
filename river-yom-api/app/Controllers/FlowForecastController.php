<?php
// app/Controllers/FlowForecastController.php
namespace App\Controllers;

use App\Models\FlowForecastModel;
use CodeIgniter\RESTful\ResourceController;

class FlowForecastController extends ResourceController
{
    

private const STATION_MAPPING = [
    'Y.15'               => 170764,
    'Y.16'               => 142824,
    'Y.4'                => 125488,
    'Y.50'               => 84876,
    'Y.64'               => 55628,
    'ปตร.พลเทพ'          => 321863,
    'ปตร.ท่าโบสถ์'       => 293361,
    'ปตร.ชลมาร์คพิจารณ์' => 241714,
    'ปตร.โพธิ์พระยา'     => 204540,
];

private const BATCH_SIZE = 500; // insert ทีละกี่แถว

public function importFromCsv()
{
    ini_set('memory_limit', '512M');
    ini_set('max_execution_time', '300');
    set_time_limit(300);

    $csvPath = '/Users/dan/yom-river-rigth/web-river-yom/river-yom/public/ras-output/selected_ras.csv';

    if (!file_exists($csvPath)) {
        return $this->failNotFound("ไม่พบไฟล์ CSV: {$csvPath}");
    }

    try {
        $result = $this->streamImport($csvPath);

        return $this->respond([
            'status'       => 'success',
            'total_read'   => $result['total_read'],
            'matched'      => $result['matched'],
            'inserted'     => $result['inserted'],
            'updated'      => $result['updated'],
            'skipped'      => $result['skipped'],
            'date_range'   => $result['date_range'],
            'memory_used'  => round(memory_get_peak_usage(true) / 1024 / 1024, 2) . ' MB',
        ]);

    } catch (\Throwable $e) {
        log_message('error', 'importFromCsv error: ' . $e->getMessage());
        return $this->fail($e->getMessage());
    }
}

/**
 * อ่าน CSV ทีละบรรทัด ไม่โหลดทั้งไฟล์
 */
private function streamImport(string $csvPath): array
{
    $reverseMap = array_flip(self::STATION_MAPPING);
    $model      = new \App\Models\FlowForecastModel();

    $handle = fopen($csvPath, 'r');
    if (!$handle) {
        throw new \RuntimeException("ไม่สามารถเปิดไฟล์ได้");
    }

    // อ่าน header
    $rawHeader = fgetcsv($handle);
    if (!$rawHeader) {
        fclose($handle);
        throw new \RuntimeException("ไฟล์ CSV ว่างหรือไม่มี header");
    }

    // normalize header
    $headers = array_map(
        fn($h) => strtolower(str_replace([' ', "\xEF\xBB\xBF"], ['_', ''], trim($h))),
        $rawHeader
    );

    // หา index ของคอลัมน์ที่ต้องการ
    $idxDate     = array_search('date', $headers);
    $idxCross    = array_search('cross_section', $headers)
                ?? array_search('cross section', $headers);
    $idxWl       = array_search('water_elevation', $headers)
                ?? array_search('wl', $headers);

    if ($idxDate === false || $idxCross === false || $idxWl === false) {
        fclose($handle);
        throw new \RuntimeException(
            "ไม่พบคอลัมน์ที่ต้องการ headers: " . implode(', ', $headers)
        );
    }

    $stats = [
        'total_read' => 0,
        'matched'    => 0,
        'inserted'   => 0,
        'updated'    => 0,
        'skipped'    => 0,
        'date_range' => ['start' => null, 'end' => null],
    ];

    $batch = []; // buffer สำหรับ batch insert

    while (($line = fgetcsv($handle)) !== false) {
        $stats['total_read']++;

        // ข้ามแถวว่าง
        if (empty(array_filter($line))) continue;

        $crossSection = (int)trim($line[$idxCross] ?? 0);
        $staCode      = $reverseMap[$crossSection] ?? null;
        if (!$staCode) continue; // ไม่ตรง mapping

        $datetime = $this->parseDatetime(trim($line[$idxDate] ?? ''));
        if (!$datetime) continue;

        $wl = (float)trim($line[$idxWl] ?? 0);
        if ($wl === 0.0) continue;

        $date = substr($datetime, 0, 10);

        // track date range
        if (!$stats['date_range']['start'] || $date < $stats['date_range']['start']) {
            $stats['date_range']['start'] = $date;
        }
        if (!$stats['date_range']['end'] || $date > $stats['date_range']['end']) {
            $stats['date_range']['end'] = $date;
        }

        $stats['matched']++;

        $batch[] = [
            'sta_code'      => $staCode,
            'cross_section' => $crossSection,
            'date'          => $date,
            'datetime'      => $datetime,
            'wl'            => round($wl, 4),
            'is_forecast'   => 1,
        ];

        // flush เมื่อ batch เต็ม
        if (count($batch) >= self::BATCH_SIZE) {
            $r = $this->batchUpsert($model, $batch);
            $stats['inserted'] += $r['inserted'];
            $stats['updated']  += $r['updated'];
            $stats['skipped']  += $r['skipped'];
            $batch = []; // ล้าง buffer

            // คืน memory
            gc_collect_cycles();
        }
    }

    fclose($handle);

    // flush แถวที่เหลือ
    if (!empty($batch)) {
        $r = $this->batchUpsert($model, $batch);
        $stats['inserted'] += $r['inserted'];
        $stats['updated']  += $r['updated'];
        $stats['skipped']  += $r['skipped'];
    }

    return $stats;
}

/**
 * Batch upsert: ใช้ INSERT ... ON DUPLICATE KEY UPDATE
 * เร็วกว่า loop upsert ทีละแถวมาก
 */
private function batchUpsert(\App\Models\FlowForecastModel $model, array $rows): array
{
    if (empty($rows)) return ['inserted' => 0, 'updated' => 0, 'skipped' => 0];

    $db = \Config\Database::connect();

    // สร้าง placeholders
    $valueSets   = [];
    $bindings    = [];
    $now         = date('Y-m-d H:i:s');

    foreach ($rows as $row) {
        $valueSets[] = '(?, ?, ?, ?, ?, ?, ?, ?)';
        $bindings[]  = $row['sta_code'];
        $bindings[]  = $row['cross_section'];
        $bindings[]  = $row['date'];
        $bindings[]  = $row['datetime'];
        $bindings[]  = $row['wl'];
        $bindings[]  = $row['is_forecast'];
        $bindings[]  = $now; // created_at
        $bindings[]  = $now; // updated_at
    }

    $sql = "
        INSERT INTO flow_model
            (sta_code, cross_section, date, datetime, wl, is_forecast, created_at, updated_at)
        VALUES " . implode(',', $valueSets) . "
        ON DUPLICATE KEY UPDATE
            wl         = VALUES(wl),
            updated_at = VALUES(updated_at)
    ";

    $db->query($sql, $bindings);

    $affected = $db->affectedRows();

    // MySQL: affected=1 → insert, affected=2 → update, affected=0 → ไม่เปลี่ยน
    $inserted = 0;
    $updated  = 0;
    $skipped  = 0;

    // ประมาณการ (MySQL ไม่แยกละเอียดต่อ row ใน batch)
    if ($affected === 0) {
        $skipped  = count($rows);
    } elseif ($affected <= count($rows)) {
        $inserted = $affected;
        $skipped  = count($rows) - $affected;
    } else {
        // affected > count → บาง row update (นับเป็น 2)
        $updated  = $affected - count($rows);
        $inserted = count($rows) - $updated;
    }

    return compact('inserted', 'updated', 'skipped');
}

private function parseDatetime(string $dateStr): ?string
{
    if (!$dateStr) return null;

    // รูปแบบ: "dd/mm/yyyy HH:mm" หรือ "dd/mm/yyyy HH:mm:ss"
    if (preg_match(
        '/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/',
        $dateStr, $m
    )) {
        $year  = (int)$m[3] > 2500 ? (int)$m[3] - 543 : (int)$m[3];
        $month = str_pad((int)$m[2], 2, '0', STR_PAD_LEFT);
        $day   = str_pad((int)$m[1], 2, '0', STR_PAD_LEFT);
        $hour  = str_pad((int)$m[4], 2, '0', STR_PAD_LEFT);
        $min   = str_pad((int)$m[5], 2, '0', STR_PAD_LEFT);
        $sec   = str_pad((int)($m[6] ?? 0), 2, '0', STR_PAD_LEFT);
        return "{$year}-{$month}-{$day} {$hour}:{$min}:{$sec}";
    }

    // ISO format
    if (preg_match('/^\d{4}-\d{2}-\d{2}/', $dateStr)) {
        return date('Y-m-d H:i:s', strtotime($dateStr));
    }

    return null;
}

/**
 * Preview: อ่านแค่ 1,000 แถวแรก
 */
public function previewCsv()
{
    $csvPath = '/Users/dan/yom-river-rigth/web-river-yom/river-yom/public/ras-output/selected_ras.csv';
    if (!file_exists($csvPath)) {
        return $this->failNotFound("ไม่พบไฟล์ CSV");
    }

    $reverseMap = array_flip(self::STATION_MAPPING);
    $handle     = fopen($csvPath, 'r');
    $rawHeader  = fgetcsv($handle);
    $headers    = array_map(
        fn($h) => strtolower(str_replace([' ', "\xEF\xBB\xBF"], ['_', ''], trim($h))),
        $rawHeader
    );

    $idxDate  = array_search('date', $headers);
    $idxCross = array_search('cross_section', $headers)
             ?? array_search('cross section', $headers);
    $idxWl    = array_search('water_elevation', $headers)
             ?? array_search('wl', $headers);

    $summary    = [];
    $totalRead  = 0;
    $maxPreview = 2000; // อ่านแค่ 2000 แถวสำหรับ preview

    while (($line = fgetcsv($handle)) !== false && $totalRead < $maxPreview) {
        $totalRead++;
        if (empty(array_filter($line))) continue;

        $crossSection = (int)trim($line[$idxCross] ?? 0);
        $staCode      = $reverseMap[$crossSection] ?? null;
        if (!$staCode) continue;

        $datetime = $this->parseDatetime(trim($line[$idxDate] ?? ''));
        if (!$datetime) continue;

        $wl = (float)trim($line[$idxWl] ?? 0);

        if (!isset($summary[$staCode])) {
            $summary[$staCode] = [
                'sta_code'      => $staCode,
                'cross_section' => $crossSection,
                'count'         => 0,
                'min_datetime'  => $datetime,
                'max_datetime'  => $datetime,
                'min_wl'        => $wl,
                'max_wl'        => $wl,
            ];
        }

        $s = &$summary[$staCode];
        $s['count']++;
        if ($datetime < $s['min_datetime']) $s['min_datetime'] = $datetime;
        if ($datetime > $s['max_datetime']) $s['max_datetime'] = $datetime;
        if ($wl < $s['min_wl'])             $s['min_wl'] = $wl;
        if ($wl > $s['max_wl'])             $s['max_wl'] = $wl;
    }

    fclose($handle);

    return $this->respond([
        'status'        => 'success',
        'rows_scanned'  => $totalRead,
        'summary'       => array_values($summary),
        'file_size_mb'  => round(filesize($csvPath) / 1024 / 1024, 2),
    ]);
}
}