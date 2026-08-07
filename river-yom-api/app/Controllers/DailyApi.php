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

    // 🔧 helper: อ่านรหัสสถานีที่ต้องการกรอง จาก query string หรือ segment ที่ 2
    //    รองรับ: ?sta_code=Y.4  หรือ  ?res_code=srk  หรือ /api/daily/flow/2026-08-05/Y.4
    private function getCodeFilter($paramName = 'sta_code', $segmentCode = null)
    {
        $code = $this->request->getGet($paramName);
        if (!$code && $segmentCode) {
            $code = $segmentCode;
        }
        return $code ? trim($code) : null;
    }

    // 🟦 สรุปข้อมูลอ่างเก็บน้ำรายวัน
    public function reservoir($date = null, $codeSegment = null)
    {
        $infoModel = new ReservoirInfoModel();
        $dataModel = new ReservoirModel();

        if (!$date) {
            $latest = $dataModel->selectMax('datetime')->first();
            $date = $latest ? substr($latest['datetime'], 0, 10) : date('Y-m-d');
        }

        $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));

        // ✅ รองรับการเลือกสถานีเดียวด้วย res_code
        $resCode = $this->getCodeFilter('res_code', $codeSegment);

        $infoQuery = $infoModel;
        if ($resCode) {
            $infoQuery = $infoModel->where('res_code', $resCode);
        }
        $reservoirs = $infoQuery->findAll();

        if ($resCode && empty($reservoirs)) {
            return $this->failNotFound("ไม่พบข้อมูลอ่างเก็บน้ำรหัส '{$resCode}'");
        }

        $result = [];
        $no = 1;

        foreach ($reservoirs as $res) {
            $query = $dataModel->where('res_code', $res['res_code']);
            $daily = $this->whereDateAt7($query, $date)->first();

            if (!$daily || floatval($daily['volume']) == 0) {
                $query = $dataModel->where('res_code', $res['res_code']);
                $daily = $this->whereDateAt7($query, $yesterday)->first();
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
                    'date' => substr($daily['datetime'], 0, 10),
                    'datetime' => $daily['datetime'],
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

        // ✅ ถ้าเลือกสถานีเดียว ส่งเป็น object เดี่ยวแทน array (สะดวกฝั่ง frontend)
        if ($resCode) {
            return $this->respond(['data' => $result[0] ?? null]);
        }

        return $this->respond(['data' => $result]);
    }

    // 🟨 สรุปข้อมูลประตูน้ำรายวัน
    public function gate($date = null, $codeSegment = null)
    {
        $infoModel = new GateInfoModel();
        $dataModel = new GateModel();

        $date = $date ?? date('Y-m-d');
        $yearStart = date('Y', strtotime($date)) . '-01-01';

        // ✅ รองรับการเลือกสถานีเดียวด้วย sta_code (ต้องอยู่ในลิสต์ที่อนุญาตด้วย)
        $allowedCodes = ['tng', 'wst', 'kpk'];
        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        if ($staCode) {
            if (!in_array($staCode, $allowedCodes)) {
                return $this->failNotFound("ไม่พบสถานีประตูน้ำรหัส '{$staCode}'");
            }
            $sta_codes = [$staCode];
        } else {
            $sta_codes = $allowedCodes;
        }

        $gates = $infoModel->whereIn('sta_code', $sta_codes)->findAll();

        $result = [];
        $no = 1;

        foreach ($gates as $gate) {
            $query = $dataModel->where('sta_code', $gate['sta_code']);
            $daily = $this->whereDateAt7($query, $date)->first();

            if (!$daily || (isset($daily['discharge']) && $daily['discharge'] == 0)) {
                $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                $query = $dataModel->where('sta_code', $gate['sta_code']);
                $daily = $this->whereDateAt7($query, $yesterday)->first();
            }

            $sumRain = $dataModel
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $gate['sta_code'])
                ->where('datetime >=', $yearStart . ' 07:00:00')
                ->where('datetime <=', $date . ' 07:00:00')
                ->first();

            $rainSum = ($sumRain !== null && $sumRain['total_rain'] !== null)
                ? floatval($sumRain['total_rain'])
                : null;

            if ($daily) {
                $result[] = [
                    'no' => $no++,
                    'sta_code' => $gate['sta_code'],
                    'sta_name' => $gate['sta_name'],
                    'province' => $gate['province'],
                    'lat' => $gate['lat'],
                    'long' => $gate['long'],
                    'date' => substr($daily['datetime'], 0, 10),
                    'datetime' => $daily['datetime'],
                    'wl_upper' => round($daily['wl_upper'], 2),
                    'wl_lower' => round($daily['wl_lower'], 2),
                    'discharge' => round($daily['discharge'], 2),
                    'rain_mm' => isset($daily['rain_mm']) && $daily['rain_mm'] !== null && $daily['rain_mm'] !== ''
                        ? round($daily['rain_mm'], 2)
                        : null,
                    'rain_sum' => $rainSum !== null ? round($rainSum, 2) : null
                ];
            }
        }

        if ($staCode) {
            return $this->respond(['data' => $result[0] ?? null]);
        }

        return $this->respond(['data' => $result]);
    }

    // 🟩 สรุปข้อมูลสถานีน้ำท่ารายวัน
    public function flow($date = null, $codeSegment = null)
    {
        $infoModel = new FlowInfoModel();
        $dataModel = new FlowModel();

        if (!$date) {
            $latest = $dataModel->selectMax('datetime')->first();
            $date = $latest ? substr($latest['datetime'], 0, 10) : date('Y-m-d');
        }

        // ✅ รองรับการเลือกสถานีเดียวด้วย sta_code
        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        $infoQuery = $infoModel;
        if ($staCode) {
            $infoQuery = $infoModel->where('sta_code', $staCode);
        }
        $flows = $infoQuery->findAll();

        if ($staCode && empty($flows)) {
            return $this->failNotFound("ไม่พบสถานีน้ำท่ารหัส '{$staCode}'");
        }

        $result = [];
        $no = 1;

        foreach ($flows as $flow) {
            $query = $dataModel->where('sta_code', $flow['sta_code']);
            $daily = $this->whereDateAt7($query, $date)->first();

            if ($daily) {
                $result[] = [
                    'no' => $no++,
                    'sta_code' => $flow['sta_code'],
                    'sta_name' => $flow['sta_name'],
                    'province' => $flow['province'],
                    'lat' => $flow['lat'],
                    'long' => $flow['long'],
                    'date' => substr($daily['datetime'], 0, 10),
                    'datetime' => $daily['datetime'],
                    'wl' => round($daily['wl'], 2),
                    'discharge' => round($daily['discharge'], 2)
                ];
            }
        }

        if ($staCode) {
            return $this->respond(['data' => $result[0] ?? null]);
        }

        return $this->respond(['data' => $result]);
    }

    // 🟪 tele()
    public function tele($date = null, $codeSegment = null)
    {
        $infoModel = new TeleInfoModel();
        $dataModel = new TeleModel();

        $yearStart = date('Y', strtotime($date)) . '-01-01';

        // ✅ รองรับการเลือกสถานีเดียวด้วย sta_code
        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        $infoQuery = $infoModel;
        if ($staCode) {
            $infoQuery = $infoModel->where('sta_code', $staCode);
        }
        $flows = $infoQuery->findAll();

        if ($staCode && empty($flows)) {
            return $this->failNotFound("ไม่พบสถานีรหัส '{$staCode}'");
        }

        $result = [];
        $no = 1;

        foreach ($flows as $flow) {
            $builder = $dataModel->where('sta_code', $flow['sta_code']);

              $sumRain = $dataModel
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $flow['sta_code'])
                ->where('datetime >=', $yearStart . ' 07:00:00')
                ->where('datetime <=', $date . ' 07:00:00')
                ->first();

            $rainSum = ($sumRain !== null && $sumRain['total_rain'] !== null)
                ? floatval($sumRain['total_rain'])
                : null;

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
                        : null,
                    'rain_sum' => $rainSum !== null ? round($rainSum, 2) : null
                ];
            }
        }

        if ($staCode) {
            return $this->respond(['data' => $result[0] ?? null]);
        }

        return $this->respond(['data' => $result]);
    }

    // 🟦 สรุปข้อมูลฝนรายวัน
    public function rain($date = null, $codeSegment = null)
    {
        $infoModel = new RainInfoModel();
        $dataModel = new RainModel();

        if (!$date) {
            $latest = $dataModel->selectMax('datetime')->first();
            $date = $latest ? substr($latest['datetime'], 0, 10) : date('Y-m-d');
        }

        $yearStart = date('Y', strtotime($date)) . '-01-01';

        // ✅ รองรับการเลือกสถานีเดียวด้วย sta_code (ข้าม logic top-7 ถ้าระบุสถานี)
        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        $infoQuery = $infoModel;
        if ($staCode) {
            $infoQuery = $infoModel->where('sta_code', $staCode);
        }
        $stations = $infoQuery->findAll();

        if ($staCode && empty($stations)) {
            return $this->failNotFound("ไม่พบสถานีฝนรหัส '{$staCode}'");
        }

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
                    'rain_sum' => $rainSum,
                ];
            }
        }

        // ✅ ถ้าระบุ sta_code เจาะจง ไม่ต้อง sort/ตัด top7 — คืนสถานีนั้นตรงๆ
        if ($staCode) {
            $r = $result[0] ?? null;
            if ($r) {
                $r['no'] = 1;
                $r['rain_sum'] = $r['rain_sum'] !== null ? round($r['rain_sum'], 2) : null;
            }
            return $this->respond(['data' => $r]);
        }

        usort($result, function ($a, $b) {
            if ($a['rain_sum'] === null && $b['rain_sum'] === null) return 0;
            if ($a['rain_sum'] === null) return 1;
            if ($b['rain_sum'] === null) return -1;
            return $b['rain_sum'] <=> $a['rain_sum'];
        });

        $top8 = array_slice($result, 0, 7);

        foreach ($top8 as $i => &$r) {
            $r['no'] = $i + 1;
            $r['rain_sum'] = $r['rain_sum'] !== null ? round($r['rain_sum'], 2) : null;
        }

        return $this->respond(['data' => $top8]);
    }
}