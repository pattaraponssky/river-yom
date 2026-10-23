<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class StationPhoto extends ResourceController
{
    use ResponseTrait;

    protected $format = 'json';

    private const MAX_SIZE = 5_000_000;

    private const ALLOWED_TYPES = [
        'rain'      => 'rain',
        'flow'      => 'flow',
        'gate'      => 'gate',
        'tele'      => 'tele',
        'reservoir' => 'reservoir',
        'sea'       => 'sea',
    ];

    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

    public function upload()
    {
        $type = (string) ($this->request->getPost('type') ?? 'station');
        $type = self::ALLOWED_TYPES[$type] ?? 'station';

        $code = (string) ($this->request->getPost('code') ?? '');
        $code = preg_replace('/[^A-Za-z0-9._-]/', '_', $code) ?: '';

        $file = $this->request->getFile('file');

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

        $extension = strtolower($file->getClientExtension() ?? '');
        if ($extension === '' || !in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            return $this->failValidationErrors([
                'file' => 'นามสกุลไฟล์ไม่รองรับ (อนุญาต: ' . implode(', ', self::ALLOWED_EXTENSIONS) . ')',
            ]);
        }

        if ($file->getSize() > self::MAX_SIZE) {
            return $this->failValidationErrors(['file' => 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5 MB)']);
        }

        $directory = rtrim(FCPATH, '/\\') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'stations' . DIRECTORY_SEPARATOR;

        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            return $this->failServerError('ไม่สามารถสร้างโฟลเดอร์ปลายทางได้');
        }

        $prefix = $type . ($code !== '' ? '_' . $code : '');
        $filename = $prefix . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $extension;

        try {
            $file->move($directory, $filename);
        } catch (\Throwable $e) {
            log_message('error', 'Station photo upload failed: ' . $e->getMessage());
            return $this->failServerError('เกิดข้อผิดพลาดระหว่างอัปโหลด');
        }

        $path = 'uploads/stations/' . $filename;

        return $this->respond([
            'status'  => 'success',
            'message' => 'อัปโหลดรูปภาพสำเร็จ',
            'data'    => [
                'path' => $path,
                'url'  => base_url($path),
            ],
        ]);
    }
}
