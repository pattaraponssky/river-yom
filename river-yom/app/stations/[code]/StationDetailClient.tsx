// app/stations/[code]/StationDetailClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, Button, Grid,
  Card, CardMedia, CardContent, CardActionArea, Chip, IconButton,
  Tooltip, TextField, InputAdornment, Skeleton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import PlaceIcon from '@mui/icons-material/Place';
import SearchIcon from '@mui/icons-material/Search';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import SensorsIcon from '@mui/icons-material/Sensors';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import VideocamIcon from '@mui/icons-material/Videocam';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import MemoryIcon from '@mui/icons-material/Memory';
import { useRouter } from 'next/navigation';
import { API_URL, Path_URL } from '@/lib/utility';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

// ข้อมูลตรงจาก tele_info — แสดงผลอย่างเดียว ไม่มีฟอร์มแก้ไขในหน้านี้
interface TeleStation {
  no: number;
  sta_code: string;
  sta_name: string;
  river: string | null;
  tambon: string | null;
  district: string | null;
  province: string | null;
  capacity: number | null;
  lat: number | null;
  long: number | null;
}

interface Equipment {
  id: number;
  sta_code: string;
  name: string;
  type: 'radar_sensor' | 'rain_gauge' | 'camera' | 'solar_panel' | 'battery' | 'datalogger' | 'gate_actuator' | 'network' | 'other';
  serial_number: string | null;
  brand_model: string | null;
  photo: string | null;
  status: 'active' | 'maintenance' | 'broken' | 'retired';
  last_maintenance_date?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'ใช้งานอยู่', maintenance: 'บำรุงรักษา', broken: 'ชำรุด', retired: 'ปลดระวาง',
};
const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success', maintenance: 'warning', broken: 'error', retired: 'default',
};
const TYPE_ICON: Record<string, React.ReactNode> = {
  radar_sensor: <SensorsIcon />,
  rain_gauge: <WaterDropIcon />,
  camera: <VideocamIcon />,
  solar_panel: <SolarPowerIcon />,
  datalogger: <MemoryIcon />,
};
const TYPE_LABEL: Record<string, string> = {
  radar_sensor: 'เรดาร์วัดระดับน้ำ',
  rain_gauge: 'สถานีวัดน้ำฝน',
  camera: 'กล้อง CCTV',
  solar_panel: 'ระบบไฟฟ้า/โซล่าเซลล์',
  battery: 'แบตเตอรี่',
  datalogger: 'Data Logger',
  gate_actuator: 'ระบบควบคุมประตูน้ำ',
  network: 'ระบบเครือข่าย',
  other: 'อื่นๆ',
};

