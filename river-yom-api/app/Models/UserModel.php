<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'user';
    protected $primaryKey = 'User_ID';
    protected $allowedFields = ['Username', 'Password', 'Name', 'email', 'CreateDate', 'Status', 'iduser_level', 'reset_token','reset_expires_at'];

}
