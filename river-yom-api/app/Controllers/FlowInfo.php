<?php
namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class FlowInfo extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\FlowInfoModel';
    protected $format    = 'json';

    // GET: /api/reservoir_info
    public function index()
    {
        $data = $this->model->findAll();
        return $this->respond(['data' => $data], 200);
    }

    // GET: /api/reservoir_info/{id}
    public function show($id = null)
    {
        $data = $this->model->find($id);
        if ($data) {
            return $this->respond(['data' => $data]);
        } else {
            return $this->failNotFound('ไม่พบข้อมูลที่ต้องการแสดง');
        }
    }

    // POST: /api/reservoir_info
    public function create()
    {
        $data = $this->request->getJSON(true);
        if (!$data) {
            return $this->failValidationErrors('Payload ไม่ถูกต้อง');
        }

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        return $this->respondCreated(['status' => 'success', 'message' => 'เพิ่มข้อมูลสำเร็จ']);
    }

    // PUT/PATCH: /api/reservoir_info/{id}
    public function update($id = null)
    {
        $data = $this->request->getJSON(true);
        if (!$data) {
            return $this->failValidationErrors('Payload ไม่ถูกต้อง');
        }

        if (!$this->model->find($id)) {
            return $this->failNotFound('ไม่พบข้อมูลที่ต้องการแก้ไข');
        }

        if (!$this->model->update($id, $data)) {
            return $this->fail($this->model->errors());
        }

        return $this->respond(['status' => 'success', 'message' => 'อัปเดตข้อมูลสำเร็จ']);
    }

    // DELETE: /api/reservoir_info/{id}
    public function delete($id = null)
    {
        if (!$this->model->find($id)) {
            return $this->failNotFound('ไม่พบข้อมูลที่ต้องการลบ');
        }

        if (!$this->model->delete($id)) {
            return $this->failServerError('เกิดข้อผิดพลาดในการลบข้อมูล');
        }

        return $this->respondDeleted(['status' => 'success', 'message' => 'ลบข้อมูลสำเร็จ']);
    }
}
