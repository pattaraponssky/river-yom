<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;

class Report extends ResourceController
{
    protected $format = 'json';

    /** ชนิดไฟล์ที่อนุญาตอัปโหลด */
    private array $allowed = [
        '3dams'       => [
            'name' => '3dams.jpg',
            'ext'  => ['jpg', 'jpeg', 'png'],
            'max'  => 5_000_000,
        ],
        'onepages'    => [
            'name' => 'onepages.jpg',
            'ext'  => ['jpg', 'jpeg', 'png'],
            'max'  => 5_000_000,
        ],
        'dailyreport' => [
            'name' => 'dailyreport.jpg',
            'ext'  => ['jpg', 'jpeg', 'png'],
            'max'  => 5_000_000,
        ],
        'report'      => [
            'name' => 'report.pdf',
            'ext'  => ['pdf'],
            'max'  => 20_000_000,
        ],
        'rpt'         => [
            'name' => 'rpt.pdf',
            'ext'  => ['pdf'],
            'max'  => 20_000_000,
        ],
    ];

    /**
     * POST /api/report/upload
     * form-data:
     *   - type: 3dams|onepages|dailyreport|report|rpt
     *   - file: ไฟล์อัปโหลด
     */
    public function upload()
    {
        // TODO: ตรวจ login / role
        // if (! $this->isAdmin()) {
        //     return $this->failUnauthorized('ไม่มีสิทธิ์อัปโหลด');
        // }

        $type = $this->request->getPost('type');
        $file = $this->request->getFile('file');

        if (!$type || !isset($this->allowed[$type])) {
            return $this->failValidationErrors(['type' => 'ประเภทไฟล์ไม่ถูกต้อง']);
        }

        if ($file === null) {
            return $this->failValidationErrors(['file' => 'ไม่พบไฟล์ที่อัปโหลด']);
        }

        if (!$file->isValid()) {
            return $this->failValidationErrors([
                'file' => $file->getErrorString() . ' (' . $file->getError() . ')',
            ]);
        }

        if ($file->hasMoved()) {
            return $this->failValidationErrors(['file' => 'ไฟล์ถูกย้ายไปแล้ว']);
        }

        $cfg = $this->allowed[$type];
        $ext = strtolower($file->getClientExtension() ?? '');

        if ($ext === '' || !in_array($ext, $cfg['ext'], true)) {
            return $this->failValidationErrors([
                'file' => 'นามสกุลไฟล์ไม่รองรับ (อนุญาต: ' . implode(', ', $cfg['ext']) . ')',
            ]);
        }

        if ($file->getSize() > $cfg['max']) {
            $maxMb = round($cfg['max'] / 1_000_000, 1);
            return $this->failValidationErrors([
                'file' => "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด {$maxMb} MB)",
            ]);
        }

        $destDir = rtrim(FCPATH, '/\\') . DIRECTORY_SEPARATOR . 'report_rid03' . DIRECTORY_SEPARATOR;

        if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
            return $this->failServerError('ไม่สามารถสร้างโฟลเดอร์ปลายทางได้');
        }

        $destName  = $cfg['name'];
        $tmpName   = $destName . '.tmp';
        $tmpPath   = $destDir . $tmpName;
        $finalPath = $destDir . $destName;

        // ย้ายไป temp ก่อน แล้ว rename (atomic write)
        try {
            if (!$file->move($destDir, $tmpName, true)) {
                return $this->failServerError('อัปโหลดไม่สำเร็จ');
            }

            if (!is_file($tmpPath)) {
                return $this->failServerError('ไม่พบไฟล์ชั่วคราวหลังอัปโหลด');
            }

            // ลบไฟล์ปลายทางเดิมก่อน (บาง OS rename ทับไม่ได้)
            if (is_file($finalPath)) {
                @unlink($finalPath);
            }

            if (!rename($tmpPath, $finalPath)) {
                @unlink($tmpPath);
                return $this->failServerError('บันทึกไฟล์ปลายทางไม่สำเร็จ');
            }
        } catch (\Throwable $e) {
            if (is_file($tmpPath)) {
                @unlink($tmpPath);
            }
            log_message('error', 'Report upload failed: ' . $e->getMessage());
            return $this->failServerError('เกิดข้อผิดพลาดระหว่างอัปโหลด');
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'อัปโหลดสำเร็จ',
            'data'    => [
                'type'       => $type,
                'file'       => $destName,
                'size'       => filesize($finalPath),
                'updated_at' => date('Y-m-d H:i:s', filemtime($finalPath)),
                'url'        => base_url('report_rid03/' . $destName),
            ],
        ]);
    }

    /**
     * GET /api/report/files
     */
    public function listFiles()
    {
        $dir = rtrim(FCPATH, '/\\') . DIRECTORY_SEPARATOR . 'report_rid03' . DIRECTORY_SEPARATOR;
        $names = ['3dams.jpg', 'onepages.jpg', 'dailyreport.jpg', 'report.pdf', 'rpt.pdf'];
        $data = [];

        foreach ($names as $name) {
            $path = $dir . $name;
            $exists = is_file($path);

            $data[] = [
                'file'       => $name,
                'exists'     => $exists,
                'size'       => $exists ? filesize($path) : null,
                'updated_at' => $exists ? date('Y-m-d H:i:s', filemtime($path)) : null,
                'url'        => $exists ? base_url('report_rid03/' . $name) : null,
            ];
        }

        return $this->respond([
            'status' => 'success',
            'data'   => $data,
        ]);
    }
}