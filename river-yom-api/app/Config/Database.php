<?php

namespace Config;

use CodeIgniter\Database\Config;

class Database extends Config
{
    /**
     * The directory that holds the Migrations and Seeds directories.
     */
    public string $filesPath = APPPATH . 'Database' . DIRECTORY_SEPARATOR;

    /**
     * Lets you choose which connection group to use if no other is specified.
     */
    public string $defaultGroup = 'default';

    public array $default = [
        'DSN'          => '',
        'hostname'     => '127.0.0.1',  // หรือ '127.0.0.1' หากการเชื่อมต่อไม่สำเร็จ
        'username'     => 'root',
        'password'     => '',
        'database'     => 'river_yom',
        'DBDriver'     => 'MySQLi',
        'port'         => 3306,
        'DBPrefix'     => '',           // ถ้ามี prefix ของตาราง
        'pConnect'     => false,        // การเชื่อมต่อที่ไม่คงที่ (false)
        'DBDebug'      => true,         // เปิดดีบักเพื่อแสดงข้อผิดพลาด
        'charset'      => 'utf8mb4',
        'DBCollat'     => 'utf8mb4_general_ci',
        'swapPre'      => '',
        'encrypt'      => false,        // ไม่เข้ารหัสข้อมูล
        'compress'     => false,        // ไม่ใช้การบีบอัดข้อมูล
        'strictOn'     => false,        // ปิดการใช้งาน strict mode
        'failover'     => [],
        'numberNative' => false,
        'foundRows'    => false,
        'dateFormat'   => [
            'date'     => 'Y-m-d',
            'datetime' => 'Y-m-d H:i:s',
            'time'     => 'H:i:s',
        ],
    ];

    // public array $default = [
    //     'DSN'          => '',
    //     'hostname'     => getenv('database.default.hostname'),
    //     'username'     => getenv('database.default.username'),
    //     'password'     => getenv('database.default.password'),
    //     'database'     => getenv('database.default.database'),
    //     'DBDriver'     => getenv('database.default.DBDriver'),
    //     'port'         => getenv('database.default.port'),
    //     'DBPrefix'     => '',           // ถ้ามี prefix ของตาราง
    //     'pConnect'     => false,        // การเชื่อมต่อที่ไม่คงที่ (false)
    //     'DBDebug'      => true,         // เปิดดีบักเพื่อแสดงข้อผิดพลาด
    //     'charset'      => 'utf8mb4',
    //     'DBCollat'     => 'utf8mb4_general_ci',
    //     'swapPre'      => '',
    //     'encrypt'      => false,        // ไม่เข้ารหัสข้อมูล
    //     'compress'     => false,        // ไม่ใช้การบีบอัดข้อมูล
    //     'strictOn'     => false,        // ปิดการใช้งาน strict mode
    //     'failover'     => [],
    //     'numberNative' => false,
    //     'foundRows'    => false,
    //     'dateFormat'   => [
    //         'date'     => 'Y-m-d',
    //         'datetime' => 'Y-m-d H:i:s',
    //         'time'     => 'H:i:s',
    //     ],
    // ];

    
    public function __construct()
    {
        parent::__construct();

        // Ensure that we always set the database group to 'tests' if
        // we are currently running an automated test suite, so that
        // we don't overwrite live data on accident.
        if (ENVIRONMENT === 'testing') {
            $this->defaultGroup = 'tests';
        }
    }
}
