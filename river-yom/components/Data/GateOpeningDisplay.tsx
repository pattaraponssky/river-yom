// components/Data/GateOpeningDisplay.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress,
  Tooltip, IconButton, Divider, Alert,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { GateStationConfig } from '@/lib/gateConfig';
import { API_URL, Path_URL } from '@/lib/utility';
import WaterIcon from '@mui/icons-material/Water';

interface GateOpeningData {
  sta_code: string;
  date: string;
  wl_upper?: number;
  wl_lower?: number;
  discharge?: number;
  [key: string]: any; // gate1_height, gate2_height, ... (หน่วยเมตร ตามข้อมูลดิบจาก API)
}

interface GateOpeningDisplayProps {
  config: GateStationConfig;
}

// ─── หน่วยแสดงผลระยะเปิดบาน ──────────────────────────────────────
const rawCmToMeters = (raw: number) => raw / 100;
const fmtMeters = (m: number) => m.toFixed(2);

// ─── ค่าคงที่มิติ ────────────────────────────────────────────────
const DECK_H          = 22;   // คานทับหลัง (deck)
const ROW_H           = 230;  // ความสูงช่องทั้งหมด (เสา/บาน) จากใต้ deck ถึงเส้นน้ำ
const GATE_FRAME_H    = 200;  // ความสูง "บานประตู" แบบเดิม (แขวนลงมาจาก deck เว้นช่องบนไว้)
const LABEL_H         = 24;
const STATS_H         = 60;
const GATE_WIDTH_PX   = 64;
const PIER_WIDTH_PX   = 14;
const WATER_SCALE_H   = GATE_FRAME_H; // อ้างอิงสเกลเดียวกับความสูงบานประตู เพื่อวางเส้นระดับน้ำให้ตรงกัน

type ColumnDef =
  | { type: 'pier' }
  | { type: 'gate'; gate: GateStationConfig['gates'][number] };

// ─── เสาตอม่อ ───────────────────────────────────────────────────
const Pier: React.FC = () => (
  <Box
    sx={{
      width: PIER_WIDTH_PX,
      height: ROW_H,
      background: 'linear-gradient(180deg, #CFD8DC 0%, #B0BEC5 100%)',
      border: '1px solid #90A4AE',
      borderTop: 'none',
      boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.15), inset 2px 0 4px rgba(255,255,255,0.3)',
      flexShrink: 0,
    }}
  />
);

// ─── บานประตู (แบบเดิม: บาร์เติมน้ำ) — แสดงระยะเปิดเป็น "ซม." ────
const GateFrame: React.FC<{
  maxHeight: number;
  currentHeight: number | null;
}> = ({ maxHeight, currentHeight }) => {
  const pct = currentHeight != null
    ? Math.min(Math.max((currentHeight / maxHeight) * 100, 0), 100)
    : 0;
  const hasData = currentHeight != null;

  const fillColor =
    !hasData ? '#9E9E9E' :
    pct >= 80 ? '#D32F2F' :
    pct >= 50 ? '#F57C00' :
    pct >= 20 ? '#388E3C' : '#1565C0';

  return (
    <Tooltip
      title={
        hasData
          ? `เปิด ${fmtMeters(currentHeight!)} ม. จากสูงสุด ${fmtMeters(maxHeight)} ม.`
          : 'ไม่มีข้อมูล'
      }
      arrow
    >
      <Box
        sx={{
          position: 'relative',
          width:  GATE_WIDTH_PX,
          height: GATE_FRAME_H,
          border: '3px solid #37474F',
          bgcolor: '#ECEFF1',
          overflow: 'hidden',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.25)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {/* น้ำ (พื้นที่ที่เปิด) */}
        <Box
          sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: `${pct}%`,
            bgcolor: hasData ? `${fillColor}33` : 'transparent',
            borderTop: hasData && pct > 0 ? `2px solid ${fillColor}88` : 'none',
            transition: 'height 0.8s ease',
          }}
        />
        {/* บาน */}
        <Box
          sx={{
            position: 'absolute',
            bottom: `${pct}%`,
            left: 6, right: 6,
            height: Math.max(4, (1 - pct / 100) * GATE_FRAME_H - 4),
            bgcolor: '#546E7A',
            borderRadius: 1,
            transition: 'bottom 0.8s ease, height 0.8s ease',
          }}
        >
          {[0.25, 0.5, 0.75].map(p => (
            <Box
              key={p}
              sx={{ position: 'absolute', top: `${p * 100}%`, left: 4, right: 4, height: '2px', bgcolor: '#37474F', opacity: 0.4 }}
            />
          ))}
        </Box>
        {/* scale marks */}
        {[0, 25, 50, 75, 100].map(mark => (
          <Box key={mark} sx={{ position: 'absolute', right: 2, bottom: `${mark}%`, width: 6, height: '1px', bgcolor: '#9E9E9E' }} />
        ))}
      </Box>
    </Tooltip>
  );
};

