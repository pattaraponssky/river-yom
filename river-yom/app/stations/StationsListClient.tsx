// app/stations/StationsListClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, TextField,
  InputAdornment, Grid, Card, CardMedia, CardContent, CardActionArea,
  Chip, Skeleton, Button, IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
import SensorsIcon from '@mui/icons-material/Sensors';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { API_URL, Path_URL, resolvePhotoUrl } from '@/lib/utility';
import { useAuth } from '@/contexts/AuthContext';


type StationLiveStatus = 'online' | 'offline' | 'warning';

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
  photo?: string | null;
  equipment_count?: number;
  latest_datetime?: string | null;          // เวลาข้อมูลล่าสุด "YYYY-MM-DD HH:MM:SS"
  latest_status?: StationLiveStatus | null; // ★ field ที่ backend จะเพิ่มมาให้ทีหลัง
}

const LIVE_STATUS_CONFIG: Record<StationLiveStatus, { label: string; chipColor: 'success' | 'error' | 'warning' }> = {
  online:  { label: 'ออนไลน์',    chipColor: 'success' },
  offline: { label: 'ออฟไลน์',    chipColor: 'error' },
  warning: { label: 'มีปัญหา',    chipColor: 'warning' },
};

// ถ้าข้อมูลล่าสุดของสถานีหายไปเกิน 1 วัน → 'มีปัญหา' (warning)
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function getStationStatus(station: TeleStation): StationLiveStatus {
  // ใช้ค่าที่ backend ส่งมาตรงๆ ถ้ามี
  if (station.latest_status) return station.latest_status;

  // ไม่มีข้อมูลล่าสุดเลย → ถือว่ามีปัญหา
  if (!station.latest_datetime) return 'warning';

  // "YYYY-MM-DD HH:MM:SS" เป็นเวลาไทย (Asia/Bangkok, UTC+7) → เติม offset ให้ถูกต้อง
  // รองรับทั้งกรณีมี/ไม่มี seconds
  const normalized = station.latest_datetime.trim().replace(' ', 'T');
  const latest = new Date(
    normalized.length === 16 ? `${normalized}:00+07:00` : `${normalized}+07:00`
  );
  if (isNaN(latest.getTime())) return 'warning';

  const ageMs = Date.now() - latest.getTime();
  return ageMs > STALE_THRESHOLD_MS ? 'warning' : 'online';
}

