<?php
namespace App\Models;

use CodeIgniter\Model;

class SeaInfoModel extends Model
{
    protected $table = 'sea_info';
    protected $primaryKey = 'sta_code'; // ✅ ใช้ชื่อคอลัมน์ primary key จริง
    protected $useAutoIncrement = false; // ❌ ปิดเพราะ res_code ไม่ใช่ AUTO_INCREMENT
    protected $returnType = 'array';
    protected $allowedFields = [
        'sta_code', 'name','tambon', 'district', 'province', 'long', 'lat'
    ];
}
