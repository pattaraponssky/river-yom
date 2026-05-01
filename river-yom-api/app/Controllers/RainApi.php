<?php
namespace App\Controllers;
use CodeIgniter\Controller;
use Config\Database;
use App\Models\RainModel;
class RainAPI extends Controller
{
   
    public function rain_info()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            
            // ตรวจสอบการเชื่อมต่อโดยการดึงข้อมูลจากตารางใดตารางหนึ่ง
            $builder = $db->table('rain_info');
            $query = $builder->get();

            // ถ้าผ่านการเชื่อมต่อและมีข้อมูลในตาราง
            if ($query->getNumRows() > 0) {
                $rain_info = $query->getResultArray();  // ดึงข้อมูลเป็น array
                
                // ส่งข้อมูลในรูปแบบ JSON
                return $this->response->setJSON([
                    'data' => $rain_info
                ]);
            } else {
                // ไม่มีข้อมูลในตาราง
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลในตาราง rain_info.'
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

    public function rainData($sta_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); // ?startYear=2022
            $endYear = $this->request->getGet('endYear');     // ?endYear=2024

            $model = new RainModel();

            if ($startYear && $endYear) {
                $data = $model->getRainDataByCodeAndYearRange($sta_code, $startYear, $endYear);
            } else {
                $data = $model->getRainDataByCode($sta_code);
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

    public function monthly($sta_code)
    {
        $startYear = (int)($this->request->getGet('startYear') ?? date('Y') - 543);
        $endYear   = (int)($this->request->getGet('endYear')   ?? date('Y') - 543);

        // แปลง พ.ศ. → ค.ศ.
        if ($startYear > 2400) $startYear -= 543;
        if ($endYear   > 2400) $endYear   -= 543;

        $db = db_connect();
        $query = $db->query("
            SELECT
                YEAR(date)  AS year,
                MONTH(date) AS month,
                ROUND(SUM(rain_mm), 2) AS rain_mm,
                COUNT(*)    AS days
            FROM rain_data
            WHERE sta_code = ?
            AND YEAR(date) BETWEEN ? AND ?
            AND rain_mm IS NOT NULL
            GROUP BY YEAR(date), MONTH(date)
            ORDER BY YEAR(date), MONTH(date)
        ", [$sta_code, $startYear, $endYear]);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $query->getResultArray(),
        ]);
    }

    // GET /api/rain_yearly/{sta_code}?startYear=2550&endYear=2566
    public function yearly($sta_code)
    {
        $startYear = (int)($this->request->getGet('startYear') ?? 2000);
        $endYear   = (int)($this->request->getGet('endYear')   ?? date('Y') - 543);

        if ($startYear > 2400) $startYear -= 543;
        if ($endYear   > 2400) $endYear   -= 543;

        $db = db_connect();
        $query = $db->query("
            SELECT
                YEAR(date) AS year,
                ROUND(SUM(rain_mm), 2)  AS rain_mm,
                ROUND(AVG(rain_mm), 2)  AS rain_avg,
                COUNT(*)                AS days,
                MAX(rain_mm)            AS rain_max
            FROM rain_data
            WHERE sta_code = ?
            AND YEAR(date) BETWEEN ? AND ?
            AND rain_mm IS NOT NULL
            GROUP BY YEAR(date)
            ORDER BY YEAR(date)
        ", [$sta_code, $startYear, $endYear]);

        return $this->response->setJSON([
            'status' => 'success',
            'data'   => $query->getResultArray(),
        ]);
    }


    public function rain_years()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            $builder = $db->table('rain_data');

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

    public function rainDataLast7Days()
    {
        try {
            $model = new RainModel();

            $data = $model->getRainDataLast7Days();

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

    public function rainDataLast14Days()
    {
        try {
            $model = new RainModel();

            $data = $model->getRainDataLast14Days();

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
        $model = new RainModel();
        $input = $this->request->getJSON(true); // รับข้อมูล JSON แปลงเป็น array

        if (isset($input[0]) && is_array($input)) {
            // ข้อมูลหลายแถว
            $count = $model->updateMultipleRainData($input);
            return $this->response->setJSON(['updated' => $count]);
        } else if (is_array($input)) {
            // ข้อมูลแถวเดียว
            if (!isset($input['sta_code']) || !isset($input['date'])) {
                return $this->response->setStatusCode(400, 'Missing sta_code or date');
            }

            $sta_code = $input['sta_code'];
            $date = $input['date'];
            unset($input['sta_code'], $input['date']); // ลบออกจากข้อมูลที่จะอัปเดต

            $result = $model->updateRainData($sta_code, $date, $input);
            return $this->response->setJSON(['success' => $result]);
        } else {
            return $this->response->setStatusCode(400, 'Invalid input format');
        }
    }


   
}
