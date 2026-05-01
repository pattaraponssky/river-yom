<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ModelInputDataModel;
use App\Models\RainModel;
use App\Models\GateModel;

class ModelInputDataController extends ResourceController
{
    protected $modelName = 'App\Models\ModelInputDataModel';
    protected $format    = 'json';

    public function updateFromMain()
    {
        $inputModel = new ModelInputDataModel();
        $rainModel = new RainModel();
        $gateModel = new GateModel();

        $allRainStations = ['390220', '120142', '390022', '590042', '590082', '380012', '120160'];
        $allGateStations = ['tng', 'wst', 'Y.15', 'Y.16', 'Y.17', 'Y.4', 'Y.50', 'Y.51', 'Y.64'];

        try {
            $rainData = $rainModel->getRainDataLast7Days($allRainStations);
            $gateData = $gateModel->getGateDataLast8Days($allGateStations);
            
            $successfulUpdates = 0;

            // --- 3. ประมวลผล Rain Data ---
            if (!empty($rainData)) {
                foreach ($rainData as $item) {
                    $sta_code = str_pad($item['sta_code'], 6, '0', STR_PAD_LEFT);
                    $value = isset($item['rain_mm']) && $item['rain_mm'] !== '' ? (float) $item['rain_mm'] : null;
                    $date = (string) $item['date'];

                    // ✅ ถ้าเป็น NULL หรือไม่มีค่า ให้บันทึกเป็น NULL
                    $record = [
                        'sta_code'  => $sta_code,
                        'date' => $date,
                        'data_type' => 'rain',
                        'value'     => $value, // เก็บ null ได้
                    ];

                    if ($inputModel->upsertData($record, FALSE)) {
                        $successfulUpdates++;
                    }
                }
            }


            // --- 4. ประมวลผล Gate Data ---
            if (!empty($gateData)) {
                foreach ($gateData as $item) {
                    $sta_code = (string) ($item['sta_code'] ?? '');
                    $date = (string) ($item['date'] ?? '');
                    $value = isset($item['discharge']) && $item['discharge'] !== '' ? (float) $item['discharge'] : null;

                    // ✅ ถ้าค่าเป็น null หรือ 0 → พยายามดึงจาก actual data
                    if (($value === null || $value == 0) && !empty($sta_code) && !empty($date)) {
                        $actualData = $gateModel->getActualGateData($sta_code, $date);
                        if (!empty($actualData) && isset($actualData['discharge'])) {
                            $actualValue = $actualData['discharge'];
                            // ถ้ามีค่าจริงและไม่ใช่ null → ใช้แทน
                            if ($actualValue !== null && is_numeric($actualValue) && $actualValue > 0) {
                                $value = (float) $actualValue;
                            }
                        }
                    }

                    // ✅ ตอนบันทึก ไม่ต้องกรองออก ถ้าเป็น NULL ก็เก็บ NULL
                    $record = [
                        'sta_code'  => $sta_code,
                        'date' => $date,
                        'data_type' => 'flow',
                        'value'     => $value, // เก็บ null ได้
                    ];

                    if ($inputModel->upsertData($record, FALSE)) {
                        $successfulUpdates++;
                    }
                }
            }



            // --- 5. รวมสถานีใหม่จาก gateData ---
            if (!empty($gateData)) {
                foreach ($gateData as $item) {
                    $sta_code = (string) ($item['sta_code'] ?? '');
                    $date = (string) ($item['date'] ?? '');

                    $discharge = $item['discharge'] ?? null;
                    if (!is_numeric($discharge)) {
                        continue; // Skip if null, empty string, or non-numeric
                    }
                    $value = (float) $item['discharge'];

                    // 🔹 ถ้าค่า discharge เป็น 0 ให้ดึงจาก actual data
                    if ($value == 0) {
                        $actualData = $gateModel->getActualGateData($sta_code, $date);

                        if (!empty($actualData) && isset($actualData['discharge']) && $actualData['discharge'] !== null) {
                            $value = (float) $actualData['discharge'];
                        }
                    }

                    // 🔹 บันทึกเฉพาะค่ามากกว่า 0
                    if ($value > 0) {
                        $record = [
                            'sta_code'  => $sta_code,
                            'date' => $date,
                            'data_type' => 'flow',
                            'value'     => $value,
                        ];

                        if ($inputModel->upsertData($record, FALSE)) {
                            $successfulUpdates++;
                        }
                    }
                }

                // --- รวมสถานีใหม่ ---
                $gateGroups = [
                    'wst' => ['Y.15', 'Y.16'],
                ];

                $gateByDate = [];
                foreach ($gateData as $item) {
                    $date = $item['date'];
                    $sta = $item['sta_code'];
                    $val = (float) $item['discharge'];
                    if (!isset($gateByDate[$date])) {
                        $gateByDate[$date] = [];
                    }
                    $gateByDate[$date][$sta] = $val;
                }

                foreach ($gateByDate as $date => $stations) {
                    foreach ($gateGroups as $newStaCode => $group) {
                        $sum = 0;
                        foreach ($group as $sta) {
                            if (isset($stations[$sta]) && is_numeric($stations[$sta])) {
                                $sum += (float) $stations[$sta];
                            }
                        }

                        if ($sum > 0) {
                            $record = [
                                'sta_code'  => $newStaCode,
                                'date' => $date,
                                'data_type' => 'flow',
                                'value'     => $sum,
                            ];

                            if ($inputModel->upsertData($record, FALSE)) {
                                $successfulUpdates++;
                            }
                        }
                    }
                }
            }


            $dateThreshold = date('Y-m-d', strtotime('-30 days'));
            $inputModel->where('date <', $dateThreshold)->delete();

            return $this->respond([
                'status' => 'success',
                'message' => "Successfully updated {$successfulUpdates} records from main data models.",
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Error updating model input data from main models: ' . $e->getMessage());
            return $this->failServerError('Internal Server Error: Could not fetch or process data from main models. ' . $e->getMessage());
        }
    }
    
    /**
     * ดึงข้อมูล Input Data ทั้งหมดในช่วงวันที่ที่กำหนด
     * Endpoint: GET /api/model_input_data
     */
    public function index()
    {
        $rainDateKeys = [];
        $gateDateKeys = [];
        $today = date('Y-m-d');
        
        // 1. กำหนดช่วงวันที่ที่ต้องการ
        // Rain: 7 วันย้อนหลัง (ไม่รวมวันนี้)
        for ($i = -7; $i <= -1; $i++) {
            $rainDateKeys[] = date('Y-m-d', strtotime("{$today} {$i} days"));
        }
        // Gate: 8 วันย้อนหลัง (รวมวันนี้)
        for ($i = -7; $i <= 0; $i++) {
            $gateDateKeys[] = date('Y-m-d', strtotime("{$today} {$i} days"));
        }
        
        // 2. ดึงข้อมูลปริมาณน้ำฝน (rain)
        $rainData = $this->model
            ->where('data_type', 'rain')
            ->whereIn('date', $rainDateKeys)
            ->findAll();

        // 3. ดึงข้อมูลปริมาณน้ำท่า (gate)
        $gateData = $this->model
            ->where('data_type', 'flow')
            ->whereIn('date', $gateDateKeys)
            ->findAll();

        $allData = array_merge($rainData, $gateData);

        if (empty($allData)) {
            return $this->respond([
                'status' => 'success',
                'message' => 'No model input data found for the specified period.',
                'data' => []
            ], 200);
        }

        // 4. ส่งข้อมูลทั้งหมดกลับไป
        return $this->respond([
            'status' => 'success',
            'data' => $allData
        ]);
    }

    public function create()
    {
        $inputData = $this->request->getJSON(true); // รับ JSON Body เป็น Array

        if (empty($inputData) || !is_array($inputData)) {
            return $this->failValidationErrors('Invalid data format. Expected an array of records.');
        }

        $model = new ModelInputDataModel();
        $successfulSaves = 0;
        $errors = [];

        foreach ($inputData as $data) {
            // ตรวจสอบข้อมูลพื้นฐาน
            if (empty($data['sta_code']) || empty($data['date']) || empty($data['data_type']) || !isset($data['value'])) {
                $errors[] = "Missing required fields in a record.";
                continue;
            }

            // เตรียมข้อมูลสำหรับ UPSERT
            $record = [
                'sta_code'  => $data['sta_code'],
                'date' => $data['date'],
                'data_type' => $data['data_type'],
                'value'     => (float) $data['value'],
                'is_manual' => TRUE, // ตั้งค่าเป็น TRUE เพราะถูกส่งมาจากการป้อนด้วยมือ
            ];

            try {
                // ใช้ฟังก์ชัน upsertData ที่เราสร้างไว้ใน Model
                if ($model->upsertData($record)) {
                    $successfulSaves++;
                } else {
                    $errors[] = "Failed to save record for {$data['sta_code']} on {$data['date']}.";
                }
            } catch (\Exception $e) {
                // ดักจับข้อผิดพลาดของฐานข้อมูล
                $errors[] = "Database error for {$data['sta_code']}: " . $e->getMessage();
            }
        }

        if (empty($errors)) {
            return $this->respondCreated([
                'status' => 'success',
                'message' => "Successfully saved {$successfulSaves} records.",
            ]);
        } else {
            // ส่งข้อผิดพลาดบางส่วนกลับไป
            return $this->fail([
                'status' => 'error',
                'message' => "Saved {$successfulSaves} records with some errors.",
                'errors' => $errors
            ], 400); // 400 Bad Request
        }
    }
}