export default function StationsListClient() {
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [stations, setStations] = useState<TeleStation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StationLiveStatus | null>(null);

  useEffect(() => {
    if (authLoading || !currentUser) return;
    const fetchStations = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/stations`, { credentials: 'include' });
        if (!res.ok) throw new Error('ดึงข้อมูลสถานีล้มเหลว');
        const json = await res.json();
        setStations(Array.isArray(json.data) ? json.data : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchStations();
  }, [authLoading, currentUser]);

  const matches = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return stations
      .filter(station =>
        [station.sta_code, station.sta_name, station.river, station.tambon, station.district, station.province]
          .some(value => (value ?? '').toLowerCase().includes(query))
      )
      .map(station => ({ station, status: getStationStatus(station) }));
  }, [stations, searchTerm]);

  const statusSummary = { online: 0, offline: 0, warning: 0 };
  matches.forEach(({ status }) => { statusSummary[status] += 1; });
  const visible = statusFilter ? matches.filter(({ status }) => status === statusFilter) : matches;

  function clearFilters() {
    setSearchTerm('');
    setStatusFilter(null);
  }

  if (authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!currentUser || !hasPermission(1)) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
  }

  return (
    <Container maxWidth="xl" disableGutters sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Typography
            variant="h4" component="h1"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt', fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            สถานีติดตั้งอุปกรณ์
          </Typography>
          <Button
            variant="outlined"
            component={Link}
            href="/equipment"
            startIcon={<SensorsIcon />}
            fullWidth
            sx={{ fontFamily: 'Prompt', width: { xs: '100%', sm: 'auto' } }}
          >
            รายการอุปกรณ์ทั้งหมด
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt', mt: 0.5 }}>
          ฝั่งขวาแม่น้ำยม อำเภอบางระกำ จังหวัดพิษณุโลก
        </Typography>

      </Box>

      <Box sx={{ mb: 3, p: { xs: 1.5, sm: 2 }, border: 1, borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
        <TextField
          label="ค้นหาสถานี"
          placeholder="รหัส ชื่อ แม่น้ำ หรือพื้นที่"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton aria-label="ล้างคำค้นหา" onClick={() => setSearchTerm('')} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {!loadingData && !error && (
          <>
            <Box role="group" aria-label="กรองตามสถานะ" sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Chip
                label={`ทั้งหมด ${matches.length}`}
                onClick={() => setStatusFilter(null)}
                aria-pressed={statusFilter === null}
                color={statusFilter === null ? 'primary' : 'default'}
                variant={statusFilter === null ? 'filled' : 'outlined'}
              />
              {(Object.keys(LIVE_STATUS_CONFIG) as StationLiveStatus[]).map(status => (
                <Chip
                  key={status}
                  label={`${LIVE_STATUS_CONFIG[status].label} ${statusSummary[status]}`}
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                  aria-pressed={statusFilter === status}
                  color={LIVE_STATUS_CONFIG[status].chipColor}
                  variant={statusFilter === status ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
            <Typography role="status" variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              แสดง {visible.length} จาก {stations.length} สถานี
            </Typography>
          </>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {loadingData ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={260} />
            </Grid>
          ))
        ) : error ? null : visible.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">
                {stations.length ? 'ไม่พบสถานีที่ตรงกับคำค้นหาหรือตัวกรอง' : 'ยังไม่มีข้อมูลสถานี'}
              </Typography>
              {(searchTerm || statusFilter) && (
                <Button onClick={clearFilters} sx={{ mt: 1 }}>ล้างการค้นหาและตัวกรอง</Button>
              )}
            </Box>
          </Grid>
        ) : (
          visible.map(({ station, status }) => {
            const photo = resolvePhotoUrl(station.photo) || `${Path_URL}/images/tele/${station.sta_code}.jpg`;
            const statusCfg = LIVE_STATUS_CONFIG[status];

            return (
              <Grid key={station.sta_code} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                  <CardActionArea
                    component={Link}
                    href={`/stations/${encodeURIComponent(station.sta_code)}`}
                    sx={{
                      height: '100%', display: 'flex', alignItems: 'stretch',
                      flexDirection: { xs: 'row', sm: 'column' },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={photo}
                      alt=""
                      loading="lazy"
                      sx={{
                        width: { xs: '25%', sm: '100%' }, flexShrink: 0,
                        height: { xs: 'auto', sm: 150 }, objectFit: 'cover', bgcolor: 'action.hover',
                      }}
                    />

                    <CardContent sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.75 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {station.sta_code}
                        </Typography>
                        <Chip size="small" label={statusCfg.label} color={statusCfg.chipColor} />
                      </Box>
                      <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.45, mb: 0.75, overflowWrap: 'anywhere' }}>
                        {station.sta_name}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, color: 'text.secondary', mb: 0.75, flex: 1 }}>
                        <PlaceIcon fontSize="small" sx={{ mt: 0.25, flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ fontFamily: 'Prompt' }}>
                          {[station.river, station.tambon, station.district].filter(Boolean).join(' • ')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <SensorsIcon fontSize="small" />
                          <Typography variant="caption" sx={{ fontFamily: 'Prompt' }}>
                            {station.equipment_count ?? 0} อุปกรณ์
                          </Typography>
                        </Box>
                        {station.capacity != null && (
                          <Chip size="small" label={`${station.capacity} ลบ.ม./วิ`} sx={{ fontFamily: 'Prompt', maxWidth: '100%' }} />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'primary.main', mt: 1.25 }}>
                        <Typography variant="body2">ดูรายละเอียด</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 16 }} />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </Container>
  );
}