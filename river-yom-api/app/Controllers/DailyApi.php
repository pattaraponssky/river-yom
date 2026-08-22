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

    // 🔧 helper: query ที่ตาราง datetime ให้ตรงเวลา 07:00 ของวันที่กำหนด (ใช้สำหรับดูย้อนหลัง)
    protected function whereDateAt7($model, string $staCode, string $date, string $codeField = 'sta_code')
    {
        $row = $model
            ->where($codeField, $staCode)
            ->where('DATE(datetime)', $date)
            ->where("TIME(datetime) = '07:00:00'")
            ->first();

        if ($row) {
            return $row;
        }

        $row = $model
            ->where($codeField, $staCode)
            ->where('DATE(datetime)', $date)
            ->orderBy('ABS(TIMESTAMPDIFF(MINUTE, TIME(datetime), "07:00:00"))', '', false)
            ->orderBy('datetime', 'ASC')
            ->first();

        if ($row) {
            return $row;
        }

        $prevDate = date('Y-m-d', strtotime($date . ' -1 day'));

        return $model
            ->where($codeField, $staCode)
            ->where('DATE(datetime)', $prevDate)
            ->orderBy('ABS(TIMESTAMPDIFF(MINUTE, TIME(datetime), "07:00:00"))', '', false)
            ->orderBy('datetime', 'ASC')
            ->first();
    }

    // ✅ helper: หา record ล่าสุดจริงๆ ของสถานี (ไม่จำกัดวัน, ไม่บังคับใกล้ 07:00)
    //    ใช้เมื่อระบุ sta_code เจาะจง + ไม่ระบุวันที่ (ต้องการค่าล่าสุดจริงแบบ YR.05)
    protected function getLatestRecord($model, string $staCode, string $codeField = 'sta_code')
    {
        return $model
            ->where($codeField, $staCode)
            ->orderBy('datetime', 'DESC')
            ->first();
    }

   protected function getAt7OrLatestSameDay($model, string $staCode, string $date, string $codeField = 'sta_code', int $toleranceMinutes = 30)
    {
        $row = $model
            ->where($codeField, $staCode)
            ->where('DATE(datetime)', $date)
            ->where("TIME(datetime) = '07:00:00'")
            ->first();

        if ($row) {
            return $row;
        }

        $row = $model
            ->where($codeField, $staCode)
            ->where('DATE(datetime)', $date)
            ->where("ABS(TIMESTAMPDIFF(MINUTE, TIME(datetime), '07:00:00')) <= {$toleranceMinutes}")
            ->orderBy('ABS(TIMESTAMPDIFF(MINUTE, TIME(datetime), "07:00:00"))', '', false)
            ->orderBy('datetime', 'ASC')
            ->first();

        if ($row) {
            return $row;
        }

        // 3. ไม่มีอะไรใกล้ 07:00 เลย → ใช้ค่าล่าสุดของวันนั้นแทน
        return $model
            ->where($codeField, $staCode)
            ->where('DATE(datetime)', $date)
            ->orderBy('datetime', 'DESC')
            ->first();
    }

    private function getCodeFilter($paramName = 'sta_code', $segmentCode = null)
    {
        $code = $this->request->getGet($paramName);
        if (!$code && $segmentCode) {
            $code = $segmentCode;
        }
        return $code ? trim($code) : null;
    }

    // 🔧 helper: หาวันที่ล่าสุดที่มีข้อมูล (กรองตามสถานีถ้าระบุ)
    protected function getLatestDate($model, $staCode = null, $codeField = 'sta_code', $fallbackFormat = 'Y-m-d')
    {
        $query = $staCode ? $model->where($codeField, $staCode) : $model;
        $latest = $query->selectMax('datetime')->first();

        return ($latest && !empty($latest['datetime']))
            ? substr($latest['datetime'], 0, 10)
            : date($fallbackFormat);
    }

    // 🟦 สรุปข้อมูลอ่างเก็บน้ำรายวัน (ไม่แก้ไข)
    public function reservoir($date = null, $codeSegment = null)
    {
        $infoModel = new ReservoirInfoModel();
        $dataModel = new ReservoirModel();

        $resCode = $this->getCodeFilter('res_code', $codeSegment);

        $isLatestMode = ($date === null);

        if ($isLatestMode) {
            $date = $this->getLatestDate(new ReservoirModel(), $resCode, 'res_code');
        }

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
            if ($isLatestMode) {
                $daily = $this->getLatestRecord(new ReservoirModel(), $res['res_code'], 'res_code');
            } else {
                $daily = $this->whereDateAt7($dataModel, $res['res_code'], $date, 'res_code');
                if (!$daily) {
                    $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                    $daily = $this->whereDateAt7($dataModel, $res['res_code'], $yesterday, 'res_code');
                }
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
                    'maxvol' => $res['maxvol'],
                    'minvol' => $res['minvol'],
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

        if ($resCode) {
            return $this->respond(['data' => $result[0] ?? null]);
        }

        return $this->respond(['data' => $result]);
    }

    // 🟨 สรุปข้อมูลประตูน้ำรายวัน (ไม่แก้ไข)
    public function gate($date = null, $codeSegment = null)
    {
        $infoModel = new GateInfoModel();
        $dataModel = new GateModel();

        $allowedCodes = ['tng', 'wst', 'kpk'];
        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        if ($staCode && !in_array($staCode, $allowedCodes)) {
            return $this->failNotFound("ไม่พบสถานีประตูน้ำรหัส '{$staCode}'");
        }

        $isLatestMode = ($date === null);

        if ($isLatestMode) {
            $date = $this->getLatestDate(new GateModel(), $staCode, 'sta_code');
        }

        $yearStart = date('Y', strtotime($date)) . '-01-01';

        $sta_codes = $staCode ? [$staCode] : $allowedCodes;

        $gates = $infoModel->whereIn('sta_code', $sta_codes)->findAll();

        $result = [];
        $no = 1;

        foreach ($gates as $gate) {
            if ($isLatestMode) {
                $daily = $this->getLatestRecord(new GateModel(), $gate['sta_code'], 'sta_code');
            } else {
                $daily = $this->whereDateAt7($dataModel, $gate['sta_code'], $date, 'sta_code');
                if (!$daily || (isset($daily['discharge']) && $daily['discharge'] == 0)) {
                    $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                    $daily = $this->whereDateAt7($dataModel, $gate['sta_code'], $yesterday, 'sta_code');
                }
            }

            $sumUntil = $isLatestMode && $daily ? $daily['datetime'] : $date . ' 07:00:00';

            $sumRain = $dataModel
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $gate['sta_code'])
                ->where('datetime >=', $yearStart . ' 07:00:00')
                ->where('datetime <=', $sumUntil)
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

    // 🟩 สรุปข้อมูลสถานีน้ำท่ารายวัน (ไม่แก้ไข)
    public function flow($date = null, $codeSegment = null)
    {
        $infoModel = new FlowInfoModel();
        $dataModel = new FlowModel();

        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        $isLatestMode = ($date === null);

        if ($isLatestMode) {
            $date = $this->getLatestDate(new FlowModel(), $staCode, 'sta_code');
        }

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
            if ($isLatestMode) {
                $daily = $this->getLatestRecord(new FlowModel(), $flow['sta_code'], 'sta_code');
            } else {
                $daily = $this->whereDateAt7($dataModel, $flow['sta_code'], $date, 'sta_code');
                if (!$daily) {
                    $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                    $daily = $this->whereDateAt7($dataModel, $flow['sta_code'], $yesterday, 'sta_code');
                }
            }

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

    // 🟪 tele() — ✅ แก้ไขตามที่ต้องการ
    public function tele($date = null, $codeSegment = null)
    {
        $infoModel = new TeleInfoModel();
        $dataModel = new TeleModel();

        $staCode = $this->getCodeFilter('sta_code', $codeSegment)
            ?? $this->request->getGet('sta_code');

        // ✅ ระบุ date มาเอง = ต้องการดูย้อนหลัง → ใช้ logic เดิมทั้งหมด (fallback ไปวันก่อนหน้าได้)
        $isExplicitDate = ($date !== null);

        if (!$isExplicitDate) {
            $date = $this->getLatestDate(new TeleModel(), $staCode, 'sta_code');
        }

        $yearStart = date('Y', strtotime($date)) . '-01-01';

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
            $code = $flow['sta_code'];

            if ($isExplicitDate) {
                // ดูย้อนหลังตามวันที่ระบุ: ใช้ logic เดิม (07:00 → ใกล้ 07:00 → fallback วันก่อนหน้าได้)
                $daily = $this->whereDateAt7(new TeleModel(), $code, $date, 'sta_code');
                if (!$daily) {
                    $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                    $daily = $this->whereDateAt7(new TeleModel(), $code, $yesterday, 'sta_code');
                }
            } elseif ($staCode) {
                $daily = $this->getLatestRecord(new TeleModel(), $code, 'sta_code');
            } else {
                $daily = $this->getAt7OrLatestSameDay(new TeleModel(), $code, $date, 'sta_code');
            }

            $sumUntil = $daily ? $daily['datetime'] : ($date . ' 07:00:00');

            $sumRain = (new TeleModel())
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $code)
                ->where('datetime >=', $yearStart . ' 07:00:00')
                ->where('datetime <=', $sumUntil)
                ->first();

            $rainSum = ($sumRain !== null && $sumRain['total_rain'] !== null)
                ? floatval($sumRain['total_rain'])
                : null;

            if ($daily) {
                $result[] = [
                    'no'        => $no++,
                    'sta_code'  => $flow['sta_code'],
                    'sta_name'  => $flow['sta_name'],
                    'province'  => $flow['province'],
                    'lat'       => $flow['lat'],
                    'long'      => $flow['long'],
                    'date'      => substr($daily['datetime'], 0, 10),
                    'datetime'  => $daily['datetime'],
                    'wl'        => isset($daily['wl']) ? round((float) $daily['wl'], 2) : null,
                    'discharge' => isset($daily['discharge']) ? round((float) $daily['discharge'], 2) : null,
                    'rain_mm'   => isset($daily['rain_mm']) && $daily['rain_mm'] !== null && $daily['rain_mm'] !== ''
                        ? round((float) $daily['rain_mm'], 2)
                        : null,
                    'rain_sum'  => $rainSum !== null ? round($rainSum, 2) : null,
                ];
            } else {
                // ✅ ไม่มีข้อมูลเลยตั้งแต่ 00:00 ของวันนี้ → ใส่ค่าว่าง แทนการข้ามสถานีนี้ไปเฉยๆ
                $result[] = [
                    'no'        => $no++,
                    'sta_code'  => $flow['sta_code'],
                    'sta_name'  => $flow['sta_name'],
                    'province'  => $flow['province'],
                    'lat'       => $flow['lat'],
                    'long'      => $flow['long'],
                    'date'      => $date,
                    'datetime'  => null,
                    'wl'        => null,
                    'discharge' => null,
                    'rain_mm'   => null,
                    'rain_sum'  => $rainSum !== null ? round($rainSum, 2) : null,
                ];
            }
        }

        if ($staCode) {
            return $this->respond(['data' => $result[0] ?? null]);
        }

        return $this->respond(['data' => $result]);
    }

    // 🟦 สรุปข้อมูลฝนรายวัน (ไม่แก้ไข)
    public function rain($date = null, $codeSegment = null)
    {
        $infoModel = new RainInfoModel();
        $dataModel = new RainModel();

        $staCode = $this->getCodeFilter('sta_code', $codeSegment);

        $isLatestMode = ($date === null);

        if ($isLatestMode) {
            $date = $this->getLatestDate(new RainModel(), $staCode, 'sta_code');
        }

        $yearStart = date('Y', strtotime($date)) . '-01-01';

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
            if ($isLatestMode) {
                $daily = $this->getLatestRecord(new RainModel(), $st['sta_code'], 'sta_code');
            } else {
                $daily = $this->whereDateAt7($dataModel, $st['sta_code'], $date, 'sta_code');
                if (!$daily) {
                    $yesterday = date('Y-m-d', strtotime($date . ' -1 day'));
                    $daily = $this->whereDateAt7($dataModel, $st['sta_code'], $yesterday, 'sta_code');
                }
            }

            $sumUntil = $isLatestMode && $daily ? $daily['datetime'] : $date . ' 07:00:00';

            $sumRain = $dataModel
                ->selectSum('rain_mm', 'total_rain')
                ->where('sta_code', $st['sta_code'])
                ->where('datetime >=', $yearStart . ' 07:00:00')
                ->where('datetime <=', $sumUntil)
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