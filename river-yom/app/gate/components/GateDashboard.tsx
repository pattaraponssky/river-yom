// app/gate/components/GateDashboard.tsx
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
import { GATE_STATION_CONFIGS } from '@/lib/gateConfig';
import GateOpeningDisplay from '@/components/Data/GateOpeningDisplay';
import StationCrossSectionChart from '@/components/Data/StationCrossSectionChart';


// ─── Types ────────────────────────────────────────────────────
interface GateInfo {
  sta_code: string;
  sta_name: string;
  tambon: string;
  district: string;
  province: string;
  river?: string;
  lat: string;
  long: string;
}

interface GateLatest {
  sta_code: string;
  date: string;
  wl_upper?: number;
  wl_lower?: number;
  discharge?: number;
  [key: string]: any; // gate1_height, gate2_height, ...
}

const GATE_CROSS_SECTIONS: Record<string, number> = {
    'tng': 204540,
    'wst': 241714,
};

// const GATE_WARN_LEVELS: Record<string, { watch: number; alert: number; crisis: number; normal: number }> = {
//     'tng': { normal: 36.0, watch: 37.5, alert: 38.5, crisis: 39.5 },
//     'wst': { normal: 37.0, watch: 38.5, alert: 39.5, crisis: 40.5 },
// };

const GATE_WARN_LEVELS: Record<string, { watch: number; alert: number; crisis: number; normal: number }> = {
    'tng': { normal: 2.0, watch: 3.5, alert: 4.5, crisis: 5.5 },
    'wst': { normal: 37.0, watch: 38.5, alert: 39.5, crisis: 40.5 },
    'kpk': { normal: 1.0, watch: 3.5, alert: 6.5, crisis: 8.5 },
};

// ─── Main Component ───────────────────────────────────────────
export default function GateDashboard() {
  const theme = useTheme();
  const [gateInfoList, setGateInfoList] = useState<GateInfo[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('tng');
  const [latest,       setLatest]       = useState<GateLatest | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [infoLoading,  setInfoLoading]  = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [lastUpdate,   setLastUpdate]   = useState<Date | null>(null);

  // โหลดรายชื่อสถานี
  useEffect(() => {
    fetch(`${API_URL}/api/gate_info`)
      .then(r => r.json())
      .then(json => {
        const list: GateInfo[] = json.data || [];
        setGateInfoList(list);
        if (list.length > 0) setSelectedCode(list[0].sta_code);
      })
      .finally(() => setInfoLoading(false));
  }, []);

  // โหลดข้อมูลสถานีที่เลือก
  const fetchStationData = useCallback(async (staCode: string) => {
    if (!staCode) return;
    setLoading(true);
    setError(null);
    try {
       const res  = await fetch(`${API_URL}/api/gate_opening_latest/${staCode}`);
        if (!res.ok) throw new Error('ดึงข้อมูลล้มเหลว');
        const json = await res.json();
        setLatest(json.data ?? null);
        setLastUpdate(new Date());
      
    } catch (e: any) {
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

  const selectedInfo = gateInfoList.find(g => g.sta_code === selectedCode) ?? null;
  const gateConfig = selectedCode ? GATE_STATION_CONFIGS[selectedCode] : null;
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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2.5, flexWrap: 'wrap' }}>
         <Grid size={{xs:12,md:12}}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontFamily: "Prompt" }}>เลือกประตูระบายน้ำ</InputLabel>
                <Select value={selectedCode || ""} label="เลือกประตูระบายน้ำ" onChange={(e: SelectChangeEvent) => setSelectedCode(e.target.value)} sx={fontInfo}>
                  {gateInfoList.map((s: any) => (
                    <MenuItem key={s.sta_code} value={s.sta_code}>
                      {s.sta_name} ({s.sta_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

        <Tooltip title="รีเฟรชข้อมูล">
          <IconButton
            size="small"
            onClick={() => fetchStationData(selectedCode)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>

        {lastUpdate && (
          <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.75rem', color: 'text.disabled' }}>
            อัปเดตล่าสุด {lastUpdate.toLocaleTimeString('th-TH')}
          </Typography>
        )}
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, fontFamily: 'Prompt' }}>{error}</Alert>}

      {selectedInfo && (
        <Grid container spacing={2.5}>
          {/* ─── คอลัมน์ซ้าย: รูป + ข้อมูลทั่วไป + metric ─── */}
          <Grid size={{ xs: 12, md: 5.5 }}>
            <Stack spacing={2}>

              {/* รูปสถานี */}
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  component="img"
                  src={`${Path_URL}images/gate/${selectedInfo.sta_code}.jpg`}
                  alt={selectedInfo.sta_name}
                  onError={(e: any) => { e.target.src = `${Path_URL}images/default_img.png`; }}
                  sx={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                />
                <Box sx={{ p: 1.5 }}>
                  <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '1rem', color: 'primary.main' }}>
                    {selectedInfo.sta_name}
                  </Typography>
                  <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem', color: 'text.secondary' }}>
                    รหัส: {selectedInfo.sta_code}
                  </Typography>
                </Box>
              </Paper>

              {/* ข้อมูลสถานี */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', mb: 1, color: 'text.secondary' }}>
                  ข้อมูลทั่วไป
                </Typography>
                <Stack spacing={0.75}>
                  {[
                    { label: 'แม่น้ำ',   value: selectedInfo.river    || '-' },
                    { label: 'ตำบล',     value: selectedInfo.tambon   || '-' },
                    { label: 'อำเภอ',    value: selectedInfo.district || '-' },
                    { label: 'จังหวัด',  value: selectedInfo.province || '-' },
                    { label: 'พิกัด',    value: selectedInfo.lat && selectedInfo.long
                        ? `${parseFloat(selectedInfo.lat).toFixed(5)}, ${parseFloat(selectedInfo.long).toFixed(5)}`
                        : '-' },
                  ].map(row => (
                    <Box key={row.label} sx={{ display: 'flex', gap: 1 }}>
                      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem', color: 'text.disabled', minWidth: 60 }}>
                        {row.label}
                      </Typography>
                      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem', fontWeight: 600 }}>
                        {row.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                
              </Paper>

                {/* กล้อง CCTV */}
                <Paper sx={{borderRadius: 2 }}>
                    {cameras.length > 0 && (
                        <CameraViewer cameras={cameras} staCode={selectedCode ?? ''} />
                    )}
                </Paper>
            </Stack>
          </Grid>

          {/* ─── คอลัมน์ขวา: บาน + กล้อง ─────────────────────── */}
          <Grid size={{ xs: 12, md: 6.5 }}>
            <Stack spacing={2}>

              {/* การเปิดบาน */}
                {gateConfig ? (
                        <GateOpeningDisplay config={gateConfig} />
                ) : (
                  <>
                     <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontFamily: 'Prompt', color: 'text.disabled' }}>
                            ยังไม่มีการตั้งค่าบานของสถานีนี้
                            </Typography>
                        </Box>
                     </Paper>
                  </>
                )}
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                    {selectedCode && (
                            <StationCrossSectionChart
                                staCode={selectedCode}
                                waterLevel={latest?.wl_upper ?? null}   // ← ระดับน้ำล่าสุด
                                warnLevels={GATE_WARN_LEVELS[selectedCode]}
                                title="ภาพตัดขวางระดับน้ำเหนือประตู"
                            />
                    )}
                </Paper>

            </Stack>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}