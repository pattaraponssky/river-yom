<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use App\Models\FlowForecastModel;
use CodeIgniter\API\ResponseTrait;

class FlowForecast extends BaseController
{
    use ResponseTrait;
    protected $model;
    private $sectionMapping = [
        'Y.50'   => 84876,
        'Y.15'  => 194202,
        'Y.16'  => 142824,
        'Y.64'  => 55827,
        'Y.4'  => 125488,
    ];

    public function __construct()
    {
        $this->model = new FlowForecastModel();
        ini_set('memory_limit', '1024M');     // 1GB ก็ยังถูก
        set_time_limit(1800);                 // 30 นาที
        error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING); // ปิด warning ที่ไม่จำเป็น
    }

    // === 1. รับข้อมูลแบบ JSON (แบบเดิม) ===
    public function create()
    {
        $input = $this->request->getJSON(true);

        if (!$input) {
            return $this->fail('Invalid or empty JSON body', 400);
        }

        $records = is_array($input) && isset($input[0]) ? $input : [$input];

        $toInsert = [];
        $errors   = [];
        $duplicates = [];

        foreach ($records as $idx => $row) {
            $rules = [
                'sta_code'  => 'required|max_length[20]',
                'datetime'  => 'required|valid_date[Y-m-d H:i:s]',
                'wl'        => 'permit_empty|decimal',
                'discharge' => 'permit_empty|decimal',
            ];

            if (!$this->validateData($row, $rules)) {
                $errors[] = ['index' => $idx, 'error' => $this->validator->getErrors()];
                continue;
            }

            $data = [
                'sta_code'  => $row['sta_code'],
                'datetime'  => $row['datetime'],
                'wl'        => $row['wl'] ?? null,
                'discharge' => $row['discharge'] ?? null,
            ];

            if ($this->model->where($data)->countAllResults() > 0) {
                $duplicates[] = $data;
                continue;
            }

            $toInsert[] = $data;
        }

        if (empty($toInsert)) {
            $resp = ['status' => 'no_data', 'message' => 'ไม่มีข้อมูลใหม่ให้บันทึก'];
            if ($errors) $resp['validation_errors'] = $errors;
            if ($duplicates) $resp['duplicates_skipped'] = $duplicates;
            return $this->respond($resp);
        }

        $this->model->insertBatch($toInsert);

        return $this->respondCreated([
            'status'            => 'success',
            'inserted'          => count($toInsert),
            'duplicates_skipped' => count($duplicates),
            'message'           => 'บันทึกข้อมูลพยากรณ์เรียบร้อย'
        ]);
    }

    public function csv()
    {
        $file = $this->request->getFile('csvfile');

        if (!$file || !$file->isValid()) {
            return $this->fail('กรุณาอัปโหลดไฟล์ CSV', 400);
        }

        if ($file->getClientExtension() !== 'csv') {
            return $this->fail('ไฟล์ต้องเป็นนามสกุล .csv เท่านั้น', 400);
        }

        $stream = $file->openFile('r');
        if (!$stream) {
            return $this->fail('ไม่สามารถอ่านไฟล์ได้', 500);
        }

        // ข้าม header
        $header = $stream->fgetcsv();
        if (!$header || count($header) < 5) {
            return $this->fail('รูปแบบ CSV ไม่ถูกต้อง (ต้องมีอย่างน้อย 5 คอลัมน์)', 400);
        }

        $reverseMap = array_flip($this->sectionMapping); // Cross Section → sta_code

        $insertData = [];
        $totalRows = 0;
        $imported = 0;

        while (($row = $stream->fgetcsv()) !== false) {
            $totalRows++;

            if (count($row) < 5) continue;

            $dateStr        = trim($row[0]); // 17/11/2025 07:00
            $crossSection   = trim($row[3]); // ตัวเลข Cross Section
            $wl             = trim($row[4]); // Water Elevation

            // แปลงวันที่ d/m/Y H:i → Y-m-d H:i:s
            $dt = \DateTime::createFromFormat('d/m/Y H:i', $dateStr);
            if (!$dt) {
                continue; // รูปแบบวันที่ผิด
            }
            $datetime = $dt->format('Y-m-d H:i:s');

            // ตรวจว่า Cross Section นี้อยู่ใน mapping หรือไม่
            if (!isset($reverseMap[$crossSection])) {
                continue; // ไม่สนใจ
            }

            $sta_code = $reverseMap[$crossSection];

            $record = [
                'sta_code'  => $sta_code,
                'datetime'  => $datetime,
                'wl'        => $wl !== '' ? (float)$wl : null,
                'discharge' => null
            ];

            // ป้องกันซ้ำ (optional)
            if ($this->model->where($record)->countAllResults() === 0) {
                $insertData[] = $record;
                $imported++;
            }
        }

        if (empty($insertData)) {
            return $this->respond([
                'status' => 'warning',
                'message' => 'ไม่พบข้อมูล Section ที่ต้องการนำเข้า',
                'rows_scanned' => $totalRows
            ]);
        }

        $this->model->insertBatch($insertData);

        return $this->respondCreated([
            'status'        => 'success',
            'message'       => 'นำเข้า CSV เรียบร้อย',
            'total_rows'    => $totalRows,
            'imported_rows' => $imported,
            'stations'      => array_values(array_unique(array_column($insertData, 'sta_code')))
        ]);
    }
    public function importFromRasCsv()
    {
        // เส้นทางไฟล์ที่กรองแล้วจาก Python
        $csvFile = 'C:/xampp/htdocs/ras-output/filtered/output_ras_filtered.csv';

        if (!is_file($csvFile)) {
            return $this->respond([
                'status'  => 'error',
                'message' => 'ไม่พบไฟล์ CSV ที่กรองแล้ว',
                'file'    => $csvFile
            ], 404);
        }

        try {
            $imported = $this->processRasCsvFile($csvFile);

            return $this->respondCreated([
                'status'        => 'success',
                'message'       => 'นำเข้าข้อมูลพยากรณ์จาก RAS เรียบร้อย',
                'imported_rows' => $imported,
                'file'          => basename($csvFile),
                'imported_at'   => date('Y-m-d H:i:s')
            ]);

        } catch (\Exception $e) {
            log_message('error', '[FlowForecast] Import failed: ' . $e->getMessage());
            return $this->respond([
                'status'  => 'error',
                'message' => 'เกิดข้อผิดพลาดในการนำเข้า: ' . $e->getMessage(),
                'file'    => $csvFile
            ], 500);
        }
    }

    private function processRasCsvFile(string $filePath): int
    {
        $file = new \SplFileObject($filePath, 'r');
        $file->setFlags(
            \SplFileObject::READ_CSV |
            \SplFileObject::SKIP_EMPTY |
            \SplFileObject::READ_AHEAD |
            \SplFileObject::DROP_NEW_LINE
        );

        // ข้าม header
        $file->fseek(1);

        $imported   = 0;
        $batch      = [];
        $batchSize  = 5000; // ปรับตามขนาดไฟล์ (5000 ปลอดภัยและเร็ว)
        $reverseMap = array_flip($this->sectionMapping); // 194202 => Y.15

        $this->model->transBegin();

        foreach ($file as $row) {
            if ($row === null || count($row) < 5) {
                continue;
            }

            $crossSection = trim($row[3]);
            if (!isset($reverseMap[$crossSection])) {
                continue; // ข้ามถ้า Cross Section ไม่ตรง (ควรไม่มี เพราะ Python กรองแล้ว)
            }

            $dt = \DateTime::createFromFormat('d/m/Y H:i', trim($row[0]));
            if (!$dt) {
                continue;
            }

            $batch[] = [
                'sta_code'   => $reverseMap[$crossSection],
                'datetime'   => $dt->format('Y-m-d H:i:s'),
                'wl'         => $row[4] !== '' ? (float)$row[4] : null,
                'discharge'  => null
            ];

            if (count($batch) >= $batchSize) {
                $this->model->upsertBatch($batch);
                $imported += count($batch);
                $batch = [];
                if ($this->model->transStatus()) {
                    $this->model->transCommit();
                    $this->model->transBegin();
                } else {
                    $this->model->transRollback();
                    throw new \Exception('Transaction failed during batch insert');
                }
            }
        }

        if (!empty($batch)) {
            $this->model->upsertBatch($batch);
            $imported += count($batch);
        }

        if ($this->model->transStatus()) {
            $this->model->transCommit();
        } else {
            $this->model->transRollback();
            throw new \Exception('Final transaction failed');
        }

        return $imported;
    }

    public function flowForecastData($sta_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); 
            $endYear = $this->request->getGet('endYear');    

            $model = new FlowForecastModel();

            if ($startYear && $endYear) {
                $data = $model->getFlowForecastDataByCodeAndYearRange($sta_code, $startYear, $endYear);
            } else {
                $data = $model->getFlowForecastDataByCode($sta_code);
            }

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลสถานีที่ระบุ'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }
}