// ─── เส้นระดับน้ำ (วางทับพื้นหลัง) ───────────────────────────────
const WaterLevelLine: React.FC<{
  label: string;
  value: number;
  pct: number;
  color: string;
  align: 'top' | 'bottom';
}> = ({ label, value, pct, color, align }) => (
  <Box
    sx={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: `${pct}%`,
      zIndex: 3,
      pointerEvents: 'none',
    }}
  >
    <Box
      sx={{
        borderTop: `2px dashed ${color}`,
        boxShadow: `0 0 4px ${alpha(color, 0.6)}`,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        left: 6,
        [align === 'top' ? 'bottom' : 'top']: 4,
        px: 0.7,
        py: 0.1,
        borderRadius: 0.75,
        bgcolor: alpha(color, 0.9),
        whiteSpace: 'nowrap',
      }}
    >
      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.66rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
        {label} {value} ม.
      </Typography>
    </Box>
  </Box>
);

// ─── Water Level Indicator ─────────────────────────────────────
const WaterLevelBar: React.FC<{
  label: string;
  value: number | null;
  unit?: string;
  color: string;
}> = ({ label, value, unit = 'ม.รทก.', color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <WaterIcon sx={{ fontSize: '1rem', color }} />
      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.88rem', color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
    <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '1rem', color }}>
      {value != null ? `${value} ${unit}` : '-'}
    </Typography>
  </Box>
);

