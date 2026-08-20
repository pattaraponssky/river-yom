// components/Equipment/EquipmentFormClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Button, Grid,
  TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/utility';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'radar_sensor', label: 'เรดาร์วัดระดับน้ำ' },
  { value: 'rain_gauge', label: 'สถานีวัดน้ำฝน' },
  { value: 'camera', label: 'กล้อง CCTV' },
  { value: 'solar_panel', label: 'ระบบไฟฟ้า/โซล่าเซลล์' },
  { value: 'battery', label: 'แบตเตอรี่' },
  { value: 'datalogger', label: 'Data Logger' },
  { value: 'gate_actuator', label: 'ระบบควบคุมประตูน้ำ' },
  { value: 'network', label: 'ระบบเครือข่าย' },
  { value: 'other', label: 'อื่นๆ' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'ใช้งานอยู่' },
  { value: 'maintenance', label: 'บำรุงรักษา' },
  { value: 'broken', label: 'ชำรุด' },
  { value: 'retired', label: 'ปลดระวาง' },
];

interface EquipmentFormData {
  sta_code: string;
  name: string;
  type: string;
  serial_number: string;
  brand_model: string;
  purchase_date: string;
  warranty_expiry: string;
  photo: string;
  status: string;
}

const EMPTY_FORM = (staCode: string): EquipmentFormData => ({
  sta_code: staCode,
  name: '',
  type: 'other',
  serial_number: '',
  brand_model: '',
  purchase_date: '',
  warranty_expiry: '',
  photo: '',
  status: 'active',
});

interface StationOption {
  sta_code: string;
  sta_name: string;
}

interface Props {
  mode: 'create' | 'edit';
  staCode?: string;      // ถ้าไม่ส่งมา = โหมด "แบน" ให้เลือกสถานีเองจาก dropdown
  equipmentId?: string;  // required when mode === 'edit'
}

export default function EquipmentFormClient({ mode, staCode, equipmentId }: Props) {
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const fixedStation = !!staCode;                 // true = มาจาก /stations/[code]/equipment/...
  const returnTo = fixedStation ? `/stations/${encodeURIComponent(staCode!)}` : '/equipment';

  const [form, setForm] = useState<EquipmentFormData>(EMPTY_FORM(staCode ?? ''));
  const [stationOptions, setStationOptions] = useState<StationOption[]>([]);
  const [loadingData, setLoadingData] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหมดแบน (ไม่ fix สถานี) ต้องดึงรายชื่อสถานีมาให้เลือก
  useEffect(() => {
    if (fixedStation) return;
    const fetchStations = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stations`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        setStationOptions(Array.isArray(json.data) ? json.data : []);
      } catch {
        // ไม่ critical
      }
    };
    fetchStations();
  }, [fixedStation]);

  useEffect(() => {
    if (mode !== 'edit' || !equipmentId) return;
    const fetchEquipment = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/equipments/${equipmentId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('ไม่พบข้อมูลอุปกรณ์');
        const json = await res.json();
        const e = json.data;
        setForm({
          sta_code: e.sta_code ?? staCode ?? '',
          name: e.name ?? '',
          type: e.type ?? 'other',
          serial_number: e.serial_number ?? '',
          brand_model: e.brand_model ?? '',
          purchase_date: e.purchase_date ? String(e.purchase_date).slice(0, 10) : '',
          warranty_expiry: e.warranty_expiry ? String(e.warranty_expiry).slice(0, 10) : '',
          photo: e.photo ?? '',
          status: e.status ?? 'active',
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchEquipment();
  }, [mode, equipmentId, staCode]);

  const handleChange = (field: keyof EquipmentFormData) =>
    (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

  const handleBack = () => router.push(returnTo);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('กรุณาระบุชื่ออุปกรณ์');
      return;
    }
    if (!form.sta_code) {
      setError('กรุณาเลือกสถานี');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      sta_code: form.sta_code,
      name: form.name,
      type: form.type,
      serial_number: form.serial_number || null,
      brand_model: form.brand_model || null,
      purchase_date: form.purchase_date || null,
      warranty_expiry: form.warranty_expiry || null,
      photo: form.photo || null,
      status: form.status,
    };

    try {
      const url = mode === 'create'
        ? `${API_URL}/api/equipments`
        : `${API_URL}/api/equipments/update/${equipmentId}`;

      const res = await apiRequest(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || (mode === 'create' ? 'เพิ่มอุปกรณ์ล้มเหลว' : 'แก้ไขอุปกรณ์ล้มเหลว'));
      }

      router.push(returnTo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingData) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!currentUser || !hasPermission(1)) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button variant="text" startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        {fixedStation ? `กลับไปหน้าสถานี ${staCode}` : 'กลับไปหน้ารายการอุปกรณ์'}
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 'bold', fontFamily: 'Prompt', mb: 3 }}>
        {mode === 'create' ? 'เพิ่มอุปกรณ์ใหม่' : 'แก้ไขอุปกรณ์'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            {fixedStation ? (
              <TextField
                fullWidth label="สถานี" value={staCode} disabled
                helperText="อุปกรณ์นี้ผูกกับสถานีนี้เสมอ ไม่สามารถย้ายสถานีได้จากหน้านี้"
              />
            ) : (
              <FormControl fullWidth required>
                <InputLabel>สถานี</InputLabel>
                <Select
                  value={form.sta_code}
                  label="สถานี"
                  onChange={handleChange('sta_code') as any}
                >
                  {stationOptions.map(s => (
                    <MenuItem key={s.sta_code} value={s.sta_code}>
                      {s.sta_code} — {s.sta_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth required label="ชื่ออุปกรณ์"
              placeholder="เช่น เรดาร์วัดระดับน้ำ, กล้อง CCTV จุดที่ 1"
              value={form.name} onChange={handleChange('name')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>ประเภทอุปกรณ์</InputLabel>
              <Select value={form.type} label="ประเภทอุปกรณ์" onChange={handleChange('type') as any}>
                {TYPE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="หมายเลขซีเรียล (Serial Number)"
              value={form.serial_number} onChange={handleChange('serial_number')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="ยี่ห้อ/รุ่น"
              value={form.brand_model} onChange={handleChange('brand_model')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="วันที่ซื้อ" type="date"
              value={form.purchase_date} onChange={handleChange('purchase_date')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label="วันหมดประกัน" type="date"
              value={form.warranty_expiry} onChange={handleChange('warranty_expiry')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth label="URL รูปอุปกรณ์"
              placeholder="/uploads/equipment/yr01-radar.jpg"
              value={form.photo} onChange={handleChange('photo')}
              helperText="ใส่ path หรือ URL รูปอุปกรณ์ชิ้นนี้ (ไม่บังคับ)"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>สถานะ</InputLabel>
              <Select value={form.status} label="สถานะ" onChange={handleChange('status') as any}>
                {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button onClick={handleBack} disabled={saving}>ยกเลิก</Button>
          <Button
            variant="contained" startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
            onClick={handleSubmit} disabled={saving}
          >
            {saving ? 'กำลังบันทึก...' : mode === 'create' ? 'เพิ่มอุปกรณ์' : 'บันทึกการแก้ไข'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}