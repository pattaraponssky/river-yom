<?php

namespace App\Models;

use CodeIgniter\Model;

class AboutUsModel extends Model
{
    protected $table = 'about_us'; // ชื่อตารางของคุณ
    protected $primaryKey = 'id'; // ปรับตามตารางคุณ
    protected $allowedFields = ['about_us', 'contact', 'address'];
    public $useTimestamps = false;
}