export default function StationDetailClient({ staCode }: { staCode: string }) {
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [station, setStation] = useState<TeleStation | null>(null);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading || !currentUser || !staCode) return;
    const fetchData = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const code = encodeURIComponent(staCode);
        const [stationRes, equipRes] = await Promise.all([

          fetch(`${API_URL}/api/tele_info/${code}`, { credentials: 'include' }),
          fetch(`${API_URL}/api/stations/${code}`, { credentials: 'include' }),
        ]);
        if (!stationRes.ok) throw new Error('ไม่พบข้อมูลสถานีนี้ใน tele_info');
        if (!equipRes.ok) throw new Error('ดึงรายการอุปกรณ์ล้มเหลว');
        const stationJson = await stationRes.json();
        const equipJson = await equipRes.json();

        // debug: เปิด console ดูรูปร่าง response จริงถ้ายังเจอปัญหา
        // console.log('equipJson:', equipJson);

        setStation(stationJson.data);
        // กัน state พังถ้า backend ตอบมาไม่ใช่ array (เช่น error object, null, undefined)
        setEquipmentList(Array.isArray(equipJson.data) ? equipJson.data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [authLoading, currentUser, staCode]);

  const filtered = useMemo(() => {
    const list = Array.isArray(equipmentList) ? equipmentList : [];
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(e =>
      [e.name, e.serial_number, e.brand_model, TYPE_LABEL[e.type]]
        .some(v => (v ?? '').toLowerCase().includes(q))
    );
  }, [equipmentList, searchTerm]);

  const handleDeleteEquipment = async (equipmentId: number) => {
    if (!confirm('ยืนยันการลบอุปกรณ์ชิ้นนี้หรือไม่? ประวัติการบำรุงรักษาที่ผูกไว้จะถูกลบด้วย')) return;
    try {
      const res = await apiRequest(`${API_URL}/api/equipment/${equipmentId}/delete`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('ลบอุปกรณ์ล้มเหลว');
      setEquipmentList(prev => prev.filter(e => e.id !== equipmentId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!currentUser || !hasPermission(1)) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
  }

  const photo = `${Path_URL}/images/tele/${staCode}.jpg`

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => router.push('/stations')} sx={{ mb: 2 }}>
        กลับไปหน้ารายการสถานี
      </Button>

      {/* แบนเนอร์สถานี — อ่านจาก tele_info อย่างเดียว ไม่มีปุ่มแก้ไขในหน้านี้ */}
      {loadingData ? (
        <Skeleton variant="rounded" height={220} sx={{ mb: 4 }} />
      ) : station && (
        <Box sx={{
          position: 'relative', borderRadius: 3, overflow: 'hidden', mb: 4, boxShadow: 3,
          height: 220, display: 'flex', alignItems: 'flex-end',
          backgroundImage: photo ? `url(${photo})` : undefined,
          backgroundSize: 'cover', backgroundPosition: 'center',
          bgcolor: photo ? undefined : 'grey.300',
        }}>
          <Box sx={{ width: '100%', p: 3, background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))' }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', fontFamily: 'Prompt' }}>
              {station.sta_code}
            </Typography>
            <Typography variant="h6" sx={{ color: 'white', fontFamily: 'Prompt' }}>{station.sta_name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'grey.200' }}>
              <PlaceIcon fontSize="small" />
              <Typography variant="body2" sx={{ fontFamily: 'Prompt' }}>
                {[station.river, station.tambon, station.district, station.province].filter(Boolean).join(' • ')}
              </Typography>
            </Box>
            {station.capacity != null && (
              <Chip
                size="small"
                label={`ความจุลำน้ำ ${station.capacity} ลบ.ม./วินาที`}
                sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontFamily: 'Prompt' }}
              />
            )}
          </Box>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Equipment section — ส่วนเดียวที่แก้ไข/ลบ/เพิ่มได้ในหน้านี้ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'Prompt' }}>
          รายการอุปกรณ์ในสถานี ({filtered.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="ค้นหาอุปกรณ์..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => router.push(`/stations/${encodeURIComponent(staCode)}/equipment/new`)}>
            เพิ่มอุปกรณ์
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {loadingData ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={240} /></Grid>
          ))
        ) : filtered.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">ยังไม่มีอุปกรณ์ในสถานีนี้</Typography>
            </Box>
          </Grid>
        ) : (
          filtered.map(equip => (
            <Grid key={equip.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3, height: '100%' }}>
                <CardActionArea onClick={() => router.push(`/equipment/${equip.id}/maintenance`)}>
                  {equip.photo ? (
                    <CardMedia component="img" height="150" image={equip.photo} alt={equip.name} sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', color: 'grey.400' }}>
                      {TYPE_ICON[equip.type] ?? <ImageNotSupportedIcon sx={{ fontSize: 36 }} />}
                    </Box>
                  )}
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Chip size="small" icon={TYPE_ICON[equip.type] as any} label={TYPE_LABEL[equip.type] ?? equip.type} variant="outlined" sx={{ fontFamily: 'Prompt' }} />
                      <Chip size="small" label={STATUS_LABEL[equip.status]} color={STATUS_COLOR[equip.status]} sx={{ fontFamily: 'Prompt' }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontFamily: 'Prompt', mt: 1 }}>
                      {equip.name}
                    </Typography>
                    {equip.serial_number && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Prompt', display: 'block' }}>
                        S/N: {equip.serial_number}
                      </Typography>
                    )}
                    {equip.last_maintenance_date && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Prompt', display: 'block' }}>
                        บำรุงรักษาล่าสุด: {equip.last_maintenance_date}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pb: 1, gap: 0.5 }}>
                  <Tooltip title="ประวัติการบำรุงรักษา">
                    <IconButton size="small" color="info" onClick={() => router.push(`/equipment/${equip.id}/maintenance`)}>
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="แก้ไขอุปกรณ์">
                    <IconButton size="small" color="primary" onClick={() => router.push(`/stations/${encodeURIComponent(staCode)}/equipment/${equip.id}/edit`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบอุปกรณ์">
                    <IconButton size="small" color="error" onClick={() => handleDeleteEquipment(equip.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}