<?php

namespace App\Controllers;

use App\Models\FlowInfoModel;
use App\Models\FlowModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class EmailAlertController extends ResourceController
{
    // เกณฑ์การแจ้งเตือน (ต้องตรงกับ warningData ใน frontend)
    private $thresholds = [
        'Y.4'  => ['watch' => 49.6, 'alert' => 50.5, 'crisis' => 51.4],
        'Y.15' => ['watch' => 43.5, 'alert' => 44.7, 'crisis' => 46.0],
        'Y.50' => ['watch' => 39.5, 'alert' => 40.5, 'crisis' => 41.5],
        'Y.16' => ['watch' => 37.6, 'alert' => 38.4, 'crisis' => 39.3],
        'Y.64' => ['watch' => 36.7, 'alert' => 37.3, 'crisis' => 38.0],
        'Y.51' => ['watch' => 38.8, 'alert' => 40.4, 'crisis' => 42.0],
        'Y.17' => ['watch' => 39.4, 'alert' => 40.6, 'crisis' => 41.8],
    ];

    private $dischargeThresholds = [
        'Y.4'  => ['watch' => 320, 'alert' => 450, 'crisis' => 600],
        'Y.15' => ['watch' => 250, 'alert' => 400, 'crisis' => 500],
        'Y.50' => ['watch' => 250, 'alert' => 300, 'crisis' => 350],
        'Y.16' => ['watch' => 180, 'alert' => 220, 'crisis' => 260],
        'Y.64' => ['watch' => 180, 'alert' => 240, 'crisis' => 300],
        'Y.51' => ['watch' => 530, 'alert' => 800, 'crisis' => 900],
        'Y.17' => ['watch' => 600, 'alert' => 720, 'crisis' => 850],
    ];

    /**
     * เรียกโดย Cron Job ทุกวัน 08:30
     * GET /jobs/dailyFloodAlert
     */
    public function sendDailyAlert()
    {
        $infoModel = new FlowInfoModel();
        $dataModel = new FlowModel();
        $userModel = new UserModel();

        // 1. ดึงข้อมูลวันล่าสุด
        $latest = $dataModel->selectMax('date')->first();
        $date = $latest ? $latest['date'] : date('Y-m-d');

        // 2. ตรวจสอบแต่ละสถานี
        $alerts = [];
        $flows = $infoModel->findAll();

        foreach ($flows as $flow) {
            $sta_code = $flow['sta_code'];
            $daily = $dataModel
                ->where('sta_code', $sta_code)
                ->where('date', $date)
                ->first();

            if (!$daily) continue;

            $wl = (float)$daily['wl'];
            $discharge = (float)$daily['discharge'];
            $wlLevel = $this->getAlertLevel($wl, $sta_code, 'wl');
            $dischargeLevel = $this->getAlertLevel($discharge, $sta_code, 'discharge');

            // แจ้งเตือนเฉพาะสถานีที่มีค่าเกินเกณฑ์ watch ขึ้นไป
            if ($wlLevel !== 'normal' || $dischargeLevel !== 'normal') {
                $alerts[] = [
                    'sta_code'      => $sta_code,
                    'sta_name'      => $flow['sta_name'],
                    'province'      => $flow['province'],
                    'date'          => $date,
                    'wl'            => $wl,
                    'discharge'     => $discharge,
                    'wl_level'      => $wlLevel,
                    'discharge_level' => $dischargeLevel,
                    'wl_threshold'  => $this->thresholds[$sta_code] ?? null,
                    'dis_threshold' => $this->dischargeThresholds[$sta_code] ?? null,
                ];
            }
        }

        // 3. ถ้าไม่มีการแจ้งเตือน → ส่งอีเมลสรุปปกติ (optional)
        $hasAlert = !empty($alerts);

        // 4. ดึง email ของ users ทุกคนในระบบ
        $users = $userModel->where('Status', 1)->findAll(); // เฉพาะ active users
        if (empty($users)) {
            return $this->respond(['message' => 'ไม่พบผู้ใช้ในระบบ']);
        }

        $sentCount = 0;
        foreach ($users as $user) {
            if (empty($user['email'])) continue;

            $this->sendAlertEmail(
                $user['email'],
                $user['Name'] ?? $user['Username'],
                $alerts,
                $date,
                $hasAlert
            );
            $sentCount++;
        }

        return $this->respond([
            'status'      => 'success',
            'date'        => $date,
            'alert_count' => count($alerts),
            'sent_to'     => $sentCount,
            'alerts'      => $alerts,
        ]);
    }

    /**
     * ตรวจสอบระดับการแจ้งเตือน
     */
    private function getAlertLevel(float $value, string $sta_code, string $type): string
    {
        $thresholds = $type === 'wl'
            ? ($this->thresholds[$sta_code] ?? null)
            : ($this->dischargeThresholds[$sta_code] ?? null);

        if (!$thresholds) return 'normal';

        if ($value >= $thresholds['crisis']) return 'crisis';
        if ($value >= $thresholds['alert'])  return 'alert';
        if ($value >= $thresholds['watch'])  return 'watch';
        return 'normal';
    }

    /**
     * ส่งอีเมล
     */
    private function sendAlertEmail(
        string $toEmail,
        string $toName,
        array $alerts,
        string $date,
        bool $hasAlert
    ): bool {
        $email = \Config\Services::email();

        $email->setFrom('dbtech.engineering.5@gmail.com', 'ระบบติดตามสถานการณ์น้ำพื้นที่ฝั่งขวาของแม่น้ำยม');
        $email->setTo($toEmail);

        $subject = $hasAlert
            ? '⚠️ แจ้งเตือน: ตรวจพบระดับน้ำเกินเกณฑ์ ' . $this->formatThaiDate($date)
            : '📊 รายงานสถานการณ์น้ำประจำวัน ' . $this->formatThaiDate($date);

        $email->setSubject($subject);
        $email->setMessage($this->buildEmailHtml($toName, $alerts, $date, $hasAlert));
        $email->setMailType('html');

        return $email->send();
    }

    /**
     * สร้าง HTML อีเมล
     */
    private function buildEmailHtml(
        string $name,
        array $alerts,
        string $date,
        bool $hasAlert
    ): string {
        $dateStr = $this->formatThaiDate($date);
        $levelColors = [
            'crisis' => '#D32F2F',
            'alert'  => '#FF8F00',
            'watch'  => '#F9A825',
            'normal' => '#388E3C',
        ];
        $levelLabels = [
            'crisis' => '🔴 วิกฤต',
            'alert'  => '🟠 เตือนภัย',
            'watch'  => '🟡 เฝ้าระวัง',
            'normal' => '🟢 ปกติ',
        ];

        $headerColor = $hasAlert ? '#D32F2F' : '#1565C0';
        $headerText  = $hasAlert
            ? '⚠️ แจ้งเตือนสถานการณ์น้ำ'
            : '📊 รายงานสถานการณ์น้ำประจำวัน';

        // สร้างตาราง Alert
        $tableRows = '';
        if (!empty($alerts)) {
            foreach ($alerts as $a) {
                $wlColor  = $levelColors[$a['wl_level']] ?? '#388E3C';
                $disColor = $levelColors[$a['discharge_level']] ?? '#388E3C';
                $wlLabel  = $levelLabels[$a['wl_level']] ?? '🟢 ปกติ';
                $disLabel = $levelLabels[$a['discharge_level']] ?? '🟢 ปกติ';

                $wlCrisis  = $a['wl_threshold']['crisis'] ?? '-';
                $disCrisis = $a['dis_threshold']['crisis'] ?? '-';

                $tableRows .= "
                <tr>
                    <td style='padding:10px;border:1px solid #ddd;font-weight:bold;'>{$a['sta_code']}</td>
                    <td style='padding:10px;border:1px solid #ddd;'>{$a['sta_name']}</td>
                    <td style='padding:10px;border:1px solid #ddd;'>{$a['province']}</td>
                    <td style='padding:10px;border:1px solid #ddd;text-align:center;'>
                        <span style='font-weight:bold;color:{$wlColor};font-size:1.1em;'>{$a['wl']} ม.รทก.</span><br>
                        <small style='color:#666;'>เกณฑ์วิกฤต: {$wlCrisis} ม.รทก.</small><br>
                        <span style='background:{$wlColor};color:#fff;padding:2px 8px;border-radius:12px;font-size:0.85em;'>{$wlLabel}</span>
                    </td>
                    <td style='padding:10px;border:1px solid #ddd;text-align:center;'>
                        <span style='font-weight:bold;color:{$disColor};font-size:1.1em;'>{$a['discharge']} ลบ.ม./วิ</span><br>
                        <small style='color:#666;'>เกณฑ์วิกฤต: {$disCrisis} ลบ.ม./วิ</small><br>
                        <span style='background:{$disColor};color:#fff;padding:2px 8px;border-radius:12px;font-size:0.85em;'>{$disLabel}</span>
                    </td>
                </tr>";
            }
        } else {
            $tableRows = "<tr><td colspan='5' style='padding:16px;text-align:center;color:#388E3C;font-size:1.1em;'>✅ ไม่พบสถานีที่มีระดับน้ำเกินเกณฑ์ในวันนี้</td></tr>";
        }

        return "
<!DOCTYPE html>
<html lang='th'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0;padding:0;background:#F5F5F5;font-family:\"Segoe UI\",Arial,sans-serif;'>
<table width='100%' bgcolor='#F5F5F5' cellpadding='0' cellspacing='0'>
<tr><td align='center' style='padding:24px 0;'>
<table width='640' style='background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);'>

    <!-- Header -->
    <tr>
        <td bgcolor='{$headerColor}' style='padding:28px 32px;'>
            <h1 style='color:#fff;margin:0;font-size:1.4em;'>{$headerText}</h1>
            <p style='color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:0.95em;'>วันที่ {$dateStr}</p>
        </td>
    </tr>

    <!-- Greeting -->
    <tr>
        <td style='padding:24px 32px 12px;'>
            <p style='margin:0;color:#333;font-size:1em;'>เรียน คุณ {$name}</p>
            <p style='margin:10px 0 0;color:#555;line-height:1.6;'>
                " . ($hasAlert
                    ? "ระบบตรวจพบสถานีวัดน้ำท่าที่มีระดับน้ำ <strong>เกินเกณฑ์การเฝ้าระวัง</strong> กรุณาตรวจสอบและดำเนินการตามความเหมาะสม"
                    : "รายงานสถานการณ์น้ำประจำวัน ทุกสถานีอยู่ในเกณฑ์ปกติ") . "
            </p>
        </td>
    </tr>

    <!-- Summary Badge -->
    " . ($hasAlert ? "
    <tr>
        <td style='padding:0 32px 16px;'>
            <div style='background:#FFF3E0;border-left:4px solid #FF8F00;padding:12px 16px;border-radius:4px;'>
                <strong style='color:#E65100;'>⚠️ พบ " . count($alerts) . " สถานีที่ต้องเฝ้าระวัง</strong>
            </div>
        </td>
    </tr>" : "") . "

    <!-- Alert Table -->
    <tr>
        <td style='padding:0 32px 24px;'>
            <table width='100%' cellpadding='0' cellspacing='0'
                   style='border-collapse:collapse;font-size:0.9em;'>
                <thead>
                    <tr style='background:#1565C0;color:#fff;'>
                        <th style='padding:10px 12px;text-align:left;border:1px solid #1976D2;'>รหัสสถานี</th>
                        <th style='padding:10px 12px;text-align:left;border:1px solid #1976D2;'>ชื่อสถานี</th>
                        <th style='padding:10px 12px;text-align:left;border:1px solid #1976D2;'>จังหวัด</th>
                        <th style='padding:10px 12px;text-align:center;border:1px solid #1976D2;'>ระดับน้ำ (ม.รทก.)</th>
                        <th style='padding:10px 12px;text-align:center;border:1px solid #1976D2;'>อัตราการไหล (ลบ.ม./วิ)</th>
                    </tr>
                </thead>
                <tbody>
                    {$tableRows}
                </tbody>
            </table>
        </td>
    </tr>

    <!-- Legend -->
    <tr>
        <td style='padding:0 32px 16px;'>
            <p style='margin:0 0 8px;color:#666;font-size:0.85em;font-weight:bold;'>เกณฑ์การแจ้งเตือน:</p>
            <span style='background:#F9A825;color:#fff;padding:3px 10px;border-radius:12px;font-size:0.82em;margin-right:6px;'>🟡 เฝ้าระวัง</span>
            <span style='background:#FF8F00;color:#fff;padding:3px 10px;border-radius:12px;font-size:0.82em;margin-right:6px;'>🟠 เตือนภัย</span>
            <span style='background:#D32F2F;color:#fff;padding:3px 10px;border-radius:12px;font-size:0.82em;'>🔴 วิกฤต</span>
        </td>
    </tr>

    <!-- CTA Button -->
    <tr>
        <td style='padding:0 32px 24px;'>
            <a href='https://yourdomain.com/dashboard'
               style='display:inline-block;background:#1565C0;color:#fff;padding:12px 28px;
                      border-radius:8px;text-decoration:none;font-weight:bold;font-size:0.95em;'>
                🔍 ดูรายละเอียดในระบบ
            </a>
        </td>
    </tr>

    <!-- Footer -->
    <tr>
        <td bgcolor='#F5F5F5' style='padding:16px 32px;text-align:center;'>
            <p style='margin:0;color:#999;font-size:0.82em;'>
                อีเมลนี้ส่งโดยอัตโนมัติจากระบบติดตามสถานการณ์น้ำ สำนักชลประทานที่ 3<br>
                กรุณาอย่าตอบกลับอีเมลฉบับนี้
            </p>
        </td>
    </tr>

</table>
</td></tr>
</table>
</body>
</html>";
    }

    private function formatThaiDate(string $date): string
    {
        $months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                   'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        $ts = strtotime($date);
        $d  = (int)date('j', $ts);
        $m  = (int)date('n', $ts);
        $y  = (int)date('Y', $ts) + 543;
        return "{$d} {$months[$m]} {$y}";
    }

    /**
     * Preview อีเมล (สำหรับ Admin ทดสอบ)
     * GET /jobs/previewAlert
     */
    public function previewAlert()
    {
        return $this->sendDailyAlert();
    }
}