// src/app/dashboard/page.tsx
'use client';

import '@/app/globals.css';
import { Container, Box, Typography } from '@mui/material';
import { formatThaiDay } from '../../lib/utility';
import { BoxStyle } from '@/theme/style';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import FloodWarningTable from './components/WarningTable';
import WaterForecastChart from './components/WaterForecastChart';
import LongProfileChart from './components/LongProfile';
import WaterLevelChart from './components/WaterLevelChart';
import { forecastMenus } from '@/lib/menuFloating';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ForecastSkeleton } from './components/ForecastSkeleton';
import { Alert } from '@mui/material';
import { useRasData, forecastStartTs, toTs } from '@/components/hooks/useRasData';
import { useClientDate } from '@/components/hooks/useClientDate';

// ─── Station ที่ใช้คำนวณ warning table ───────────────────────

const WARNING_STATIONS = ['Y.15', 'Y.16', 'Y.4', 'Y.50', 'Y.64', 'YR.01', 'YR.02', 'YR.03', 'YR.04', 'YR.05', 'YR.06'];

export default function Dashboard() {
  const profileSection = useRef<HTMLDivElement>(null);
  const [loadProfile, setLoadProfile] = useState(false);
  const { today, archive, loading, archiveLoading, error, profile, profileError } = useRasData(1, loadProfile);
  const forecastLoading = !today && archive.length === 0 && (loading || archiveLoading);

  useEffect(() => {
    const section = profileSection.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setLoadProfile(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      setLoadProfile(true);
      observer.disconnect();
    }, { rootMargin: '240px 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const clientDate = useClientDate();

  // ─── คำนวณค่า max / peak / trend จาก forecast วันนี้ ────
  const { maxElevations, waterPeaks, waterTrends } = useMemo(() => {
    if (!today) return { maxElevations: {}, waterPeaks: {}, waterTrends: {} };

    const tofTs        = forecastStartTs();
    const tomorrowTofTs = tofTs + 24 * 60 * 60 * 1000;

    const futurePoints = today.points.filter(p => toTs(p.time) >= tofTs);
    const maxElevations: Record<string, number>                       = {};
    const waterPeaks:    Record<string, { elevation: number; time: string }> = {};
    const waterTrends:   Record<string, string>                       = {};

    WARNING_STATIONS.forEach(sta => {
      const pts = futurePoints.filter(p => p.station === sta);
      if (!pts.length) return;

      const peak = pts.reduce((a, b) => b.elevation > a.elevation ? b : a);
      maxElevations[sta] = peak.elevation;
      waterPeaks[sta]    = { elevation: peak.elevation, time: peak.time };

      const before = pts.filter(p => toTs(p.time) < tomorrowTofTs);
      const after  = pts.filter(p => toTs(p.time) >= tomorrowTofTs);

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
    if (!profile) return [];
    const tofTs = forecastStartTs();

    return profile
      .filter(point => toTs(point.time) >= tofTs)
      .map(point => ({
        CrossSection: point.crossSection,
        Date: point.time.replace('T', ' '),
        WaterLevel: point.elevation,
      }));
  }, [profile]);

  // ─── แปลงข้อมูลสำหรับ WaterLevelChart ───────────────────────
  const waterLevelChartData = useMemo(() => {
    if (!today) return [];
    return today.points.map(p => ({
      station:   p.station,
      time:      p.time,
      elevation: p.elevation,
    }));
  }, [today]);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main',textAlign:{md:"left",xs:"center"},fontSize:{ md:24 , xs:19 }}}>
        ผลพยากรณ์น้ำโดยแบบจำลองโมเดลลุ่มน้ำ วันที่ {clientDate ? formatThaiDay(clientDate.toString()) : ''}
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, fontFamily: 'Prompt' }}>
          {error}
        </Alert>
      )}

      <Box sx={BoxStyle} id="flood-warning">
        {loading ? <ForecastSkeleton section="warning" /> : (
          <FloodWarningTable
            maxLevels={maxElevations}
            waterTrends={waterTrends}
            waterPeaks={waterPeaks}
          />
        )}
      </Box>

      <Box sx={BoxStyle} id="forecast-chart">
        {forecastLoading ? <ForecastSkeleton section="forecast" /> : (
          today || archive.length > 0
            ? <WaterForecastChart today={today} archive={archive} />
            : <Alert severity="info">ยังไม่มีข้อมูลสำหรับกราฟพยากรณ์</Alert>
        )}
      </Box>

      <Box sx={BoxStyle} id="profile-chart" ref={profileSection}>
        {profileError ? <Alert severity="warning">โหลดข้อมูลรูปตัดตามยาวไม่สำเร็จ</Alert> : (
          !loadProfile || profile === null ? <ForecastSkeleton section="profile" /> : (
            forecastLongProfile.length
              ? <LongProfileChart waterData={forecastLongProfile} />
              : <Alert severity="info">ยังไม่มีข้อมูลพยากรณ์สำหรับรูปตัดตามยาว</Alert>
          )
        )}
      </Box>

      <Box sx={BoxStyle} id="water-level">
        {loading ? <ForecastSkeleton section="station" /> : (
          today ? <WaterLevelChart data={waterLevelChartData} /> : (
            <Alert severity="info">ยังไม่มีข้อมูลระดับน้ำรายชั่วโมง</Alert>
          )
        )}
      </Box>

      <FloatingMenu menus={forecastMenus} />
    </Container>
  );
}
