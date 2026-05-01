<?php
namespace App\Controllers;
use CodeIgniter\Controller;
use Config\Database;
use App\Models\GateModel;

class GateAPI extends Controller
{
    public function gate_info()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            
            // ตรวจสอบการเชื่อมต่อโดยการดึงข้อมูลจากตารางใดตารางหนึ่ง
            $builder = $db->table('gate_info');
            $query = $builder->get();

            // ถ้าผ่านการเชื่อมต่อและมีข้อมูลในตาราง
            if ($query->getNumRows() > 0) {
                $gate_info = $query->getResultArray();  // ดึงข้อมูลเป็น array
                
                // ส่งข้อมูลในรูปแบบ JSON
                return $this->response->setJSON([
                    'data' => $gate_info
                ]);
            } else {
                // ไม่มีข้อมูลในตาราง
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลในตาราง gate_info.'
                ]);
            }
        } catch (\Exception $e) {
            // หากมีข้อผิดพลาดในการเชื่อมต่อ
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Connection Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function gateData($sta_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); // ?startYear=2022
            $endYear = $this->request->getGet('endYear');     // ?endYear=2024

            $model = new GateModel();

            if ($startYear && $endYear) {
                $data = $model->getGateDataByCodeAndYearRange($sta_code, $startYear, $endYear);
            } else {
                $data = $model->getGateDataByCode($sta_code);
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

    public function gate_years()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            $builder = $db->table('gate_data');

            // รับค่า sta_code จาก GET parameter
            $sta_code = $this->request->getGet('sta_code');  // รหัสสถานี

            // ตรวจสอบและเพิ่มเงื่อนไขการค้นหา
            if ($sta_code) {
                $builder->where('sta_code', $sta_code);
            }

            // ดึงปีที่มีข้อมูลจากฟิลด์ `date` (ใช้ YEAR(date))
            $builder->select('DISTINCT YEAR(date) AS year');
            $builder->orderBy('year', 'DESC');  // เรียงลำดับจากปีล่าสุด

            // ดึงข้อมูลจากฐานข้อมูล
            $query = $builder->get();

            // ตรวจสอบว่ามีข้อมูลหรือไม่
            if ($query->getNumRows() > 0) {
                $years = [];
                // แปลงข้อมูลเป็น Array และดึงเฉพาะปี
                foreach ($query->getResultArray() as $row) {
                    $years[] = $row['year'];
                }

                // ส่งข้อมูลปีในรูปแบบ JSON
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $years
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขที่ระบุ'
                ]);
            }
        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function gateDataLast7Days()
    {
        try {
            $model = new GateModel();

            $data = $model->getGateDataLast7Days();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลสถานีในช่วง 7 วันล่าสุด'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function gateDataLast14Days()
    {
        try {
            $model = new GateModel();

            $data = $model->getGateDataLast14Days();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลสถานีในช่วง 14 วันล่าสุด'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function updateData()
    {
        $model = new GateModel();
        $input = $this->request->getJSON(true); // รับข้อมูล JSON แปลงเป็น array

        if (isset($input[0]) && is_array($input)) {
            // ข้อมูลหลายแถว
            $count = $model->updateMultipleGateData($input);
            return $this->response->setJSON(['updated' => $count]);
        } else if (is_array($input)) {
            // ข้อมูลแถวเดียว
            if (!isset($input['sta_code']) || !isset($input['date'])) {
                return $this->response->setStatusCode(400, 'Missing sta_code or date');
            }

            $sta_code = $input['sta_code'];
            $date = $input['date'];
            unset($input['sta_code'], $input['date']); // ลบออกจากข้อมูลที่จะอัปเดต

            $result = $model->updateGateData($sta_code, $date, $input);
            return $this->response->setJSON(['success' => $result]);
        } else {
            return $this->response->setStatusCode(400, 'Invalid input format');
        }
    }

   
}
