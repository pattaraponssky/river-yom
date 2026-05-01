<?php

namespace App\Controllers;

use App\Models\EquipmentModel;
use App\Models\OperationLogModel;
use App\Models\MaintenanceRecordModel;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\API\ResponseTrait;

class Equipment extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\EquipmentModel';
    protected $format    = 'json';

    /**
     * GET /api/equipments
     * ดึงรายการอุปกรณ์ทั้งหมด
     */
    public function index()
    {
        $equipments = $this->model->findAll();

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงข้อมูลอุปกรณ์สำเร็จ',
            'data'    => $equipments,
            'count'   => count($equipments),
        ]);
    }

    /**
     * GET /api/equipments/{id}
     * ดึงข้อมูลอุปกรณ์เดี่ยว
     */
    public function show($id = null)
    {
        $equipment = $this->model->find($id);

        if (!$equipment) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงข้อมูลอุปกรณ์สำเร็จ',
            'data'    => $equipment,
        ]);
    }

    /**
     * POST /api/equipments
     * เพิ่มอุปกรณ์ใหม่
     */
    public function create()
    {
        $data = $this->request->getJSON(true);

        if (!$this->model->insert($data)) {
            return $this->failValidationErrors($this->model->errors());
        }

        $newId = $this->model->getInsertID();

        return $this->respondCreated([
            'status'  => 'success',
            'message' => 'เพิ่มอุปกรณ์สำเร็จ',
            'id'      => $newId,
        ]);
    }

    /**
     * PUT /api/equipments/{id}
     * แก้ไขอุปกรณ์
     */
    public function update($id = null)
    {
        $data = $this->request->getJSON(true);

        if (!$this->model->find($id)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        if (!$this->model->update($id, $data)) {
            return $this->failValidationErrors($this->model->errors());
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'แก้ไขอุปกรณ์สำเร็จ',
            'id'      => $id,
        ]);
    }

    /**
     * DELETE /api/equipments/{id}
     * ลบอุปกรณ์
     */
    public function delete($id = null)
    {
        if (!$this->model->find($id)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $this->model->delete($id);

        return $this->respondDeleted([
            'status'  => 'success',
            'message' => 'ลบอุปกรณ์สำเร็จ',
        ]);
    }

    /**
     * GET /api/equipments/{id}/logs
     * ดึงประวัติการทำงานของอุปกรณ์
     */
    public function logs($equipmentId = null)
    {
        $logModel = new OperationLogModel();

        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $logs = $logModel->where('equipment_id', $equipmentId)
                         ->orderBy('operation_date', 'DESC')
                         ->findAll();

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงประวัติการทำงานสำเร็จ',
            'data'    => $logs,
            'count'   => count($logs),
        ]);
    }

    /**
     * GET /api/equipments/{id}/maintenance
     * ดึงประวัติการบำรุงรักษาของอุปกรณ์
     */
    public function maintenance($equipmentId = null)
    {
        $maintenanceModel = new MaintenanceRecordModel();

        // ตรวจสอบว่าอุปกรณ์มีอยู่จริงหรือไม่
        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        // ดึงข้อมูลการบำรุงรักษาทั้งหมดของอุปกรณ์นี้
        $records = $maintenanceModel
            ->where('equipment_id', $equipmentId)
            ->orderBy('maintenance_date', 'DESC') // เรียงจากล่าสุดไปเก่าที่สุด
            ->findAll();

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงประวัติการบำรุงรักษาสำเร็จ',
            'data'    => $records,
            'count'   => count($records),
            'equipment_id' => $equipmentId,
        ]);
    }

    public function createMaintenance($equipmentId = null)
    {
        $maintenanceModel = new MaintenanceRecordModel();

        // ตรวจสอบอุปกรณ์มีอยู่จริง
        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $data = $this->request->getJSON(true);

        // Validate ข้อมูลที่จำเป็น
        if (empty($data['maintenance_date']) || empty($data['type']) || empty($data['status'])) {
            return $this->failValidationErrors('กรุณาระบุวันที่บำรุงรักษา, ประเภท และสถานะ');
        }

        // เติม equipment_id
        $data['equipment_id'] = $equipmentId;

        // แปลงวันที่ให้ถูกต้อง (ถ้าจำเป็น)
        if (!empty($data['maintenance_date'])) {
            $data['maintenance_date'] = date('Y-m-d', strtotime($data['maintenance_date']));
        }
        if (!empty($data['next_due_date'])) {
            $data['next_due_date'] = date('Y-m-d', strtotime($data['next_due_date']));
        }

        // บันทึก
        $insertedId = $maintenanceModel->insert($data);

        if (!$insertedId) {
            return $this->failValidationErrors($maintenanceModel->errors());
        }

        // ดึงข้อมูล record ที่เพิ่งสร้างเพื่อส่งกลับ
        $newRecord = $maintenanceModel->find($insertedId);

        return $this->respondCreated([
            'status'  => 'success',
            'message' => 'เพิ่มประวัติการบำรุงรักษาสำเร็จ',
            'data'    => $newRecord,
        ]);
    }

    public function updateMaintenance($equipmentId = null, $recordId = null)
    {
        $maintenanceModel = new MaintenanceRecordModel();

        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $record = $maintenanceModel->find($recordId);
        if (!$record || $record['equipment_id'] != $equipmentId) {
            return $this->failNotFound('ไม่พบประวัติการบำรุงรักษา');
        }

        $data = $this->request->getJSON(true);

        // จัดรูปแบบวันที่
        if (!empty($data['maintenance_date'])) {
            $data['maintenance_date'] = date('Y-m-d', strtotime($data['maintenance_date']));
        }
        if (!empty($data['next_due_date'])) {
            $data['next_due_date'] = date('Y-m-d', strtotime($data['next_due_date']));
        }

        if (!$maintenanceModel->update($recordId, $data)) {
            return $this->failValidationErrors($maintenanceModel->errors());
        }

        $updated = $maintenanceModel->find($recordId);

        return $this->respond([
            'status'  => 'success',
            'message' => 'แก้ไขประวัติการบำรุงรักษาสำเร็จ',
            'data'    => $updated,
        ]);
    }

    /**
     * DELETE /api/equipments/{equipmentId}/maintenance/{recordId}
     */
    public function deleteMaintenance($equipmentId = null, $recordId = null)
    {
        $maintenanceModel = new MaintenanceRecordModel();

        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $record = $maintenanceModel->find($recordId);
        if (!$record || $record['equipment_id'] != $equipmentId) {
            return $this->failNotFound('ไม่พบประวัติการบำรุงรักษา');
        }

        $maintenanceModel->delete($recordId);

        return $this->respondDeleted([
            'status'  => 'success',
            'message' => 'ลบประวัติการบำรุงรักษาสำเร็จ',
        ]);
    }
}