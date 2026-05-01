<?php
namespace App\Controllers;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;
use App\Models\ReservoirInfoModel;

class ReservoirInfo extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\ReservoirInfoModel';
    protected $format = 'json';

    // GET /api/reservoir_info
    public function index()
{
    $data = $this->model->getReservoirInfo(); // << เรียก method ที่คุณเขียนไว้
    return $this->respond(['data' => $data], 200);
}

    // POST /api/reservoir_info
    public function create()
    {
        $json = $this->request->getJSON(true);
        if (!$json) {
            return $this->failValidationErrors('Invalid JSON payload');
        }

        if ($this->model->insert($json)) {
            return $this->respondCreated(['status' => 'success', 'message' => 'เพิ่มข้อมูลสำเร็จ']);
        } else {
            return $this->fail($this->model->errors());
        }
    }

    // PUT /api/reservoir_info/{id}
    public function update($id = null)
    {
        $json = $this->request->getJSON(true);
        if (!$json) {
            return $this->failValidationErrors('Invalid JSON payload');
        }

        if ($this->model->update($id, $json)) {
            return $this->respond(['status' => 'success', 'message' => 'อัปเดตข้อมูลสำเร็จ']);
        } else {
            return $this->fail($this->model->errors());
        }
    }

    // DELETE /api/reservoir_info/{id}
    public function delete($id = null)
    {
        if (!$this->model->find($id)) {
            return $this->failNotFound('ไม่พบข้อมูลที่ต้องการลบ');
        }

        if ($this->model->delete($id)) {
            return $this->respondDeleted(['status' => 'success', 'message' => 'ลบข้อมูลสำเร็จ']);
        } else {
            return $this->failServerError('ลบข้อมูลไม่สำเร็จ');
        }
    }
}