// ─── Main Component ────────────────────────────────────────────
const GateOpeningDisplay: React.FC<GateOpeningDisplayProps> = ({ config }) => {
  const [data, setData]       = useState<GateOpeningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/gate_opening_latest/${config.sta_code}`);
      if (!res.ok) throw new Error('ดึงข้อมูลล้มเหลว');
      const json = await res.json();
      setData(json.data ?? null);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [config.sta_code]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalDischarge = data?.discharge ?? null;
  const openGates = data
    ? config.gates.filter(g => {
        const v = data[g.fieldName];
        return v != null && parseFloat(v) > 0;
      }).length
    : 0;

  // ─── ลำดับคอลัมน์: เสา - บาน - เสา - บาน - ... - เสา ──────────
  const columns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [{ type: 'pier' }];
    config.gates.forEach(gate => {
      cols.push({ type: 'gate', gate });
      cols.push({ type: 'pier' });
    });
    return cols;
  }, [config.gates]);

  const colWidth = (c: ColumnDef) => (c.type === 'pier' ? PIER_WIDTH_PX : GATE_WIDTH_PX);

  // ─── สเกลสำหรับวางเส้นระดับน้ำเหนือ/ท้ายประตูบนพื้นหลัง (ใช้ config) ───────
  const { scaleMin, scaleMax } = useMemo(() => {
    // ใช้ค่าจาก config เป็นหลัก (ที่เร เพิ่ม visualMinLevel / visualMaxLevel)
    if (config.visualMinLevel != null && config.visualMaxLevel != null) {
      return {
        scaleMin: config.visualMinLevel,
        scaleMax: config.visualMaxLevel,
      };
    }

    // Fallback หากยังไม่มีค่าจาก config
    const levels = [data?.wl_upper, data?.wl_lower].filter((v): v is number => v != null);
    if (!levels.length) {
      return { scaleMin: 15, scaleMax: 26 };
    }

    const minLvl = Math.min(...levels);
    const maxLvl = Math.max(...levels);

    return {
      scaleMin: Math.floor(Math.min(minLvl - 6, 15)),
      scaleMax: Math.ceil(Math.max(maxLvl + 4, 26)),
    };
  }, [
    config.visualMinLevel,
    config.visualMaxLevel,
    data?.wl_upper,
    data?.wl_lower,
  ]);

  const pctForLevel = (value: number) => {
    const range = Math.max(scaleMax - scaleMin, 0.01);
    return Math.min(Math.max(((value - scaleMin) / range) * 100, 0), 100);
  };

  // เทียบสัดส่วนกับความสูงบานประตู (GATE_FRAME_H) แล้วแปลงเป็น % ของช่องทั้งหมด (ROW_H)
  const linePctInRow = (value: number) => (pctForLevel(value) * WATER_SCALE_H) / ROW_H;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 2, mt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              src={`${Path_URL}/images/icons/gate_icon.png`}
              sx={{ width: { xs: 35, md: 45 }, height: { xs: 35, md: 45 }, boxShadow: `0 4px 12px ${alpha(primary, 0.4)}`, mr: 2 }}
            />
            <Typography sx={{ fontWeight: 'bold', fontSize: { md: '1.4rem', xs: '1rem' }, fontFamily: 'Prompt' }}>
              สถานะการเปิด-ปิดบานประตูระบายน้ำ ปัจจุบัน
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {data && (
            <Chip
              label={`เปิด ${openGates}/${config.gates.length} บาน`}
              size="small"
              color={openGates > 0 ? 'primary' : 'default'}
              sx={{ fontFamily: 'Prompt', fontWeight: 600 }}
            />
          )}
          <Tooltip title="รีเฟรช">
            <IconButton size="small" onClick={fetchData} disabled={loading}>
              {loading ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, fontFamily: 'Prompt' }}>{error}</Alert>}

      {/* ─── โครงสร้างประตูระบายน้ำ (ตัดทอนจากแบบอ้างอิง) ─────────── */}
      <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'grey.50' }}>

        {/* แถวป้ายชื่อบาน */}
        <Box sx={{ display: 'flex', justifyContent: 'center',  px: 1, pt: 1.5, overflowX: 'auto' }}>
          {columns.map((c, i) => (
            <Box key={i} sx={{ width: colWidth(c), flexShrink: 0, height: LABEL_H, textAlign: 'center' }}>
              {c.type === 'gate' && (
                <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.8rem', color: 'text.primary', whiteSpace: 'nowrap' }}>
                  {c.gate.label}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* คานทับหลัง (deck) — เส้นหลังคาแดงคาดบาง ๆ */}
        <Box sx={{ position: 'relative', mt: 1 }}>
          <Box
            sx={{
              height: DECK_H,
              mx: { xs: 2, sm: 4 },
              background: 'linear-gradient(180deg, #90A4AE 0%, #78909C 100%)',
              borderRadius: '3px 3px 0 0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }}
          />
          <Box
            sx={{
              position: 'absolute', top: 0, left: { xs: 16, sm: 32 }, right: { xs: 16, sm: 32 },
              height: 4, bgcolor: '#C62828', borderRadius: '3px 3px 0 0',
            }}
          />
        </Box>

        {/* ช่องน้ำ: เสา / บาน + เส้นระดับน้ำเหนือ-ท้ายประตู */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            px: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            background: 'linear-gradient(180deg, #b4c4cc 0%, #c8d9e2 60%, #d4e5ed 100%)',
          }}
        >
          {columns.map((c, i) => (
            <Box key={i} sx={{ width: colWidth(c), flexShrink: 0, height: ROW_H, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              {c.type === 'pier' && <Pier />}
              {c.type === 'gate' && (
                <GateFrame
                  maxHeight={c.gate.maxHeight}
                  currentHeight={data ? rawCmToMeters(parseFloat(data[c.gate.fieldName]) || 0) : null}
                />
              )}
            </Box>
          ))}

          {data?.wl_upper != null && (
            <WaterLevelLine
              label="ระดับน้ำเหนือประตู"
              value={data.wl_upper}
              pct={linePctInRow(data.wl_upper)}
              color="#1565C0"
              align="top"
            />
          )}
          {data?.wl_lower != null && (
            <WaterLevelLine
              label="ระดับน้ำท้ายประตู"
              value={data.wl_lower}
              pct={linePctInRow(data.wl_lower)}
              color="#00838F"
              align="top"
            />
          )}
        </Box>

        {/* แถวค่าตัวเลข/สถานะใต้บาน (แสดงระยะเปิดบานเป็น "ซม.") */}
        <Box sx={{ display: 'flex', justifyContent: 'center',  px: 1, pb: 1.5, pt: 1, overflowX: 'auto' }}>
          {columns.map((c, i) => {
            if (c.type !== 'gate') {
              return <Box key={i} sx={{ width: colWidth(c), flexShrink: 0, height: STATS_H }} />;
            }
            const currentHeight = data ? rawCmToMeters(parseFloat(data[c.gate.fieldName]) || 0) : null;
            const maxHeight = c.gate.maxHeight;
            const pct = currentHeight != null ? Math.min(Math.max((currentHeight / maxHeight) * 100, 0), 100) : 0;
            const hasData = currentHeight != null;
            const fillColor =
              !hasData ? '#9E9E9E' :
              pct >= 80 ? '#D32F2F' :
              pct >= 50 ? '#F57C00' :
              pct >= 20 ? '#388E3C' : '#1565C0';

            return (
              <Box key={i} sx={{ width: colWidth(c), flexShrink: 0, height: STATS_H, textAlign: 'center' }}>
                <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '0.9rem', color: fillColor }}>
                  {hasData ? `${fmtMeters(currentHeight!)} ม.` : '-'}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center', mt: 1.5, mb: 1 }}>
        {[
          { color: '#1565C0', label: '0-20%' },
          { color: '#388E3C', label: '20-50%' },
          { color: '#F57C00', label: '50-80%' },
          { color: '#D32F2F', label: '80-100%' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color }} />
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.72rem', color: 'text.secondary' }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
            ระดับน้ำ
          </Typography>
          <WaterLevelBar label="ระดับน้ำเหนือประตู" value={data?.wl_upper ?? null} color="#1565C0" />
          <WaterLevelBar label="ระดับน้ำท้ายประตู" value={data?.wl_lower ?? null} color="#0288D1" />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
            อัตราการไหล
          </Typography>
          <Box sx={{ textAlign: 'center', py: 2, bgcolor: '#E3F2FD', borderRadius: 2, border: '1px solid #90CAF9' }}>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '1.8rem', fontWeight: 800, color: '#1565C0', lineHeight: 1 }}>
              {totalDischarge != null ? totalDischarge : '-'}
            </Typography>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem', color: '#1565C0', mt: 0.25 }}>
              ลบ.ม./วินาที
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default GateOpeningDisplay;