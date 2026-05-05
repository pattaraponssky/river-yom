// components/Data/GateOpeningDisplay.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress,
  Tooltip, IconButton, Divider, Alert,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WaterIcon   from '@mui/icons-material/Water';
import { GateStationConfig } from '@/lib/gateConfig';
import { API_URL } from '@/lib/utility';

interface GateOpeningData {
  sta_code: string;
  date: string;
  wl_upper?: number;
  wl_lower?: number;
  discharge?: number;
  [key: string]: any; // gate1_height, gate2_height, ...
}

interface GateOpeningDisplayProps {
  config: GateStationConfig;
}

// ─── Single Gate Visual ────────────────────────────────────────
const GateVisual: React.FC<{
  label: string;
  maxHeight: number;
  currentHeight: number | null;
  color?: string;
  index: number;
}> = ({ label, maxHeight, currentHeight, color = '#1565C0', index }) => {
  const pct = currentHeight != null
    ? Math.min(Math.max((currentHeight / maxHeight) * 100, 0), 100)
    : 0;

  const hasData = currentHeight != null;

  // สีตาม % การเปิด
  const fillColor =
    !hasData       ? '#9E9E9E' :
    pct >= 80      ? '#D32F2F' :
    pct >= 50      ? '#F57C00' :
    pct >= 20      ? '#388E3C' :
                     '#1565C0';

  const statusLabel =
    !hasData       ? 'ไม่มีข้อมูล' :
    pct === 0      ? 'ปิดสนิท'     :
    pct >= 100     ? 'เปิดเต็มที่'  :
    pct >= 80      ? 'เปิดมาก'     :
    pct >= 50      ? 'เปิดปานกลาง' :
    pct >= 20      ? 'เปิดน้อย'    :
                     'เปิดเล็กน้อย';

  const GATE_HEIGHT_PX = 160; // pixel ความสูง visual
  const GATE_WIDTH_PX  = 70;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      {/* Label */}
      <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
        {label}
      </Typography>

      {/* Gate Frame */}
      <Tooltip title={hasData ? `เปิด ${currentHeight?.toFixed(2)} ม. จากสูงสุด ${maxHeight} ม. (${pct.toFixed(1)}%)` : 'ไม่มีข้อมูล'} arrow>
        <Box
          sx={{
            position: 'relative',
            width:  GATE_WIDTH_PX,
            height: GATE_HEIGHT_PX,
            border: '3px solid #37474F',
            borderRadius: '4px 4px 0 0',
            bgcolor: '#ECEFF1',
            overflow: 'hidden',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
        >
          {/* น้ำ (พื้นที่ที่เปิด) */}
          <Box
            sx={{
              position:   'absolute',
              bottom:     0,
              left:       0,
              right:      0,
              height:     `${pct}%`,
              bgcolor:    hasData ? `${fillColor}33` : 'transparent',
              borderTop:  hasData && pct > 0 ? `2px solid ${fillColor}88` : 'none',
              transition: 'height 0.8s ease',
            }}
          />

          {/* บาน (แถบสีเข้ม แทน "เหล็ก") */}
          <Box
            sx={{
              position:   'absolute',
              bottom:     `${pct}%`,
              left:       6,
              right:      6,
              height:     Math.max(4, (1 - pct / 100) * GATE_HEIGHT_PX - 4),
              bgcolor:    '#546E7A',
              borderRadius: 1,
              transition: 'bottom 0.8s ease, height 0.8s ease',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* เส้นตามขวางของบาน */}
            {[0.25, 0.5, 0.75].map(p => (
              <Box
                key={p}
                sx={{
                  position: 'absolute',
                  top: `${p * 100}%`,
                  left: 4, right: 4,
                  height: '2px',
                  bgcolor: '#37474F',
                  opacity: 0.4,
                }}
              />
            ))}
          </Box>

          {/* % text overlay */}
          {hasData && pct > 10 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: `${pct / 2 - 8}%`,
                left: 0, right: 0,
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: fillColor, fontFamily: 'Prompt' }}>
                {pct.toFixed(0)}%
              </Typography>
            </Box>
          )}

          {/* Scale marks ด้านขวา */}
          {[0, 25, 50, 75, 100].map(mark => (
            <Box
              key={mark}
              sx={{
                position: 'absolute',
                right: 2,
                bottom: `${mark}%`,
                width: 6,
                height: '1px',
                bgcolor: '#9E9E9E',
              }}
            />
          ))}
        </Box>
      </Tooltip>

      {/* Base (ฐาน) */}
      <Box
        sx={{
          width: GATE_WIDTH_PX + 12,
          height: 10,
          bgcolor: '#37474F',
          borderRadius: '0 0 4px 4px',
          mt: '-2px',
        }}
      />

      {/* ค่าตัวเลข */}
      <Box sx={{ textAlign: 'center', mt: 0.5 }}>
        <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '1rem', color: fillColor }}>
          {hasData ? `${currentHeight?.toFixed(2)} ม.` : '-'}
        </Typography>
        <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.72rem', color: 'text.secondary' }}>
          / {maxHeight.toFixed(1)} ม.
        </Typography>
        <Chip
          label={statusLabel}
          size="small"
          sx={{
            mt: 0.5,
            fontFamily: 'Prompt',
            fontSize: '0.7rem',
            height: 20,
            bgcolor: `${fillColor}22`,
            color: fillColor,
            border: `1px solid ${fillColor}66`,
            fontWeight: 600,
          }}
        />
      </Box>
    </Box>
  );
};

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
      {value != null ? `${value.toFixed(2)} ${unit}` : '-'}
    </Typography>
  </Box>
);

