<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use App\Models\ModelInputDataModel;
use App\Models\RainModel;
use App\Models\GateModel;
use App\Models\FlowModel;

class ModelInputDataController extends ResourceController
{
    protected $modelName = 'App\Models\ModelInputDataModel';
    protected $format    = 'json';

    /**
     * แปลงค่า date ให้เหลือแค่ Y-m-d เสมอ
     * รองรับทั้ง '2026-04-14' และ '2026-04-14 07:00:00'
     */
    private function toDateOnly(?string $date): ?string
    {
        if (empty($date)) {
            return null;
        }
        return substr(trim($date), 0, 10);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/model_input_data/update-from-main
    // ─────────────────────────────────────────────────────────────
    public function updateFromMain()
    {
        $inputModel = new ModelInputDataModel();
        $rainModel  = new RainModel();
        $flowModel  = new FlowModel();
        $gateModel  = new GateModel();

        // สถานีที่ต้องดึง
        $allRainStations = ['390220', '120142', '390022', '590042', '590082', '380012', '12016'];
        $allFlowStations = ['Y.15', 'Y.16', 'Y.17', 'Y.4', 'Y.50', 'Y.51', 'Y.64'];
        $allGateStations = ['tng', 'wst'];

        try {
            $rainData = $rainModel->getRainDataModelLast7Days($allRainStations);
            $flowData = $flowModel->getFlowDataModelLast8Days($allFlowStations);
            $gateData = $gateModel->getGateDataModelLast8Days($allGateStations);

            $successfulUpdates = 0;

            // ─────────────────────────────────────────
            // 1. Rain Data
            // ─────────────────────────────────────────
            if (!empty($rainData)) {
                foreach ($rainData as $item) {
                    $sta_code = str_pad((string)($item['sta_code'] ?? ''), 6, '0', STR_PAD_LEFT);
                    $date     = $this->toDateOnly($item['date'] ?? null);
                    $value    = isset($item['rain_mm']) && $item['rain_mm'] !== '' && $item['rain_mm'] !== null
                                ? (float) $item['rain_mm']
                                : null;

                    if (!$sta_code || !$date) {
                        continue;
                    }

                    $record = [
                        'sta_code'  => $sta_code,
                        'date'      => $date,
                        'data_type' => 'rain',
                        'value'     => $value,
                    ];

                    if ($inputModel->upsertData($record, false)) {
                        $successfulUpdates++;
                    }
                }
            }

            // ─────────────────────────────────────────
            // 2. Flow Data (สถานี Y.*)
            // ─────────────────────────────────────────
            if (!empty($flowData)) {
                foreach ($flowData as $item) {
                    $sta_code = (string) ($item['sta_code'] ?? '');
                    $date     = $this->toDateOnly($item['date'] ?? null);
                    $value    = isset($item['discharge']) && $item['discharge'] !== '' && $item['discharge'] !== null
                                ? (float) $item['discharge']
                                : null;

                    // ถ้าค่าเป็น null หรือ 0 → พยายามดึงจาก actual data
                    if (($value === null || $value == 0) && $sta_code && $date) {
                        $actualData = $flowModel->getActualFlowData($sta_code, $date);
                        if (!empty($actualData) && isset($actualData['discharge'])) {
                            $actualValue = $actualData['discharge'];
                            if ($actualValue !== null && is_numeric($actualValue) && (float)$actualValue > 0) {
                                $value = (float) $actualValue;
                            }
                        }
                    }

                    if (!$sta_code || !$date) {
                        continue;
                    }

                    $record = [
                        'sta_code'  => $sta_code,
                        'date'      => $date,
                        'data_type' => 'flow',
                        'value'     => $value, // เก็บ null ได้
                    ];

                    if ($inputModel->upsertData($record, false)) {
                        $successfulUpdates++;
                    }
                }
            }

            // ─────────────────────────────────────────
            // 3. Gate Data (tng, wst)
            // ─────────────────────────────────────────
            if (!empty($gateData)) {
                foreach ($gateData as $item) {
                    $sta_code = (string) ($item['sta_code'] ?? '');
                    $date     = $this->toDateOnly($item['date'] ?? null);
                    $value    = isset($item['discharge']) && $item['discharge'] !== '' && $item['discharge'] !== null
                                ? (float) $item['discharge']
                                : null;

                    // ถ้าค่าเป็น null หรือ 0 → พยายามดึงจาก actual data
                    if (($value === null || $value == 0) && $sta_code && $date) {
                        $actualData = $gateModel->getActualGateData($sta_code, $date);
                        if (!empty($actualData) && isset($actualData['discharge'])) {
                            $actualValue = $actualData['discharge'];
                            if ($actualValue !== null && is_numeric($actualValue) && (float)$actualValue > 0) {
                                $value = (float) $actualValue;
                            }
                        }
                    }

                    if (!$sta_code || !$date) {
                        continue;
                    }

                    $record = [
                        'sta_code'  => $sta_code,
                        'date'      => $date,
                        'data_type' => 'flow',
                        'value'     => $value,
                    ];

                    if ($inputModel->upsertData($record, false)) {
                        $successfulUpdates++;
                    }
                }
            }

            // ─────────────────────────────────────────
            // 4. รวมสถานี wst = Y.15 + Y.16 (จาก flowData)
            // ─────────────────────────────────────────
            // if (!empty($flowData)) {
            //     $gateGroups = [
            //         'wst' => ['Y.15', 'Y.16'],
            //     ];

            //     // จัดกลุ่มตามวันที่
            //     $flowByDate = [];
            //     foreach ($flowData as $item) {
            //         $date = $this->toDateOnly($item['date'] ?? null);
            //         $sta  = (string) ($item['sta_code'] ?? '');
            //         $val  = isset($item['discharge']) && is_numeric($item['discharge'])
            //                 ? (float) $item['discharge']
            //                 : 0;

            //         if (!$date || !$sta) {
            //             continue;
            //         }

            //         if (!isset($flowByDate[$date])) {
            //             $flowByDate[$date] = [];
            //         }
            //         $flowByDate[$date][$sta] = $val;
            //     }

            //     foreach ($flowByDate as $date => $stations) {
            //         foreach ($gateGroups as $newStaCode => $group) {
            //             $sum = 0;
            //             foreach ($group as $sta) {
            //                 if (isset($stations[$sta]) && is_numeric($stations[$sta])) {
            //                     $sum += (float) $stations[$sta];
            //                 }
            //             }

            //             if ($sum > 0) {
            //                 $record = [
            //                     'sta_code'  => $newStaCode,
            //                     'date'      => $date,
            //                     'data_type' => 'flow',
            //                     'value'     => $sum,
            //                 ];

            //                 if ($inputModel->upsertData($record, false)) {
            //                     $successfulUpdates++;
            //                 }
            //             }
            //         }
            //     }
            // }

            // ─────────────────────────────────────────
            // 5. ลบข้อมูลเก่ากว่า 30 วัน
            // ─────────────────────────────────────────
            $dateThreshold = date('Y-m-d', strtotime('-30 days'));
            $inputModel->where('date <', $dateThreshold)->delete();

            return $this->respond([
                'status'  => 'success',
                'message' => "Successfully updated {$successfulUpdates} records from main data models.",
            ]);

        } catch (\Exception $e) {
            log_message('error', 'Error updating model input data from main models: ' . $e->getMessage());
            return $this->failServerError(
                'Internal Server Error: Could not fetch or process data from main models. ' . $e->getMessage()
            );
        }
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/model_input_data
    // ─────────────────────────────────────────────────────────────
    public function index()
    {
        $today = date('Y-m-d');

        // Rain: 7 วันย้อนหลัง (ไม่รวมวันนี้)
        $rainDateKeys = [];
        for ($i = -7; $i <= -1; $i++) {
            $rainDateKeys[] = date('Y-m-d', strtotime("{$today} {$i} days"));
        }

        // Flow / Gate: 8 วันย้อนหลัง (รวมวันนี้)
        $flowDateKeys = [];
        for ($i = -7; $i <= 0; $i++) {
            $flowDateKeys[] = date('Y-m-d', strtotime("{$today} {$i} days"));
        }

        $rainData = $this->model
            ->where('data_type', 'rain')
            ->whereIn('date', $rainDateKeys)
            ->findAll();

        $flowData = $this->model
            ->where('data_type', 'flow')
            ->whereIn('date', $flowDateKeys)
            ->findAll();

        $allData = array_merge($rainData, $flowData);

        if (empty($allData)) {
            return $this->respond([
                'status'  => 'success',
                'message' => 'No model input data found for the specified period.',
                'data'    => [],
            ], 200);
        }

        return $this->respond([
            'status' => 'success',
            'data'   => $allData,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/model_input_data  (manual input)
    // ─────────────────────────────────────────────────────────────
    public function create()
    {
        $inputData = $this->request->getJSON(true);

        if (empty($inputData) || !is_array($inputData)) {
            return $this->failValidationErrors('Invalid data format. Expected an array of records.');
        }

        $model            = new ModelInputDataModel();
        $successfulSaves  = 0;
        $errors           = [];

        foreach ($inputData as $data) {
            if (empty($data['sta_code']) || empty($data['date']) || empty($data['data_type']) || !isset($data['value'])) {
                $errors[] = 'Missing required fields in a record.';
                continue;
            }

            $record = [
                'sta_code'  => $data['sta_code'],
                'date'      => $this->toDateOnly($data['date']),
                'data_type' => $data['data_type'],
                'value'     => (float) $data['value'],
                'is_manual' => true,
            ];

            try {
                if ($model->upsertData($record, true)) {
                    $successfulSaves++;
                } else {
                    $errors[] = "Failed to save record for {$data['sta_code']} on {$data['date']}.";
                }
            } catch (\Exception $e) {
                $errors[] = "Database error for {$data['sta_code']}: " . $e->getMessage();
            }
        }

        if (empty($errors)) {
            return $this->respondCreated([
                'status'  => 'success',
                'message' => "Successfully saved {$successfulSaves} records.",
            ]);
        }

        return $this->fail([
            'status'  => 'error',
            'message' => "Saved {$successfulSaves} records with some errors.",
            'errors'  => $errors,
        ], 400);
    }
}