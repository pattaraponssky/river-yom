// components/equipment/EquipmentDialog.tsx
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

interface Equipment {
  id?: string;
  name: string;
  type: string;
  location: string;
  latitude?: string | null;
  longitude?: string | null;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  status: 'active' | 'maintenance' | 'broken' | 'retired';
}

interface EquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentToEdit?: Equipment | null; // ถ้ามี = โหมดแก้ไข
}

const EquipmentDialog: React.FC<EquipmentDialogProps> = ({ open, onClose, onSuccess, equipmentToEdit }) => {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    id: equipmentToEdit?.id || undefined,
    name: '',
    type: '',
    location: '',
    latitude: '',
    longitude: '',
    purchase_date: '',
    warranty_expiry: '',
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดข้อมูลเก่าเมื่อเปิด Dialog แบบแก้ไข
  useEffect(() => {
    if (equipmentToEdit) {
      setFormData({
        ...equipmentToEdit,
        latitude: equipmentToEdit.latitude ?? '',
        longitude: equipmentToEdit.longitude ?? '',
        purchase_date: equipmentToEdit.purchase_date ?? '',
        warranty_expiry: equipmentToEdit.warranty_expiry ?? '',
      });
    } else {
      // Reset สำหรับเพิ่มใหม่
      setFormData({
        id: '',
        name: '',
        type: '',
        location: '',
        latitude: '',
        longitude: '',
        purchase_date: '',
        warranty_expiry: '',
        status: 'active',
      });
    }
  }, [equipmentToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
        let url = `${API_URL}/api/equipments`;
        let method = 'POST';

        if (equipmentToEdit?.id) {
        // โหมดแก้ไข
        url = `${API_URL}/api/equipments/update/${equipmentToEdit.id}`;
        method = 'POST'; // ตาม routes ของคุณใช้ POST สำหรับ update
        } else {
        // โหมดเพิ่มใหม่
        url = `${API_URL}/api/equipments`; // หรือ /store ถ้าคุณยังอยากใช้ store
        }

        const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
        });

        if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || (equipmentToEdit ? 'แก้ไขล้มเหลว' : 'เพิ่มล้มเหลว'));
        }

        const result = await res.json();
        console.log('Success:', result);

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
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="ชื่ออุปกรณ์" name="name" value={formData.name || ''} onChange={handleChange} fullWidth required />
          <TextField label="ประเภท" name="type" value={formData.type || ''} onChange={handleChange} fullWidth required />
          <TextField label="สถานที่ติดตั้ง" name="location" value={formData.location || ''} onChange={handleChange} fullWidth />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="ละติจูด" name="latitude" value={formData.latitude || ''} onChange={handleChange} fullWidth type="number" inputProps={{ step: 'any' }} />
            <TextField label="ลองจิจูด" name="longitude" value={formData.longitude || ''} onChange={handleChange} fullWidth type="number" inputProps={{ step: 'any' }} />
          </Box>

          <TextField label="วันที่ซื้อ" name="purchase_date" type="date" value={formData.purchase_date || ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="วันหมดประกัน" name="warranty_expiry" type="date" value={formData.warranty_expiry || ''} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />

          <TextField select label="สถานะ" name="status" value={formData.status || 'active'} onChange={handleChange} fullWidth>
            <MenuItem value="active">ใช้งานอยู่</MenuItem>
            <MenuItem value="maintenance">บำรุงรักษา</MenuItem>
            <MenuItem value="broken">ชำรุด</MenuItem>
            <MenuItem value="retired">ปลดระวาง</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading || !formData.name || !formData.type} startIcon={loading ? <CircularProgress size={20} /> : null}>
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EquipmentDialog;