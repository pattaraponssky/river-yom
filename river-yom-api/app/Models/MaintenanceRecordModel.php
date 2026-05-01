<?php

namespace App\Models;

use CodeIgniter\Model;

class MaintenanceRecordModel extends Model
{
    protected $table            = 'maintenance_records';
    protected $primaryKey       = 'id';
    protected $allowedFields    = [
        'equipment_id', 'type', 'maintenance_date', 'technician_name', 'cost',
        'description', 'next_due_date', 'status'
    ];
    protected $useTimestamps    = true;
    protected $createdField     = 'created_at';
    protected $updatedField     = 'updated_at';
}