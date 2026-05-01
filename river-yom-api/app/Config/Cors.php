<?php
namespace Config;

use CodeIgniter\Config\BaseConfig;
class Cors extends BaseConfig
{
    public array $default = [
        'allowedOrigins' => ['http://localhost:5173', 'http://localhost:3000'],
        // 'allowedOriginsPatterns' => ['.*'], // อนุญาตทุก Origin โดยใช้ Regex
        'allowedOriginsPatterns' => [],
        'supportsCredentials' => true,
        'allowedHeaders' => ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-TOKEN'],
        'exposedHeaders' => [],
        'allowedMethods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // เพิ่ม OPTIONS ด้วย
        'maxAge' => 7200,
    ];
}
