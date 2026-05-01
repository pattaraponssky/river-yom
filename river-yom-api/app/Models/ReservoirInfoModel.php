<?php
namespace App\Models;

use CodeIgniter\Model;

class ReservoirInfoModel extends Model
{
    protected $table = 'reservoir_info';
    protected $primaryKey = 'res_code'; // ✅ ใช้ชื่อคอลัมน์ primary key จริง

    protected $useAutoIncrement = false; // ❌ ปิดเพราะ res_code ไม่ใช่ AUTO_INCREMENT

    protected $returnType = 'array';
    protected $allowedFields = [
        'res_code', 'rid_code', 'res_name', 'tambon', 'district', 'province',
        'type', 'size', 'owner', 'long', 'lat', 'da_km2', 'maxvol', 'nhvol', 'minvol',
        'maxwl', 'nhwl', 'minwl', 'inflow_avg'
    ];

    public function getReservoirInfo()
    {
        return $this->db->table('reservoir_info')
                        ->orderBy('CAST(no AS UNSIGNED)', 'ASC')
                        ->get()
                        ->getResultArray();
    }
}
