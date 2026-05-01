<?php
namespace App\Controllers;
use CodeIgniter\Controller;
use Config\Database;
use App\Models\TeleModel;
use App\Models\TeleHourlyModel;

class TeleAPI extends Controller
{
    public function tele_info()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            
            // ตรวจสอบการเชื่อมต่อโดยการดึงข้อมูลจากตารางใดตารางหนึ่ง
            $builder = $db->table('tele_info');
            $query = $builder->get();

            // ถ้าผ่านการเชื่อมต่อและมีข้อมูลในตาราง
            if ($query->getNumRows() > 0) {
                $tele_info = $query->getResultArray();  // ดึงข้อมูลเป็น array
                
                // ส่งข้อมูลในรูปแบบ JSON
                return $this->response->setJSON([
                    'data' => $tele_info
                ]);
            } else {
                // ไม่มีข้อมูลในตาราง
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลในตาราง tele_info.'
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

    public function teleData($sta_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); // ?startYear=2022
            $endYear = $this->request->getGet('endYear');     // ?endYear=2024

            $model = new TeleModel();

            if ($startYear && $endYear) {
                $data = $model->getTeleDataByCodeAndYearRange($sta_code, $startYear, $endYear);
            } else {
                $data = $model->getTeleDataByCode($sta_code);
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



    public function tele_years()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            $builder = $db->table('tele_data');

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

    public function teleDataLast7Days()
    {
        try {
            $model = new TeleModel();

            $data = $model->getTeleDataLast7Days();

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

    public function teleDataLast14Days()
    {
        try {
            $model = new TeleModel();

            $data = $model->getTeleDataLast14Days();

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
        $model = new TeleModel();
        $input = $this->request->getJSON(true); // รับข้อมูล JSON แปลงเป็น array

        if (isset($input[0]) && is_array($input)) {
            // ข้อมูลหลายแถว
            $count = $model->updateMultipleTeleData($input);
            return $this->response->setJSON(['updated' => $count]);
        } else if (is_array($input)) {
            // ข้อมูลแถวเดียว
            if (!isset($input['sta_code']) || !isset($input['datetime'])) {
                return $this->response->setStatusCode(400, 'Missing sta_code or datetime');
            }

            $sta_code = $input['sta_code'];
            $date = $input['datetime'];
            unset($input['sta_code'], $input['datetime']); // ลบออกจากข้อมูลที่จะอัปเดต

            $result = $model->updateTeleData($sta_code, $date, $input);
            return $this->response->setJSON(['success' => $result]);
        } else {
            return $this->response->setStatusCode(400, 'Invalid input format');
        }
    }

    public function teleDataTodayByStations()
    {
        try {
            // กำหนดรหัสสถานีที่ต้องการดึงข้อมูล
            $staCodes = ['Y.15', 'Y.16', 'Y.4', 'Y.50', 'Y.64', 'Y.51', 'Y.17'];

            $model = new TeleModel();
            
            // เรียกใช้ Model เพื่อดึงข้อมูลของวันปัจจุบัน
            $data = $model->getTodayTeleDataByStationCodes($staCodes);

            if (!empty($data)) {
                // ส่งข้อมูลที่พบ
                return $this->response->setJSON([
                    'status' => 'success',
                    'data' => $data
                ]);
            } else {
                // ไม่พบข้อมูล
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลระดับน้ำสำหรับสถานีที่ระบุในวันปัจจุบัน'
                ]);
            }

        } catch (\Exception $e) {
            // จัดการข้อผิดพลาดที่เกิดขึ้นขณะประมวลผล
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

   public function teleHourlyDataLast7Days()
    {
        try {
            $model = new TeleModel();
            $db = \Config\Database::connect();

            $now = new \DateTime();
            $end = clone $now;
            $end->setTime(8, 0, 0); // วันนี้ 09:00

            $start = (clone $end)->modify('-7 days');

            $builder = $db->table('tele_hourly');
            $builder->where('datetime >=', $start->format('Y-m-d H:i:s'));
            $builder->where('datetime <=', $end->format('Y-m-d H:i:s'));
            $builder->orderBy('datetime', 'ASC');

            $data = $builder->get()->getResultArray();

            if (!empty($data)) {
                return $this->response->setJSON([
                    'status' => 'success',
                    'start' => $start->format('Y-m-d H:i:s'),
                    'end' => $end->format('Y-m-d H:i:s'),
                    'data' => $data
                ]);
            } else {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'ไม่พบข้อมูลย้อนหลัง 7 วัน'
                ]);
            }

        } catch (\Exception $e) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => '❌ Database Query Failed: ' . $e->getMessage()
            ]);
        }
    }

    public function teleHourlyData($sta_code)
    {
        try {
            $startYear = $this->request->getGet('startYear'); // ?startYear=2022
            $endYear = $this->request->getGet('endYear');     // ?endYear=2024

            $model = new TeleModel();

            if ($startYear && $endYear) {
                $data = $model->getTeleHourlyDataByCodeAndYearRange($sta_code, $startYear, $endYear);
            } else {
                $data = $model->getTeleHourlyDataByCode($sta_code);
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



    public function teleHourly_years()
    {
        try {
            // เชื่อมต่อฐานข้อมูล
            $db = Database::connect();
            $builder = $db->table('tele_data');

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
}
