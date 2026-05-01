<?php
namespace App\Controllers;
use CodeIgniter\Controller;
use Config\Database;
use App\Models\ReservoirModel;

class ReservoirAPI extends Controller
{

    public function reservoirData($res_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); // ?startYear=2022
            $endYear = $this->request->getGet('endYear');     // ?endYear=2024

            $model = new ReservoirModel();

            if ($startYear && $endYear) {
                $data = $model->getReservoirDataByCodeAndYearRange($res_code, $startYear, $endYear);
            } else {
                $data = $model->getReservoirDataByCode($res_code);
            }

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลอ่างเก็บน้ำที่ระบุ'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }


    public function reservoirRC($res_code)
    {
        $startYear = $this->request->getGet('startYear'); // ดึงจาก URL ?startYear=2022
        $endYear = $this->request->getGet('endYear');     // ดึงจาก URL ?endYear=2024

        $model = new ReservoirModel();

        if ($startYear && $endYear) {
            $data = $model->getReservoirRCByCodeAndYearRange($res_code, $startYear, $endYear);
        } else {
            $data = $model->getReservoirRCByCode($res_code);
        }

        return $this->response->setJSON($data);
    }

    public function reservoir_years()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            $builder = $db->table('reservoir_data');
    
            // รับค่า res_code จาก GET parameter
            $res_code = $this->request->getGet('res_code');  // รหัสสถานี
    
            // ตรวจสอบและเพิ่มเงื่อนไขการค้นหา
            if ($res_code) {
                $builder->where('res_code', $res_code);
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

    public function reservoirDataLast7Days()
    {
        try {
            $model = new ReservoirModel();

            $data = $model->getReservoirDataLast7Days();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลอ่างเก็บน้ำในช่วง 7 วันล่าสุด'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function reservoirDataLast14Days()
    {
        try {
            $model = new ReservoirModel();

            $data = $model->getReservoirDataLast14Days();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลอ่างเก็บน้ำในช่วง 14 วันล่าสุด'
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
        $model = new ReservoirModel();
        $input = $this->request->getJSON(true); // รับข้อมูล JSON แปลงเป็น array/assoc array
    
        if (isset($input[0]) && is_array($input)) {
            // กรณีรับข้อมูลหลายแถวเป็น array ของ array
            $count = $model->updateMultipleReservoirData($input);
            return $this->response->setJSON(['updated' => $count]);
        } else if (is_array($input)) {
            // กรณีรับข้อมูลแถวเดียวเป็น associative array
            // ต้องมี res_code กับ date เพื่อใช้เป็นเงื่อนไข
            if (!isset($input['res_code']) || !isset($input['date'])) {
                return $this->response->setStatusCode(400, 'Missing res_code or date');
            }
    
            $res_code = $input['res_code'];
            $date = $input['date'];
            unset($input['res_code'], $input['date']); // เอาออกจากข้อมูลที่อัปเดต
    
            $result = $model->updateReservoirData($res_code, $date, $input);
            return $this->response->setJSON(['success' => $result]);
        } else {
            return $this->response->setStatusCode(400, 'Invalid input format');
        }
    }

}