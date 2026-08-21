// components/Equipment/EquipmentDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { API_URL } from '@/lib/utility';
import { apiRequest } from '@/lib/api';

// ─── ต้องตรงกับตาราง equipment ใหม่ (ผูกกับ tele_info ผ่าน sta_code) ──────────
interface Equipment {
  id?: string;
  sta_code: string;
  name: string;
  type: string;
  serial_number?: string | null;
  brand_model?: string | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  photo?: string | null;
  status: 'active' | 'maintenance' | 'broken' | 'retired';
}

interface StationOption {
  sta_code: string;
  sta_name: string;
}

interface EquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentToEdit?: Equipment | null; // ถ้ามี = โหมดแก้ไข
  stationOptions: StationOption[];    // รายชื่อสถานีให้เลือก (ดึงมาจากหน้าแม่)
}

const TYPE_OPTIONS = [
  { value: 'radar_sensor',  label: 'เรดาร์วัดระดับน้ำ' },
  { value: 'rain_gauge',    label: 'สถานีวัดน้ำฝน' },
  { value: 'camera',        label: 'กล้อง CCTV' },
  { value: 'solar_panel',   label: 'ระบบไฟฟ้า/โซล่าเซลล์' },
  { value: 'battery',       label: 'แบตเตอรี่' },
  { value: 'datalogger',    label: 'Data Logger' },
  { value: 'gate_actuator', label: 'ระบบควบคุมประตูน้ำ' },
  { value: 'network',       label: 'ระบบเครือข่าย' },
  { value: 'other',         label: 'อื่นๆ' },
];

const EMPTY_FORM: Equipment = {
  sta_code: '',
  name: '',
  type: 'other',
  serial_number: '',
  brand_model: '',
  purchase_date: '',
  warranty_expiry: '',
  photo: '',
  status: 'active',
};

const EquipmentDialog: React.FC<EquipmentDialogProps> = ({
  open, onClose, onSuccess, equipmentToEdit, stationOptions,
}) => {
  const [formData, setFormData] = useState<Equipment>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดข้อมูลเก่าเมื่อเปิด Dialog แบบแก้ไข / รีเซ็ตเมื่อเปิดแบบเพิ่มใหม่
  useEffect(() => {
    if (!open) return;
    if (equipmentToEdit) {
      setFormData({
        id: equipmentToEdit.id,
        sta_code: equipmentToEdit.sta_code ?? '',
        name: equipmentToEdit.name ?? '',
        type: equipmentToEdit.type ?? 'other',
        serial_number: equipmentToEdit.serial_number ?? '',
        brand_model: equipmentToEdit.brand_model ?? '',
        purchase_date: equipmentToEdit.purchase_date ? String(equipmentToEdit.purchase_date).slice(0, 10) : '',
        warranty_expiry: equipmentToEdit.warranty_expiry ? String(equipmentToEdit.warranty_expiry).slice(0, 10) : '',
        photo: equipmentToEdit.photo ?? '',
        status: equipmentToEdit.status ?? 'active',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setError(null);
  }, [equipmentToEdit, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.sta_code) {
      setError('กรุณาเลือกสถานี');
      return;
    }
    if (!formData.name.trim()) {
      setError('กรุณาระบุชื่ออุปกรณ์');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEdit = !!equipmentToEdit?.id;
      // ตาม Routes.php: POST /api/equipments (สร้าง) และ POST /api/equipments/update/{id} (แก้ไข)
      const url = isEdit
        ? `${API_URL}/api/equipments/update/${equipmentToEdit!.id}`
        : `${API_URL}/api/equipments`;

      const payload = {
        sta_code: formData.sta_code,
        name: formData.name,
        type: formData.type,
        serial_number: formData.serial_number || null,
        brand_model: formData.brand_model || null,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        photo: formData.photo || null,
        status: formData.status,
      };

      const res = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || (isEdit ? 'แก้ไขล้มเหลว' : 'เพิ่มล้มเหลว'));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const title = equipmentToEdit ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่';
  const buttonText = loading ? 'กำลังบันทึก...' : (equipmentToEdit ? 'บันทึกการแก้ไข' : 'บันทึก');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: 'Prompt' }}>{title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            select required
            label="สถานี" name="sta_code"
            value={formData.sta_code}
            onChange={handleChange}
            fullWidth
            disabled={!!equipmentToEdit} // แก้ไขแล้วห้ามย้ายสถานี ป้องกันข้อมูลปนกัน
            helperText={equipmentToEdit ? 'ไม่สามารถย้ายสถานีของอุปกรณ์ที่มีอยู่แล้วได้' : undefined}
          >
            {stationOptions.length === 0 && (
              <MenuItem value="" disabled>ไม่พบข้อมูลสถานี</MenuItem>
            )}
            {stationOptions.map(s => (
              <MenuItem key={s.sta_code} value={s.sta_code}>
                {s.sta_code} — {s.sta_name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="ชื่ออุปกรณ์" name="name"
            placeholder="เช่น เรดาร์วัดระดับน้ำ, กล้อง CCTV จุดที่ 1"
            value={formData.name} onChange={handleChange}
            fullWidth required
          />

          <TextField
            select required
            label="ประเภทอุปกรณ์" name="type"
            value={formData.type} onChange={handleChange}
            fullWidth
          >
            {TYPE_OPTIONS.map(o => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="หมายเลขซีเรียล (S/N)" name="serial_number"
              value={formData.serial_number || ''} onChange={handleChange}
              fullWidth
            />
            <TextField
              label="ยี่ห้อ/รุ่น" name="brand_model"
              value={formData.brand_model || ''} onChange={handleChange}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="วันที่ซื้อ" name="purchase_date" type="date"
              value={formData.purchase_date || ''} onChange={handleChange}
              fullWidth InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="วันหมดประกัน" name="warranty_expiry" type="date"
              value={formData.warranty_expiry || ''} onChange={handleChange}
              fullWidth InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            label="URL รูปอุปกรณ์" name="photo"
            placeholder="/uploads/equipment/yr01-radar.jpg"
            value={formData.photo || ''} onChange={handleChange}
            fullWidth
            helperText="ใส่ path หรือ URL รูปอุปกรณ์ชิ้นนี้ (ไม่บังคับ)"
          />

          <TextField
            select label="สถานะ" name="status"
            value={formData.status} onChange={handleChange}
            fullWidth
          >
            <MenuItem value="active">ใช้งานอยู่</MenuItem>
            <MenuItem value="maintenance">บำรุงรักษา</MenuItem>
            <MenuItem value="broken">ชำรุด</MenuItem>
            <MenuItem value="retired">ปลดระวาง</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button
          variant="contained" color="primary"
          onClick={handleSubmit}
          disabled={loading || !formData.name.trim() || !formData.sta_code}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentDialog;