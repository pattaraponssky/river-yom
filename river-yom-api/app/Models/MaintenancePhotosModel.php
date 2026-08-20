<?php

namespace App\Models;

use CodeIgniter\Model;

class MaintenancePhotosModel extends Model
{
    protected $table            = 'maintenance_photos';
    protected $primaryKey       = 'id';
    protected $allowedFields    = [
        'maintenance_id',  'photo_url', 'caption'
    ];
    protected $useTimestamps    = true;
    protected $createdField     = 'created_at';
}