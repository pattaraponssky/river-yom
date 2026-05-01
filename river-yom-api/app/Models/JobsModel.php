<?php

namespace App\Models;

use CodeIgniter\Model;

class JobsModel extends Model
{
    protected $table = 'reservoir_data';
    protected $primaryKey = ''; // ไม่ต้องกำหนด primaryKey
    protected $useAutoIncrement = false;
    protected $allowedFields = ['res_code', 'date', 'volume', 'inflow', 'outflow'];
    public $timestamps = false;
}
