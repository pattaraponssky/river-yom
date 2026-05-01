<?php

namespace App\Controllers;

use App\Models\AboutUsModel;
use CodeIgniter\RESTful\ResourceController;

class AboutUs extends ResourceController
{
    protected $modelName = 'App\Models\AboutUsModel';
    protected $format    = 'json';

    // ดึงข้อมูล (เช่นแถวแรก)
    public function index()
    {
        $data = $this->model->first(); // สมมุติมีข้อมูลแถวเดียว
        return $this->respond($data);
    }

    // แก้ไขข้อมูล (อัปเดต row แรก)
    public function update($id = null)
    {
        $json = $this->request->getJSON(true); // รับแบบ JSON
        $updateData = [
            'about_us' => $json['about_us'] ?? '',
            'contact' => $json['contact'] ?? '',
            'address' => $json['address'] ?? '',
        ];

        $this->model->update($id, $updateData);
        return $this->respond(['message' => 'อัปเดตข้อมูลสำเร็จ']);
    }
}
