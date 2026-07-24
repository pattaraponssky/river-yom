<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

use App\Models\ReservoirInfoModel;
use App\Models\ReservoirModel;
use App\Models\GateInfoModel;
use App\Models\GateModel;
use App\Models\TeleInfoModel;
use App\Models\TeleModel;
use App\Models\FlowInfoModel;
use App\Models\FlowModel;
use App\Models\RainInfoModel;
use App\Models\RainModel;

class DailyApi extends ResourceController
{
    protected $format = 'json';

    // 🔧 helper: query ที่ตาราง datetime ให้ตรงเวลา 07:00 ของวันที่กำหนด
    private function whereDateAt7($builder, $date)
    {
        return $builder
            ->where('DATE(datetime)', $date)
            ->where('HOUR(datetime)', 7)
            ->where('MINUTE(datetime)', 0);
    }

    // 🟦 สรุปข้อมูลอ่างเก็บน้ำรายวัน
    public function reservoir($date = null)
    {
        $infoModel = new ReservoirInfoModel();
        $dataModel = new ReservoirModel();

        if (!$date) {
            $latest = $dataModel->selectMax('datetime')->first(); // ✅ แก้เป็น datetime
            $date = $latest ? substr($latest['datetime'], 0, 10) : date('Y-m-d');
        }

        $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));

        $reservoirs = $infoModel->findAll();
        $result = [];
        $no = 1;

        foreach ($reservoirs as $res) {
            // 🔹 ดึงข้อมูลของวันปัจจุบันก่อน (เวลา 07:00)
            $query = $dataModel->where('res_code', $res['res_code']);
            $daily = $this->whereDateAt7($query, $date)->first(); // ✅ แก้เป็น datetime + 07:00

            // 🔸 ถ้าไม่มีข้อมูล หรือ volume = 0 ให้ใช้ของเมื่อวานแทน
            if (!$daily || floatval($daily['volume']) == 0) {
                $query = $dataModel->where('res_code', $res['res_code']);
                $daily = $this->whereDateAt7($query, $yesterday)->first(); // ✅ แก้เป็น datetime + 07:00
            }

            if ($daily) {
                $p = $res['maxvol'] > 0 ? ($daily['volume'] / $res['maxvol']) * 100 : 0;

                $result[] = [
                    'no' => $no++,
                    'res_code' => $res['res_code'],
                    'res_name' => $res['res_name'],
                    'province' => $res['province'],
                    'type' => $res['type'],
                    'long' => $res['long'],
                    'lat' => $res['lat'],
                    'date' => substr($daily['datetime'], 0, 10), // ✅ ตัดเอาแค่ Y-m-d จาก datetime
                    'datetime' => $daily['datetime'], // ✅ เผื่ออยากดูเวลาจริงด้วย
                    'volume' => round($daily['volume'], 3),
                    'inflow' => round($daily['inflow'], 3),
                    'outflow' => round($daily['outflow'], 3),
                    'p' => round($p, 2)
                ];
            }
        }

        usort($result, function ($a, $b) {
            return (float)$b['volume'] <=> (float)$a['volume'];
        });

        return $this->respond(['data' => $result]);
    }

    // 🟨 สรุปข้อมูลประตูน้ำรายวัน
    public function gate($date = null)
    {
        $infoModel = new GateInfoModel();
        $dataModel = new GateModel();

        $date = $date ?? date('Y-m-d');

        $sta_codes = ['tng', 'wst', 'kpk'];
        $gates = $infoModel->whereIn('sta_code', $sta_codes)->findAll();

        $result = [];
        $no = 1;

        foreach ($gates as $gate) {
            $query = $dataModel->where('sta_code', $gate['sta_code']);
            $daily = $this->whereDateAt7($query, $date)->first(); // ✅ แก้เป็น datetime + 07:00

            // ถ้าไม่มีข้อมูลหรือ discharge = 0 ให้ย้อนไป 1 วัน
            if (!$daily || (isset($daily['discharge']) && $daily['discharge'] == 0)) {
                $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                $query = $dataModel->where('sta_code', $gate['sta_code']);
                $daily = $this->whereDateAt7($query, $yesterday)->first(); // ✅ แก้เป็น datetime + 07:00
            }

            if ($daily) {
                $result[] = [
                    'no' => $no++,
                    'sta_code' => $gate['sta_code'],
                    'sta_name' => $gate['sta_name'],
                    'province' => $gate['province'],
                    'lat' => $gate['lat'],
                    'long' => $gate['long'],
                    'date' => substr($daily['datetime'], 0, 10), // ✅ แก้
                    'datetime' => $daily['datetime'], // ✅ เพิ่ม
                    'wl_upper' => round($daily['wl_upper'], 2),
                    'wl_lower' => round($daily['wl_lower'], 2),
                    'discharge' => round($daily['discharge'], 2),
                    'rain_mm' => isset($daily['rain_mm']) && $daily['rain_mm'] !== null && $daily['rain_mm'] !== ''
                        ? round($daily['rain_mm'], 2)
                        : null
                ];
            }
        }

        return $this->respond(['data' => $result]);
    }

    // 🟩 สรุปข้อมูลสถานีน้ำท่ารายวัน
    public function flow($date = null)
    {
        $infoModel = new FlowInfoModel();
        $dataModel = new FlowModel();

        if (!$date) {
            $latest = $dataModel->selectMax('datetime')->first(); // ✅ แก้เป็น datetime
            $date = $latest ? substr($latest['datetime'], 0, 10) : date('Y-m-d');
        }

        $flows = $infoModel->findAll();
        $result = [];
        $no = 1;

        foreach ($flows as $flow) {
            $query = $dataModel->where('sta_code', $flow['sta_code']);
            $daily = $this->whereDateAt7($query, $date)->first(); // ✅ แก้เป็น datetime + 07:00

            if ($daily) {
                $result[] = [
                    'no' => $no++,
                    'sta_code' => $flow['sta_code'],
                    'sta_name' => $flow['sta_name'],
                    'province' => $flow['province'],
                    'lat' => $flow['lat'],
                    'long' => $flow['long'],
                    'date' => substr($daily['datetime'], 0, 10), // ✅ แก้
                    'datetime' => $daily['datetime'], // ✅ เพิ่ม
                    'wl' => round($daily['wl'], 2),
                    'discharge' => round($daily['discharge'], 2)
                ];
            }
        }

        return $this->respond(['data' => $result]);
    }

    // 🟪 tele() เดิมใช้ pattern ถูกต้องอยู่แล้ว ไม่ต้องแก้ (คงไว้ตามเดิม)
    public function tele($date = null)
    {
        $infoModel = new TeleInfoModel();
        $dataModel = new TeleModel();

        $flows = $infoModel->findAll();
        $result = [];
        $no = 1;

        foreach ($flows as $flow) {
            $builder = $dataModel->where('sta_code', $flow['sta_code']);

            if ($date) {
                $daily = $builder
                            ->where('DATE(datetime)', $date)
                            ->where('HOUR(datetime)', 7)
                            ->where('MINUTE(datetime)', 0)
                            ->first();
            } else {
                $daily = $builder
                            ->orderBy('datetime', 'DESC')
                            ->first();
            }

            if ($daily) {
                $result[] = [
                    'no'        => $no++,
                    'sta_code'  => $flow['sta_code'],
                    'sta_name'  => $flow['sta_name'],
                    'province'  => $flow['province'],
                    'lat'       => $flow['lat'],
                    'long'      => $flow['long'],
                    'datetime'  => $daily['datetime'],
                    'date'      => $date ?? substr($daily['datetime'], 0, 10),
                    'wl'        => round($daily['wl'] ?? 0, 2),
                    'discharge' => round($daily['discharge'] ?? 0, 2),
                    'rain_mm' => isset($daily['rain_mm']) && $daily['rain_mm'] !== null && $daily['rain_mm'] !== ''
                    ? round($daily['rain_mm'], 2)
                    : null
                ];
            }
        }

        return $this->respond(['data' => $result]);
    }

    // 🟦 สรุปข้อมูลฝนรายวัน
    public function rain($date = null)
    {
        $infoModel = new RainInfoModel();
        $dataModel = new RainModel();

        if (!$date) {
            $latest = $dataModel->selectMax('datetime')->first();
            $date = $latest ? substr($latest['datetime'], 0, 10) : date('Y-m-d');
        }

        $yearStart = date('Y', strtotime($date)) . '-01-01';

        $stations = $infoModel->findAll();
        $result = [];

        foreach ($stations as $st) {
            $query = $dataModel->where('sta_code', $st['sta_code']);
            $daily = $this->whereDateAt7($query, $date)->first();

            $sumRain = $dataModel
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $st['sta_code'])
                ->where('datetime >=', $yearStart . ' 07:00:00')
                ->where('datetime <=', $date . ' 07:00:00')
                ->first();

            // ✅ เก็บ rain_sum เป็น null ถ้าไม่มีข้อมูลจริงๆ ไม่บังคับเป็น 0
            $rainSum = ($sumRain !== null && $sumRain['total_rain'] !== null)
                ? floatval($sumRain['total_rain'])
                : null;

            if ($daily) {
                $result[] = [
                    'sta_code' => $st['sta_code'],
                    'name' => $st['name'],
                    'province' => $st['province'],
                    'lat' => $st['lat'],
                    'long' => $st['long'],
                    'date' => substr($daily['datetime'], 0, 10),
                    'datetime' => $daily['datetime'],
                    'rain_mm' => isset($daily['rain_mm']) && $daily['rain_mm'] !== null && $daily['rain_mm'] !== ''
                        ? round($daily['rain_mm'], 2)
                        : null,
                    'rain_sum' => $rainSum, // ✅ อาจเป็น null ได้แล้ว
                ];
            }
        }

        // ✅ เรียงลำดับโดยดัน null ไปท้ายสุด (ไม่ปนกับสถานีที่มีข้อมูลจริง)
        usort($result, function ($a, $b) {
            if ($a['rain_sum'] === null && $b['rain_sum'] === null) return 0;
            if ($a['rain_sum'] === null) return 1;  // a ไป null ท้าย
            if ($b['rain_sum'] === null) return -1; // b ไป null ท้าย
            return $b['rain_sum'] <=> $a['rain_sum'];
        });

        $top8 = array_slice($result, 0, 7);

        foreach ($top8 as $i => &$r) {
            $r['no'] = $i + 1;
            // ✅ round เฉพาะตอนที่ไม่ใช่ null
            $r['rain_sum'] = $r['rain_sum'] !== null ? round($r['rain_sum'], 2) : null;
        }

        return $this->respond(['data' => $top8]);
    }
}