// ─── Main Component ────────────────────────────────────────────
const GateOpeningDisplay: React.FC<GateOpeningDisplayProps> = ({ config }) => {
  const [data, setData]       = useState<GateOpeningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ดึงข้อมูลล่าสุดของสถานี
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
    // auto refresh ทุก 5 นาที
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // คำนวณ discharge รวม
  const totalDischarge = data?.discharge ?? null;
  const openGates = data
    ? config.gates.filter(g => {
        const v = data[g.fieldName];
        return v != null && parseFloat(v) > 0;
      }).length
    : 0;

  return (
    <Paper sx={{ p: 2.5, borderRadius: 2, mt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '1rem' }}>
            🚪 สถานะการเปิด-ปิดบาน
          </Typography>
          <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.78rem', color: 'text.secondary' }}>
            {lastUpdate ? `อัปเดตล่าสุด: ${lastUpdate.toLocaleTimeString('th-TH')}` : 'กำลังโหลด...'}
          </Typography>
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

      {/* Gate Visuals */}
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 2, sm: 3 },
          justifyContent: 'center',
          flexWrap: 'wrap',
          py: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          // พื้นน้ำ
          background: 'linear-gradient(180deg, #ECEFF1 0%, #E3F2FD 100%)',
        }}
      >
        {config.gates.map((gate, idx) => (
          <GateVisual
            key={gate.id}
            label={gate.label}
            maxHeight={gate.maxHeight}
            currentHeight={data ? (parseFloat(data[gate.fieldName]) || 0) : null}
            color={gate.color}
            index={idx}
          />
        ))}
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

      {/* ระดับน้ำ + discharge */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
            ระดับน้ำ
          </Typography>
          <WaterLevelBar
            label="ระดับน้ำเหนือประตู"
            value={data?.wl_upper ?? null}
            color="#1565C0"
          />
          <WaterLevelBar
            label="ระดับน้ำท้ายประตู"
            value={data?.wl_lower ?? null}
            color="#0288D1"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 5 }}>
          <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', mb: 0.5, color: 'text.secondary' }}>
            อัตราการไหล
          </Typography>
          <Box
            sx={{
              textAlign: 'center', py: 2,
              bgcolor: '#E3F2FD', borderRadius: 2,
              border: '1px solid #90CAF9',
            }}
          >
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '1.8rem', fontWeight: 800, color: '#1565C0', lineHeight: 1 }}>
              {totalDischarge != null ? totalDischarge.toFixed(2) : '-'}
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