
'use client';

import React, { useState } from 'react';
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

interface AddEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Equipment {
  id?: string;
  name: string;
  type: string;
  location: string;
  latitude?: string | null;
  longitude?: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: 'active' | 'maintenance' | 'broken' | 'retired';
  created_at: string;
  updated_at: string;
}

const AddEquipmentDialog: React.FC<AddEquipmentDialogProps> = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Equipment>>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest(`${API_URL}/api/equipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'เพิ่มอุปกรณ์ล้มเหลว');
      }

      const result = await res.json();
      console.log('Created equipment:', result);

      onSuccess(); // รีเฟรชข้อมูลในหน้าแม่
      onClose();
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>เพิ่มอุปกรณ์ใหม่</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="ชื่ออุปกรณ์"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="ประเภท"
            name="type"
            value={formData.type || ''}
            onChange={handleChange}
            fullWidth
            required
          />

          <TextField
            label="สถานที่ติดตั้ง"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="ละติจูด"
              name="latitude"
              value={formData.latitude || ''}
              onChange={handleChange}
              fullWidth
              type="number"
              inputProps={{ step: 'any' }}
            />
            <TextField
              label="ลองจิจูด"
              name="longitude"
              value={formData.longitude || ''}
              onChange={handleChange}
              fullWidth
              type="number"
              inputProps={{ step: 'any' }}
            />
          </Box>

          <TextField
            label="วันที่ซื้อ"
            name="purchase_date"
            type="date"
            value={formData.purchase_date || ''}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="วันหมดประกัน"
            name="warranty_expiry"
            type="date"
            value={formData.warranty_expiry || ''}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            select
            label="สถานะ"
            name="status"
            value={formData.status || 'active'}
            onChange={handleChange}
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
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || !formData.name || !formData.type}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEquipmentDialog;