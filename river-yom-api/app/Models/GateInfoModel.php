<?php
namespace App\Models;

use CodeIgniter\Model;

class GateInfoModel extends Model
{
    protected $table = 'gate_info';
    protected $primaryKey = 'sta_code'; // ✅ ใช้ชื่อคอลัมน์ primary key จริง

    protected $useAutoIncrement = false; // ❌ ปิดเพราะ res_code ไม่ใช่ AUTO_INCREMENT

    protected $returnType = 'array';
    protected $allowedFields = [
        'sta_code', 'sta_name', 'tambon', 'district', 'province', 'capacity', 'lat', 'long'
    ];
}
