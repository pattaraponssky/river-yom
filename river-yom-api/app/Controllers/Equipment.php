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
     * GET /api/equipments?sta_code=YR.01   <-- ใช้ในหน้ารายละเอียดสถานี
     * ดึงรายการอุปกรณ์ทั้งหมด หรือกรองตามสถานี
     */
    public function index()
    {
        $staCode = $this->request->getGet('sta_code');

        if (!empty($staCode)) {
            $equipments = $this->model->findByStation($staCode);
        } else {
            $equipments = $this->model->findAll();
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'ดึงข้อมูลอุปกรณ์สำเร็จ',
            'data'    => $equipments,
            'count'   => count($equipments),
        ]);
    }

    /**
     * GET /api/equipments/station/{sta_code}
     * เช่น GET /api/equipments/station/YR.01
     */
    public function byStation($staCode = null)
    {
        if (empty($staCode)) {
            return $this->fail('กรุณาระบุรหัสสถานี (sta_code)');
        }

        $equipments = $this->model->findByStation($staCode);

        return $this->respond([
            'status'   => 'success',
            'message'  => 'ดึงข้อมูลอุปกรณ์ของสถานีสำเร็จ',
            'sta_code' => $staCode,
            'data'     => $equipments,
            'count'    => count($equipments),
        ]);
    }

    /**
     * GET /api/equipments/{id}
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
     * body: { sta_code, name, type, serial_number?, brand_model?, purchase_date?,
     *         warranty_expiry?, photo?, status? }
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
            'data'    => $this->model->find($newId),
        ]);
    }

    /**
     * POST /api/equipments/update/{id}  (ตาม route เดิมที่ใช้ POST แทน PUT)
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
            'data'    => $this->model->find($id),
        ]);
    }

    /**
     * POST /api/equipments/delete/{id}
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
     */
    public function maintenance($equipmentId = null)
    {
        $maintenanceModel = new MaintenanceRecordModel();

        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $records = $maintenanceModel
            ->where('equipment_id', $equipmentId)
            ->orderBy('maintenance_date', 'DESC')
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

        if (!$this->model->find($equipmentId)) {
            return $this->failNotFound('ไม่พบอุปกรณ์');
        }

        $data = $this->request->getJSON(true);

        if (empty($data['maintenance_date']) || empty($data['type']) || empty($data['status'])) {
            return $this->failValidationErrors('กรุณาระบุวันที่บำรุงรักษา, ประเภท และสถานะ');
        }

        $data['equipment_id'] = $equipmentId;

        if (!empty($data['maintenance_date'])) {
            $data['maintenance_date'] = date('Y-m-d', strtotime($data['maintenance_date']));
        }
        if (!empty($data['next_due_date'])) {
            $data['next_due_date'] = date('Y-m-d', strtotime($data['next_due_date']));
        }

        $insertedId = $maintenanceModel->insert($data);

        if (!$insertedId) {
            return $this->failValidationErrors($maintenanceModel->errors());
        }

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