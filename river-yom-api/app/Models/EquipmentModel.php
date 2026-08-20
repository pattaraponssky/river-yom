<?php

namespace App\Models;

use CodeIgniter\Model;

class EquipmentModel extends Model
{
    protected $table            = 'equipment';               // เปลี่ยนจาก equipments -> equipment
    protected $primaryKey       = 'id';
    protected $allowedFields    = [
        'sta_code',        
        'name',            
        'type',            
        'serial_number',
        'brand_model',
        'purchase_date',
        'warranty_expiry',
        'photo',
        'status',          // active, maintenance, broken, retired
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $validationRules = [
        'sta_code' => 'required|max_length[20]',
        'name'     => 'required|max_length[150]',
        'type'     => 'required|in_list[radar_sensor,rain_gauge,camera,solar_panel,battery,datalogger,gate_actuator,network,other]',
        'status'   => 'permit_empty|in_list[active,maintenance,broken,retired]',
    ];

    protected $validationMessages = [
        'sta_code' => [
            'required' => 'กรุณาระบุรหัสสถานี (sta_code)',
        ],
        'name' => [
            'required' => 'กรุณาระบุชื่ออุปกรณ์',
        ],
        'type' => [
            'required' => 'กรุณาระบุประเภทอุปกรณ์',
            'in_list'  => 'ประเภทอุปกรณ์ไม่ถูกต้อง',
        ],
    ];

    /**
     * ดึงอุปกรณ์ของสถานีเดียว พร้อมวันที่บำรุงรักษาล่าสุด (ใช้แสดงในหน้ารายละเอียดสถานี)
     */
    public function findByStation(string $staCode): array
    {
        $builder = $this->db->table('equipment e');
        $builder->select('e.*, m.last_maintenance_date');
        $builder->join(
            '(SELECT equipment_id, MAX(maintenance_date) AS last_maintenance_date
              FROM maintenance_records GROUP BY equipment_id) m',
            'm.equipment_id = e.id',
            'left'
        );
        $builder->where('e.sta_code', $staCode);
        $builder->orderBy('e.created_at', 'ASC');

        return $builder->get()->getResultArray();
    }
}