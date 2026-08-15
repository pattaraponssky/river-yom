// src/app/dashboard/page.tsx
'use client';

import '@/app/globals.css';
import { Container, Box, Typography } from '@mui/material';
import { Path_URL, formatThaiDay } from '../../lib/utility';
import { BoxStyle } from '@/theme/style';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import FloodWarningTable from './components/WarningTable';
import WaterForecastChart from './components/WaterForecastChart';
import LongProfileChart from './components/LongProfile';
import WaterLevelChart from './components/WaterLevelChart';
import { forecastMenus } from '@/lib/menuFloating';

import { useMemo } from 'react';
import CenteredLoading from '@/components/Layout/CenteredLoading';
import { Alert } from '@mui/material';
import { useRasData } from '@/components/hooks/useRasData';

// ─── Station ที่ใช้คำนวณ warning table ───────────────────────

const WARNING_STATIONS = ['Y.15', 'Y.16', 'Y.4', 'Y.50', 'Y.64'];

export default function Dashboard() {
  const { today, archive, loading, error } = useRasData(3); // archive ย้อนหลัง 3 วัน

  // ─── คำนวณค่า max / peak / trend จาก forecast วันนี้ ────
  const { maxElevations, waterPeaks, waterTrends } = useMemo(() => {
    if (!today) return { maxElevations: {}, waterPeaks: {}, waterTrends: {} };

    const now      = new Date();
    const today9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const tomorrow9am = new Date(today9am);
    tomorrow9am.setDate(today9am.getDate() + 1);

    const futurePoints = today.points.filter(p => new Date(p.time) >= today9am);
    const maxElevations: Record<string, number>                       = {};
    const waterPeaks:    Record<string, { elevation: number; time: string }> = {};
    const waterTrends:   Record<string, string>                       = {};

    WARNING_STATIONS.forEach(sta => {
      const pts = futurePoints.filter(p => p.station === sta);
      if (!pts.length) return;

      const peak = pts.reduce((a, b) => b.elevation > a.elevation ? b : a);
      maxElevations[sta] = peak.elevation;
      waterPeaks[sta]    = { elevation: peak.elevation, time: peak.time };

      const before = pts.filter(p => new Date(p.time) < tomorrow9am);
      const after  = pts.filter(p => new Date(p.time) >= tomorrow9am);

      if (!before.length || !after.length) {
        waterTrends[sta] = 'ไม่มีข้อมูลเพียงพอ';
        return;
      }

      const avg = (arr: typeof pts) => arr.reduce((s, p) => s + p.elevation, 0) / arr.length;
      const diff = avg(after) - avg(before);
      waterTrends[sta] = diff > 0.01 ? 'เพิ่มขึ้น' : diff < -0.01 ? 'ลดลง' : 'คงที่';
    });

    return { maxElevations, waterPeaks, waterTrends };
  }, [today]);

  // ─── แปลงข้อมูลสำหรับ LongProfile (forecast วันนี้เท่านั้น) ──
 const forecastLongProfile = useMemo(() => {
  if (!today) return [];

  return today.points
    // กรองเฉพาะแม่น้ำยม (Yom River)
    .filter(p => {
      // รองรับกรณีมีช่องว่างท้ายชื่อ เช่น "Yom River       "
      const river = (p.river ?? '').toString().trim();
      return river === 'Yom River';
    })
    .map(p => ({
      CrossSection: p.crossSection,
      River:        (p.river ?? '').toString().trim(),
      Date:         p.time.replace('T', ' '),
      WaterLevel:   p.elevation,
    }));
}, [today]);

  // ─── แปลงข้อมูลสำหรับ WaterLevelChart ───────────────────────
  const waterLevelChartData = useMemo(() => {
    if (!today) return [];
    return today.points.map(p => ({
      // CrossSection: p.crossSection,
      // Date:         p.time.replace('T', ' '),
      // WaterLevel:   p.elevation,
      station:   p.station,
      time:      p.time,
      elevation: p.elevation,
    }));
  }, [today]);

  if (loading) return <CenteredLoading />;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        ผลพยากรณ์น้ำโดยแบบจำลองโมเดลลุ่มน้ำ วันที่ {formatThaiDay(Date())}
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, fontFamily: 'Prompt' }}>
          {error}
        </Alert>
      )}

      <Box sx={BoxStyle} id="flood-warning">
        <FloodWarningTable
          maxLevels={maxElevations}
          waterTrends={waterTrends}
          waterPeaks={waterPeaks}
        />
      </Box>

      <Box sx={BoxStyle} id="forecast-chart">
        <WaterForecastChart today={today} archive={archive} />
      </Box>

      <Box sx={BoxStyle} id="profile-chart">
        <LongProfileChart waterData={forecastLongProfile} />
      </Box>

      <Box sx={BoxStyle} id="water-level">
        <WaterLevelChart data={waterLevelChartData} />
      </Box>

      <FloatingMenu menus={forecastMenus} />
    </Container>
  );
}
