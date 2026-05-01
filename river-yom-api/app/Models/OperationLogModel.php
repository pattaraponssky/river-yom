<?php

namespace App\Models;

use CodeIgniter\Model;

class OperationLogModel extends Model
{
    protected $table            = 'operation_logs';
    protected $primaryKey       = 'id';
    protected $allowedFields    = [
        'equipment_id', 'operation_date', 'duration', 'operator_name', 'description',
        'status'
    ];
    protected $useTimestamps    = true;
    protected $createdField     = 'created_at';
}