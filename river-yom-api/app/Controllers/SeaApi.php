<?php
namespace App\Controllers;
use CodeIgniter\Controller;
use Config\Database;
use App\Models\SeaModel;
class SeaAPI extends Controller
{
   
    public function sea_info()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            
            // ตรวจสอบการเชื่อมต่อโดยการดึงข้อมูลจากตารางใดตารางหนึ่ง
            $builder = $db->table('sea_info');
            $query = $builder->get();

            // ถ้าผ่านการเชื่อมต่อและมีข้อมูลในตาราง
            if ($query->getNumRows() > 0) {
                $sea_info = $query->getResultArray();  // ดึงข้อมูลเป็น array
                
                // ส่งข้อมูลในรูปแบบ JSON
                return $this->response->setJSON([
                    'data' => $sea_info
                ]);
            } else {
                // ไม่มีข้อมูลในตาราง
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลในตาราง sea_info.'
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

    public function seaData($sta_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); // ?startYear=2022
            $endYear = $this->request->getGet('endYear');     // ?endYear=2024

            $model = new SeaModel();

            if ($startYear && $endYear) {
                $data = $model->getSeaDataByCodeAndYearRange($sta_code, $startYear, $endYear);
            } else {
                $data = $model->getSeaDataByCode($sta_code);
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


    public function sea_years()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            $builder = $db->table('sea_data');

            // รับค่า sta_code จาก GET parameter
            $sta_code = $this->request->getGet('sta_code');  // รหัสสถานี

            // ตรวจสอบและเพิ่มเงื่อนไขการค้นหา
            if ($sta_code) {
                $builder->where('sta_code', $sta_code);
            }

            // ดึงปีที่มีข้อมูลจากฟิลด์ `date` (ใช้ YEAR(date))
            $builder->select('DISTINCT YEAR(datetime) AS year');
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

    public function SeaDataToday()
    {
        try {
            $model = new SeaModel();

            $data = $model->getSeaDataToday();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลสถานีในช่วง 1 วันล่าสุด'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function seaDataCurrentYear()
    {
        try {
            $model = new SeaModel();

            $data = $model->getSeaDataCurrentYear();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลสถานีในช่วงปีล่าสุด'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }
    public function SeaDataRange()
    {
        try {
            $model = new SeaModel();
            $data = $model->getSeaDataRange();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลระดับน้ำทะเลในช่วง 3 วันย้อนหลัง และ 6 วันล่วงหน้า'
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
        $model = new SeaModel(); // ใช้โมเดลของทะเล
        $input = $this->request->getJSON(true); // รับ JSON แล้วแปลงเป็น array

        if (isset($input[0]) && is_array($input)) {
            // รับข้อมูลหลายแถว
            $count = $model->updateMultipleSeaData($input);
            return $this->response->setJSON(['updated' => $count]);
        } else if (is_array($input)) {
            // รับข้อมูลแถวเดียว
            if (!isset($input['sta_code']) || !isset($input['datetime'])) {
                return $this->response->setStatusCode(400, 'Missing sta_code or datetime');
            }

            $sta_code = $input['sta_code'];
            $datetime = $input['datetime'];
            unset($input['sta_code'], $input['datetime']); // ตัด key ที่ใช้เป็นเงื่อนไขออก

            $result = $model->updateSeaData($sta_code, $datetime, $input);
            return $this->response->setJSON(['success' => $result]);
        } else {
            return $this->response->setStatusCode(400, 'Invalid input format');
        }
    }

   
}
