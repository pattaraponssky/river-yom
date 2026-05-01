<?php

namespace App\Models;

use CodeIgniter\Model;

class EquipmentModel extends Model
{
    protected $table            = 'equipments';
    protected $primaryKey       = 'id';
    protected $allowedFields    = [
        'name', 'type', 'location', 'latitude', 'longitude',
        'purchase_date', 'warranty_expiry', 'status'
    ];
    protected $useTimestamps    = true;
    protected $createdField     = 'created_at';
    protected $updatedField     = 'updated_at';
}