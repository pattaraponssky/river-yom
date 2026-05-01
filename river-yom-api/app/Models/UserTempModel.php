<?php

namespace App\Models;

use CodeIgniter\Model;

class UserTempModel extends Model
{
   protected $table            = 'user_temp';
    protected $primaryKey       = 'User_ID'; // หรือชื่อ PK ของคุณ
    protected $useAutoIncrement = true;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;    protected $allowedFields = [
        'Username', 'Name', 'email', 'Password', 'CreateDate', 'Status', 'iduser_level' ,'verification_token',
        'token_expires_at',
    ];
}
