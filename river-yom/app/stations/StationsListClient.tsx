// app/stations/StationsListClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert, TextField,
  InputAdornment, Grid, Card, CardMedia, CardContent, CardActionArea,
  Chip, Skeleton, Button, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlaceIcon from '@mui/icons-material/Place';
import SensorsIcon from '@mui/icons-material/Sensors';
import WaterIcon from '@mui/icons-material/Water';
import { useRouter } from 'next/navigation';
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

const LIVE_STATUS_CONFIG: Record<StationLiveStatus, { label: string; color: string; chipColor: 'success' | 'error' | 'warning' }> = {
  online:  { label: 'ออนไลน์',    color: '#22c55e', chipColor: 'success' },
  offline: { label: 'ออฟไลน์',    color: '#ef4444', chipColor: 'error' },
  warning: { label: 'มีปัญหา',    color: '#f59e0b', chipColor: 'warning' },
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
  const router = useRouter();
  const { currentUser, loading: authLoading, hasPermission } = useAuth();

  const [stations, setStations] = useState<TeleStation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filtered = useMemo(() => {
    if (!searchTerm) return stations;
    const q = searchTerm.toLowerCase();
    return stations.filter(s =>
      [s.sta_code, s.sta_name, s.river, s.tambon, s.district, s.province]
        .some(v => (v ?? '').toLowerCase().includes(q))
    );
  }, [stations, searchTerm]);

  // สรุปจำนวนตามสถานะ ใช้โชว์เป็น legend/summary ด้านบน
  const statusSummary = useMemo(() => {
    const counts: Record<StationLiveStatus, number> = { online: 0, offline: 0, warning: 0 };
    filtered.forEach(s => { counts[getStationStatus(s)] += 1; });
    return counts;
  }, [filtered]);

  if (authLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!currentUser || !hasPermission(1)) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><Typography variant="h6" color="error">ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography></Box>;
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ py: { xs: 2, md: 3 }, px: { xs: 2, sm: 3, md: 4 } }}>
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
            variant="h4"
            sx={{ fontWeight: 'bold', fontFamily: 'Prompt', fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            สถานีติดตั้งอุปกรณ์
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/equipment')}
            fullWidth
            sx={{ fontFamily: 'Prompt', width: { xs: '100%', sm: 'auto' } }}
          >
            รายการอุปกรณ์ทั้งหมด
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Prompt', mt: 0.5 }}>
          ฝั่งขวาแม่น้ำยม อำเภอบางระกำ จังหวัดพิษณุโลก — {filtered.length} สถานี
        </Typography>

        {/* Legend สรุปสถานะ */}
        <Box sx={{ display: 'flex', gap: { xs: 1.25, sm: 1.5 }, mt: 1.5, flexWrap: 'wrap' }}>
          {(Object.keys(LIVE_STATUS_CONFIG) as StationLiveStatus[]).map(key => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: LIVE_STATUS_CONFIG[key].color }} />
              <Typography variant="caption" sx={{ fontFamily: 'Prompt', color: 'text.secondary' }}>
                {LIVE_STATUS_CONFIG[key].label} ({statusSummary[key]})
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <TextField
        placeholder="ค้นหาสถานี เช่น YR.01, บางระกำ, แม่น้ำยม..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: { xs: 2, md: 3 }, maxWidth: { xs: '100%', sm: 420 } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {loadingData ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={260} />
            </Grid>
          ))
        ) : filtered.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">ไม่พบสถานีที่ตรงกับการค้นหา</Typography>
            </Box>
          </Grid>
        ) : (
          filtered.map(station => {
            const photo = resolvePhotoUrl(station.photo) || `${Path_URL}/images/tele/${station.sta_code}.jpg`;
            const liveStatus = getStationStatus(station);
            const statusCfg = LIVE_STATUS_CONFIG[liveStatus];

            return (
              <Grid key={station.sta_code} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3, height: '100%' }}>
                  <CardActionArea
                    onClick={() => router.push(`/stations/${encodeURIComponent(station.sta_code)}`)}
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      {photo ? (
                        <CardMedia
                          component="img"
                          image={photo}
                          alt={station.sta_name}
                          sx={{ height: { xs: 180, sm: 160, lg: 150 }, objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ height: { xs: 180, sm: 160, lg: 150 }, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', color: 'grey.400' }}>
                          <WaterIcon sx={{ fontSize: 40 }} />
                        </Box>
                      )}

                      {/* ป้ายสถานะออนไลน์/ออฟไลน์ มุมซ้ายบน */}
                      <Tooltip title={`สถานะล่าสุด: ${statusCfg.label}`}>
                        <Chip
                          size="small"
                          label={statusCfg.label}
                          color={statusCfg.chipColor}
                          icon={
                            <Box
                              sx={{
                                width: 8, height: 8, borderRadius: '50%',
                                bgcolor: 'white', ml: 1,
                                boxShadow: liveStatus === 'online' ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none',
                              }}
                            />
                          }
                          sx={{
                            position: 'absolute', top: 8, left: 8,
                            fontFamily: 'Prompt', fontWeight: 'bold',
                            '& .MuiChip-icon': { order: -1, ml: 1, mr: -0.5 },
                          }}
                        />
                      </Tooltip>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: { xs: 1.75, sm: 2 }, '&:last-child': { pb: { xs: 1.75, sm: 2 } } }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontFamily: 'Prompt', mb: 0.25, lineHeight: 1.3 }}>
                        {station.sta_code}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'Prompt', mb: 0.75,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          minHeight: '2.6em',
                        }}
                      >
                        {station.sta_name}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, color: 'text.secondary', mb: 0.75 }}>
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