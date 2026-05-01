<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

// ✅ Import Models
use App\Models\ReservoirInfoModel;
use App\Models\ReservoirModel;
use App\Models\GateInfoModel;
use App\Models\GateModel;
use App\Models\FlowInfoModel;
use App\Models\FlowModel;
use App\Models\RainInfoModel;
use App\Models\RainModel;

class DailyApi extends ResourceController
{
    protected $format = 'json';

    // 🟦 สรุปข้อมูลอ่างเก็บน้ำรายวัน
   public function reservoir($date = null)
    {
        $infoModel = new ReservoirInfoModel();
        $dataModel = new ReservoirModel();

        if (!$date) {
            $latest = $dataModel->selectMax('date')->first();
            $date = $latest ? $latest['date'] : date('Y-m-d');
        }

        $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));

        $reservoirs = $infoModel->findAll();
        $result = [];
        $no = 1;

        foreach ($reservoirs as $res) {
            // 🔹 ดึงข้อมูลของวันปัจจุบันก่อน
            $daily = $dataModel
                ->where('res_code', $res['res_code'])
                ->where('date', $date)
                ->first();

            // 🔸 ถ้าไม่มีข้อมูล หรือ volume = 0 ให้ใช้ของเมื่อวานแทน
            if (!$daily || floatval($daily['volume']) == 0) {
                $daily = $dataModel
                    ->where('res_code', $res['res_code'])
                    ->where('date', $yesterday)
                    ->first();
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
                    'date' => $daily['date'], // อาจเป็นของวันนี้หรือเมื่อวาน
                    'volume' => round($daily['volume'], 3),
                    'inflow' => round($daily['inflow'], 3),
                    'outflow' => round($daily['outflow'], 3),
                    'p' => round($p, 2)
                ];
            }
        }

        // 🔻 เรียงลำดับตาม volume จากมากไปน้อย
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

        // กำหนดวันที่ ถ้าไม่ระบุใช้วันนี้
        $date = $date ?? date('Y-m-d');

        // ✅ กำหนดรหัสสถานีที่ต้องการ
        $sta_codes = ['C.54', 'Y.506', 'Y.507', 'Y.508'];

        // ดึงเฉพาะสถานีที่ต้องการ
        $gates = $infoModel->whereIn('sta_code', $sta_codes)->findAll();

        $result = [];
        $no = 1;

        foreach ($gates as $gate) {
            $daily = $dataModel->where('sta_code', $gate['sta_code'])
                ->where('date', $date)
                ->first();

            // ถ้าไม่มีข้อมูลหรือ discharge = 0 ให้ย้อนไป 1 วัน
            if (!$daily || (isset($daily['discharge']) && $daily['discharge'] == 0)) {
                $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                $daily = $dataModel->where('sta_code', $gate['sta_code'])
                    ->where('date', $yesterday)
                    ->first();
            }

            if ($daily) {
                $result[] = [
                    'no' => $no++,
                    'sta_code' => $gate['sta_code'],
                    'sta_name' => $gate['sta_name'],
                    'province' => $gate['province'],
                    'lat' => $gate['lat'],
                    'long' => $gate['long'],
                    'date' => $daily['date'],
                    'wl_upper' => round($daily['wl_upper'], 2),
                    'wl_lower' => round($daily['wl_lower'], 2),
                    'discharge' => round($daily['discharge'], 2)
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
            $latest = $dataModel->selectMax('date')->first();
            $date = $latest ? $latest['date'] : date('Y-m-d');
        }

        $flows = $infoModel->findAll();
        $result = [];
        $no = 1;

        foreach ($flows as $flow) {
            $daily = $dataModel->where('sta_code', $flow['sta_code'])->where('date', $date)->first();
            if ($daily) {
                $result[] = [
                    'no' => $no++,
                    'sta_code' => $flow['sta_code'],
                    'sta_name' => $flow['sta_name'],
                    'province' => $flow['province'],
                    'lat' => $flow['lat'],
                    'long' => $flow['long'],
                    'date' => $daily['date'],
                    'wl' => round($daily['wl'], 2),
                    'discharge' => round($daily['discharge'], 2)
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

        // ถ้าไม่ระบุวันที่ ให้ใช้วันล่าสุดที่มีข้อมูล
        // if (!$date) {
        //     $date = date('Y-m-d', strtotime('-1 day')); // ใช้เมื่อวาน
        // }

        if (!$date) {
            $latest = $dataModel->selectMax('date')->first();
            $date = $latest ? $latest['date'] : date('Y-m-d');
        }

        // หาวันที่ 1 มกราคมของปีปัจจุบัน
        $yearStart = date('Y', strtotime($date)) . '-01-01';

        $stations = $infoModel->findAll();
        $result = [];

        foreach ($stations as $st) {
            // ดึงข้อมูลฝนรายวันของวันนั้น
            $daily = $dataModel
                ->where('sta_code', $st['sta_code'])
                ->where('date', $date)
                ->first();

            // ดึงค่าฝนสะสมตั้งแต่ 1 ม.ค. ถึงวันนั้น
            $sumRain = $dataModel
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $st['sta_code'])
                ->where('date >=', $yearStart)
                ->where('date <=', $date)
                ->first();

            if ($daily) {
                $result[] = [
                    'sta_code' => $st['sta_code'],
                    'name' => $st['name'],
                    'province' => $st['province'],
                    'lat' => $st['lat'],
                    'long' => $st['long'],
                    'date' => $daily['date'],
                    'rain_mm' => round($daily['rain_mm'], 2),
                    'rain_sum' => floatval($sumRain['total_rain'] ?? 0), // ใช้ float สำหรับเรียงลำดับ
                ];
            }
        }

        // ✅ เรียงตามฝนสะสมจากมากไปน้อย
        usort($result, function ($a, $b) {
            return $b['rain_sum'] <=> $a['rain_sum'];
        });

        // ✅ แสดงแค่ 8 สถานีแรก
        $top8 = array_slice($result, 0, 7);

        // ✅ เพิ่มลำดับ (no)
        foreach ($top8 as $i => &$r) {
            $r['no'] = $i + 1;
            $r['rain_sum'] = round($r['rain_sum'], 2);
        }

        return $this->respond(['data' => $top8]);
    }

}
