// app/rain/components/RainDashboard.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  FormControl, InputLabel, Select, MenuItem,
  Paper, CircularProgress, Alert, Divider,
  IconButton, Tooltip, Stack, SelectChangeEvent,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { API_URL, Path_URL } from '@/lib/utility';
import { useTheme, alpha } from '@mui/material';
import { fontInfo } from '@/theme/style';
import CameraViewer from '@/components/Data/CameraViewer';
import { STATION_CAMERAS } from '@/lib/cameraConfig';
import StationCrossSectionChart from '@/components/Data/StationCrossSectionChart';
import StationCoordinates from '@/components/Data/Stationcoordinates';
import TeleMetricCards from '@/components/Data/Telemetriccards';


// ─── Types ────────────────────────────────────────────────────
interface RainInfo {
  sta_code: string;
  name: string;
  tambon: string;
  district: string;
  province: string;
  river?: string;
  lat: string;
  long: string;
}

interface RainLatest {
  sta_code: string;
  name: string;
  date: string;
  wl?: number;           // ระดับน้ำ
  discharge?: number;    // อัตราการไหล
  rain?: number;         // ปริมาณฝน
}

// ─── Main Component ───────────────────────────────────────────
export default function RainDashboard() {
  const [rainInfoList, setRainInfoList] = useState<RainInfo[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('120142');
  const [latest,       setLatest]       = useState<RainLatest | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [infoLoading,  setInfoLoading]  = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);
  
  // โหลดรายชื่อสถานี
  useEffect(() => {
    fetch(`${API_URL}/api/rain_info`)
      .then(r => r.json())
      .then(json => {
        const list: RainInfo[] = json.data || [];
        setRainInfoList(list);
        // if (list.length > 0) setSelectedCode(list[0].sta_code);
      })
      .finally(() => setInfoLoading(false));
  }, []);

  // โหลดข้อมูลสถานีที่เลือก
  const fetchStationData = useCallback(async (staCode: string) => {
    if (!staCode) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/daily/rain?sta_code=${staCode}`);
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');

      const json = await res.json();
      const data = json.data?.[0]; // ใช้ตัวแรก

      if (data) {
        setLatest({
          sta_code: data.sta_code,
          name: data.name,
          date: data.date,
          wl: data.wl,
          discharge: data.discharge,
          rain: data.rain,
        });
        setLastUpdate(new Date());
      } else {
        setLatest(null);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    if (!selectedCode) return;
    fetchStationData(selectedCode);
    const interval = setInterval(() => fetchStationData(selectedCode), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCode, fetchStationData]);

  const selectedInfo = rainInfoList.find(g => g.sta_code === selectedCode) ?? null;
  const cameras = selectedCode ? (STATION_CAMERAS[selectedCode] ?? []) : [];

  if (infoLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* ─── Toolbar ─────────────────────────────────────────── */}
      <Box sx={{ my: 2 }}>
        {/* Row 1: Dropdown + Refresh */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: '100%' }}>
          <FormControl fullWidth>
            <InputLabel sx={{ fontFamily: 'Prompt' }}>เลือกประตูระบายน้ำ</InputLabel>
            <Select
              value={selectedCode || '01'}
              label="เลือกประตูระบายน้ำ"
              onChange={(e: SelectChangeEvent) => setSelectedCode(e.target.value)}
              sx={fontInfo}
            >
              {rainInfoList.map((s: any) => (
                <MenuItem key={s.sta_code} value={s.sta_code}>
                  {s.name} ({s.sta_code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="รีเฟรชข้อมูล">
            <span>
              <IconButton
                onClick={() => fetchStationData(selectedCode)}
                disabled={loading}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                }}
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Row 2: Last update */}
        {lastUpdate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1, pl: 0.5 }}>
            <Box
                sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: 'success.main',
                flexShrink: 0,
                }}
            />
            <Typography
                sx={{
                fontFamily: 'Prompt',
                fontSize: '1rem',
                color: 'text.disabled',
                }}
            >
              ข้อมูลอัปเดตล่าสุด: {latest?.date ?? 'กำลังโหลด...'}
            </Typography>
          </Box>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, fontFamily: 'Prompt' }}>{error}</Alert>}

      {selectedInfo && (
        <Box>
        <Grid container spacing={2.5} alignItems="stretch">
          {/* ─── คอลัมน์ซ้าย: รูป + ข้อมูลทั่วไป + metric ─── */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2} sx={{ width: '100%', height: '100%' }}>
              {/* รูปสถานี */}
              <Paper
                elevation={2}
                sx={{
                  borderRadius: 4,
                  overrain: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                }}
              >
                {/* รูปภาพ */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 300,
                    overrain: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={`${Path_URL}images/rain_station/${selectedInfo.sta_code}.jpg`}
                    alt={selectedInfo.name}
                    onError={(e: any) => {
                      e.target.src = `${Path_URL}images/default_img.png`;
                    }}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: '0.4s',
                      '&:hover': {
                        transform: 'scale(1.03)',
                      },
                    }}
                  />

                  {/* Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      p: 2,
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.05))',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        color: '#fff',
                        lineHeight: 1.3,
                      }}
                    >
                      {selectedInfo.name}
                    </Typography>

                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontSize: '0.95rem',
                        color: 'rgba(255,255,255,0.8)',
                        mt: 0.3,
                      }}
                    >
                      รหัสสถานี : {selectedInfo.sta_code || '-'}
                    </Typography>
                  </Box>
                </Box>

                {/* เนื้อหา */}
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    flex: 1,
                  }}
                >
                  {/* หัวข้อ */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'Prompt',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: 'primary.main',
                      }}
                    >
                      ข้อมูลทั่วไป
                    </Typography>

                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.3,
                        borderRadius: 99,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        fontFamily: 'Prompt',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}
                    >
                      Station Info
                    </Box>
                  </Box>

                  {/* ข้อมูล */}
                  <Stack spacing={1}>
                    {[
                      // { label: 'แม่น้ำ', value: selectedInfo.river || '-' },
                      { label: 'ตำบล', value: selectedInfo.tambon || '-' },
                      { label: 'อำเภอ', value: selectedInfo.district || '-' },
                      { label: 'จังหวัด', value: selectedInfo.province || '-' },
                      {
                        label: 'พิกัด',
                        value:
                          selectedInfo.lat && selectedInfo.long
                            ? `${parseFloat(selectedInfo.lat).toFixed(5)}, ${parseFloat(
                                selectedInfo.long
                              ).toFixed(5)}`
                            : '-',
                      },
                    ].map((row) => (
                      <Box
                        key={row.label}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 2,
                          py: 0.8,
                          px: 1.2,
                          borderRadius: 2,
                          bgcolor: 'action.hover',
                          height: '100%',
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: 'Prompt',
                            fontSize: '0.85rem',
                            color: 'text.secondary',
                            minWidth: 70,
                            fontWeight: 500,
                          }}
                        >
                          {row.label}
                        </Typography>

                        <Typography
                          sx={{
                            fontFamily: 'Prompt',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'text.primary',
                            textAlign: 'right',
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                            flex: 1,
                          }}
                        >
                          {row.value}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Paper>
            </Stack>
          </Grid>
        {/* ───────────────── CCTV ───────────────── */}
          <Grid size={{ xs: 12, md: 8 }} >
            <Stack spacing={2}>
                <TeleMetricCards
                  rain={latest?.rain}
                  loading={loading}
                />
              <Paper sx={{ p: 2, borderRadius: 2 ,mt: 2}}>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
        
         {/* ───────────────── Middle Row ───────────────── */}
            <Grid container spacing={2.5} sx={{ mt: 2 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                 <StationCoordinates
                  staCode={selectedInfo.sta_code}
                  lat={selectedInfo.lat}
                  long={selectedInfo.long}
                  staName={selectedInfo.name}
                />
                </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{borderRadius: 2 }}>

                </Paper>
              </Grid>
               <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{borderRadius: 2 }}>
                   
                </Paper>
              </Grid>
            </Grid>
        </Box>
      )}
    </Box>
  );
}