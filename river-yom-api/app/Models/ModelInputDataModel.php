<?php

namespace App\Models;

use CodeIgniter\Model;

class ModelInputDataModel extends Model
{
    protected $table = 'model_input_data'; // ชื่อตารางของคุณ
    protected $primaryKey = 'id'; // คีย์หลักอัตโนมัติ (แต่เราใช้คีย์ร่วมในการค้นหา)

    protected $allowedFields = [
        'sta_code',
        'date',
        'data_type',
        'value',
        'is_manual', // Flag สำหรับการป้อนด้วยมือ
        // เพิ่ม fields อื่นๆ ที่เกี่ยวข้อง
    ];

    /**
     * ดำเนินการ UPSERT (Update/Insert) ข้อมูล
     * * @param array $data ข้อมูลที่ต้องการบันทึก/อัปเดต (ต้องมี sta_code, date, data_type, value)
     * @param bool $isManual ระบุว่าเป็นข้อมูลที่ป้อนด้วยมือหรือไม่ (TRUE/FALSE)
     * @return bool
     */
    public function upsertData(array $data, bool $isManual = TRUE): bool
    {
        // 1. กำหนดคีย์หลักร่วม (Composite Key) สำหรับการค้นหา
        $sta_code = $data['sta_code'];
        $date = $data['date'];
        $data_type = $data['data_type'];

        // 2. ค้นหา Record ที่มีอยู่
        $existingRecord = $this->where([
            'sta_code'  => $sta_code,
            'date' => $date,
            'data_type' => $data_type,
        ])->first();

        // 3. เตรียมข้อมูลที่จะใช้ในการบันทึก/อัปเดต
        $saveData = [
            'sta_code'  => $sta_code,
            'date' => $date,
            'data_type' => $data_type,
            'value'     => $data['value'],
            'is_manual' => $isManual, // ใช้ค่า isManual ที่กำหนดเข้ามา
        ];

        if ($existingRecord) {
            // A. UPDATE: ถ้าพบ Record อยู่แล้ว ให้อัปเดตเฉพาะ id นั้น
            
            // เปรียบเทียบค่าแบบตัวเลข (Float) เพื่อตรวจสอบว่า Value มีการเปลี่ยนแปลงหรือไม่
            $valueIsSame = (float) $existingRecord['value'] === (float) $data['value'];

            // 1. การป้องกัน Manual Entry (เมื่อ Auto-Sync พยายามเขียนทับ)
            if ($existingRecord['is_manual'] && $isManual === FALSE) {
                // ข้อมูลเดิมเป็น Manual และพยายามซิงค์ทับ: Skip ไม่ทำอะไร
                return TRUE;
            }
            
            // 2. Optimization (เมื่อ Auto-Sync มีค่าเหมือนเดิม)
            if ($isManual === FALSE && $valueIsSame) {
                // ถ้าเป็น Auto-Sync และค่า Value ไม่มีการเปลี่ยนแปลง: Skip เพื่อลดภาระ DB
                return TRUE;
            }
            
            // 3. ทำการอัปเดต (เมื่อเป็นการป้อนมือ หรือ Auto-Sync ที่จำเป็นต้องอัปเดต)
            // อัปเดตข้อมูล
            return $this->update($existingRecord['id'], $saveData);

        } else {
            // B. INSERT: ถ้าไม่พบ Record ให้เพิ่ม Record ใหม่
            return $this->insert($saveData);
        }
    }
}
