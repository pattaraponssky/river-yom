// components/WaterForecastChart.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, Box, Typography, Grid,
  ToggleButton, ToggleButtonGroup, useTheme,
  Chip,
} from '@mui/material';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import CenteredLoading from '@/components/Layout/CenteredLoading';
import { titleStyle } from '@/theme/style';
import { ForecastSnapshot, STATION_MAPPING } from '@/components/hooks/useRasData';


const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────

interface Props {
  today:   ForecastSnapshot | null;
  archive: ForecastSnapshot[];          // เรียง เก่า → ใหม่
}

type ViewMode = 'all' | 'single';

// ─── Threshold config ─────────────────────────────────────────

interface ThresholdData {
  staCode:  string;
  location: string;
  tambon:   string;
  watch:    number;
  alert:    number;
  crisis:   number;
  maxY:     number;
}

const THRESHOLDS: ThresholdData[] = [
  { staCode:'Y.15', location:'วัดพระรูป',           tambon:'ต.ในเมือง อ.เมือง จ.พิษณุโลก',  watch:2.90, alert:3.20, crisis:3.50, maxY:3.5 },
  { staCode:'Y.16', location:'บ้านบางการ้อง',        tambon:'ต.บางการ้อง อ.เมือง จ.พิษณุโลก', watch:2.16, alert:2.28, crisis:2.40, maxY:2.4 },
  { staCode:'Y.4',  location:'บ้านบางไทรป่า',        tambon:'ต.บางไทรป่า อ.บางระกำ จ.พิษณุโลก', watch:1.60, alert:1.70, crisis:1.80, maxY:1.8 },
  { staCode:'Y.50', location:'ที่ว่าการอำเภอ',       tambon:'ต.บางระกำ อ.บางระกำ จ.พิษณุโลก',  watch:1.25, alert:1.38, crisis:1.50, maxY:1.5 },
  { staCode:'Y.64', location:'ตลาดสามพราน',          tambon:'ต.บางระกำ อ.บางระกำ จ.พิษณุโลก',  watch:1.20, alert:1.35, crisis:1.50, maxY:1.5 },
  // { staCode:'ปตร.พลเทพ',           location:'ปตร.พลเทพ',           tambon:'', watch:2.90, alert:3.20, crisis:3.50, maxY:3.5 },
  // { staCode:'ปตร.ท่าโบสถ์',        location:'ปตร.ท่าโบสถ์',        tambon:'', watch:2.16, alert:2.28, crisis:2.40, maxY:2.4 },
  // { staCode:'ปตร.ชลมาร์คพิจารณ์',  location:'ปตร.ชลมาร์คพิจารณ์',  tambon:'', watch:2.16, alert:2.28, crisis:2.40, maxY:2.4 },
  // { staCode:'ปตร.โพธิ์พระยา',      location:'ปตร.โพธิ์พระยา',      tambon:'', watch:2.16, alert:2.28, crisis:2.40, maxY:2.4 },
];
const THRESHOLD_MAP = new Map(THRESHOLDS.map(t => [t.staCode, t]));

// const ARCHIVE_COLORS = [
//   '#C62828', // red 800
//   '#F44336', // red 500
//   '#E57373', // red 300
//   '#E53935', // red 600
//   '#EF9A9A', // red 200
//   '#EF5350', // red 400
//   '#FFCDD2', // red 100
// ];

const ARCHIVE_COLORS = ['#CFD8DC', '#90A4AE', '#607D8B'];

// ─── Helpers ──────────────────────────────────────────────────
function today9amTs(): number {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

/** จุด forecast ของ snapshot หนึ่งสำหรับสถานีหนึ่ง เริ่มจากเวลา >= snapshotDate 09:00 */
function snapshotPoints(snapshot: ForecastSnapshot, station: string) {

  const startTs  = new Date(`${snapshot.date}T09:00:00`).getTime();

  return snapshot.points
    .filter(p => p.station === station && new Date(p.time).getTime() >= startTs)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .map(p => ({ x: p.time, y: parseFloat(p.elevation.toFixed(2)) }));
}

// ─── Chart options builder ────────────────────────────────────

function buildOptions(
  stationCode: string,
  allSeriesData: { x: string; y: number }[],
  isDark: boolean,
  tofTs: number,
): ApexOptions {
  const thr      = THRESHOLD_MAP.get(stationCode);
  const vals     = allSeriesData.map(d => d.y);
  const maxData  = vals.length ? Math.max(...vals) : 0;
  const minData  = vals.length ? Math.min(...vals) : 0;

  const yAnnotations: ApexAnnotations['yaxis'] = thr ? [
    {
      y: thr.crisis,
      borderColor: '#D32F2F', borderWidth: 2, strokeDashArray: 5,
      label: { borderColor: '#D32F2F', style: { color: '#fff', background: '#D32F2F', fontSize: '12px', fontWeight: 600 }, text: `ระดับตลิ่ง (${thr.crisis.toFixed(2)} ม.รทก.)` },
    },
    {
      y: thr.alert,
      borderColor: 'orange', borderWidth: 2,
      label: { borderColor: 'orange', style: { color: '#fff', background: 'orange', fontSize: '12px', fontWeight: 600 }, text: '' },
    },
    {
      y: thr.watch,
      borderColor: '#FFD700', borderWidth: 2,
      label: { borderColor: '#FFD700', style: { color: '#fff', background: '#FFD700', fontSize: '12px', fontWeight: 600 }, text: '' },
    },
  ] : [];

  const baseMax  = Math.max(maxData, thr?.crisis ?? 0, thr?.maxY ?? 0);

  return {
    chart: {
      background: isDark ? '#1e2533' : '#f8fafc',
      fontFamily: 'Prompt',
      foreColor:  isDark ? '#e2e8f0' : '#334155',
      type:    'line',
      height:  420,
      zoom:    { enabled: false },
      toolbar: { show: true },
    },
    title: {
      text:  `สถานี ${stationCode}${thr?.location ? ` – ${thr.location}` : ''}`,
      align: 'center',
      style: { fontSize: '16px', fontWeight: 700 },
    },
    // stroke width/dashArray ถูกกำหนดต่อ series ใน series array แต่ ApexCharts ต้องการ
    // array ที่มีขนาดเท่ากับ series → จัดการตอน pass series
    stroke: { width: [3, 3, 2, 2, 2], curve: 'smooth', dashArray: [0, 8, 6, 6, 6] },
    xaxis:  { type: 'datetime', labels: { format: 'dd MMM' } },
    yaxis: {
      min: Math.max(0, minData - 0.2),
      max: baseMax + 0.3,
      labels: { formatter: (v: number) => v.toFixed(2) },
      title: { text: 'ระดับน้ำ (ม.รทก.)' },
    },
    tooltip: {
      x: { format: 'dd MMM yyyy HH:mm' },
      y: { formatter: (v: number) => `${v.toFixed(2)} ม.รทก.` },
    },
    annotations: {
      xaxis: [{
        x: tofTs,
        borderColor: '#FF0000',
        label: { position: 'top', offsetY: -10, borderColor: '#000', style: { color: '#fff', background: '#FF0000', fontSize: '14px' }, text: 'TOF' },
      }],
      yaxis: yAnnotations,
    },
    legend: { show: true, position: 'top' },
  };
}

// ─── Component ────────────────────────────────────────────────

const WaterForecastChart: React.FC<Props> = ({ today, archive }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [viewMode,         setViewMode]         = useState<ViewMode>('all');
  const [selectedStation,  setSelectedStation]  = useState<string>('Y.15');

  const tofTs = useMemo(today9amTs, []);

  const stations = Object.keys(STATION_MAPPING);

  // ─── Series builder ──────────────────────────────────────────

  /**
   * สร้าง series สำหรับสถานีหนึ่ง:
   *   [0] ค่าตรวจวัดจริง (solid)    ← จาก today ช่วงก่อน TOF
   *   [1] ค่าพยากรณ์วันนี้ (dashed) ← จาก today ช่วงหลัง TOF
   *   [2..] ค่าพยากรณ์ archive แต่ละวัน (dashed อ่อนกว่า)
   */
  function buildSeries(station: string) {

    // today: แยก observed vs forecast
    const todayAll = (today?.points ?? [])
      .filter(p => p.station === station)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .map(p => ({ x: p.time, y: parseFloat(p.elevation.toFixed(2)) }));

    const observed = todayAll.filter(d => new Date(d.x).getTime() <  tofTs);
    const forecast = todayAll.filter(d => new Date(d.x).getTime() >= tofTs);

    // archive series
    const archiveSeries = archive.map((snap, i) => ({
      name:  `พยากรณ์ ${snap.date}`,
      data:  snapshotPoints(snap, station),
      color: ARCHIVE_COLORS[Math.min(i, ARCHIVE_COLORS.length - 1)],
    }));

    return [
      { name: 'ค่าตรวจวัดจริง',      data: observed, color: '#1E88E5' },
      { name: 'ค่าพยากรณ์ (วันนี้)', data: forecast,  color: '#66BB6A' },
      ...archiveSeries,
    ];
  }

  // stroke arrays ขึ้นอยู่กับจำนวน series
  function buildStrokeOptions(seriesCount: number): ApexOptions['stroke'] {
    return {
      width:     [5, 5, ...Array(seriesCount - 2).fill(2.5)],
      curve:     'smooth',
      dashArray: [0, 8, ...Array(seriesCount - 2).fill(5)],
    };
  }

  // ─── โหมดแสดงทั้งหมด ─────────────────────────────────────────

  const allSeriesMap = useMemo(() => {
    const m: Record<string, ReturnType<typeof buildSeries>> = {};
    stations.forEach(sta => { m[sta] = buildSeries(sta); });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, archive, tofTs]);

  // ─── Render ───────────────────────────────────────────────────
  if (!today && archive.length === 0) return <CenteredLoading />;

  return (
    <Box>
      
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: { xs: 'center', md: 'space-between' }, flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography sx={{ fontWeight: 'bold', ...titleStyle, color: '#28378B' }}>
          ผลการพยากรณ์ระดับน้ำ 7 วัน ล่วงหน้า
        </Typography>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => v && setViewMode(v)}
          size="small"
        >
          <ToggleButton value="all"    sx={{ fontFamily: 'Prompt', fontSize: '0.8rem' }}>แสดงทั้งหมด</ToggleButton>
          <ToggleButton value="single" sx={{ fontFamily: 'Prompt', fontSize: '0.8rem' }}>เลือกรายสถานี</ToggleButton>
        </ToggleButtonGroup>

        {/* Legend */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 36, height: 3, bgcolor: '#1E88E5', borderRadius: 99 }} />
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem' }}>ค่าตรวจวัดจริง</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 36, height: 0, borderTop: '3px dashed #66BB6A', borderRadius: 99 }} />
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem' }}>พยากรณ์ (วันนี้)</Typography>
          </Box>
          {archive.map((snap, i) => (
            <Box key={snap.date} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 36, height: 0, borderTop: `2px dashed ${ARCHIVE_COLORS[Math.min(i, ARCHIVE_COLORS.length-1)]}` }} />
              <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem' }}>
                พยากรณ์ {snap.date}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── โหมดแสดงทั้งหมด ── */}
      {viewMode === 'all' && (
        <Grid container spacing={2}>
          {stations.map(code => {
            const series      = allSeriesMap[code];
            const allData     = series.flatMap(s => s.data);
            const baseOptions = buildOptions(code, allData, isDark, tofTs);
            const options: ApexOptions = {
              ...baseOptions,
              stroke: buildStrokeOptions(series.length),
              colors: series.map(s => s.color),
            };

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={code}>
                <Card sx={{ borderRadius: 2, boxShadow: 2, p: 1 }}>
                  <ReactApexChart
                    options={options}
                    series={series.map(s => ({ name: s.name, data: s.data }))}
                    type="line"
                    height={380}
                  />
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── โหมดเลือกรายสถานี ── */}
      {viewMode === 'single' && (
        <>
          {/* Station selector cards */}
          <Grid container spacing={1.5} sx={{ mb: 3 }}>
            {stations.map(code => {
              const info       = THRESHOLD_MAP.get(code);
              const isSelected = selectedStation === code;
              return (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={code}>
                  <Card
                    onClick={() => setSelectedStation(code)}
                    sx={{
                      cursor:     'pointer',
                      transition: 'all 0.2s',
                      border:     isSelected ? '2px solid #1976d2' : '0.5px solid',
                      borderColor: isSelected ? '#1976d2' : 'divider',
                      bgcolor:    isSelected ? (isDark ? '#1e3a5f' : '#E6F1FB') : 'background.paper',
                      boxShadow:  isSelected ? 4 : 1,
                      '&:hover':  { transform: 'translateY(-2px)', boxShadow: 4 },
                      p: 2,
                      textAlign: 'center',
                    }}
                  >
                    <Typography fontFamily="Prompt" fontWeight={700} fontSize="1rem">{code}</Typography>
                    {info?.location && (
                      <Typography fontFamily="Prompt" variant="body2" color="text.secondary" fontSize="0.8rem">
                        {info.location}
                      </Typography>
                    )}
                    {info?.tambon && (
                      <Typography fontFamily="Prompt" variant="caption" color="text.disabled" fontSize="0.7rem">
                        {info.tambon}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Single chart */}
          {(() => {
            const series      = buildSeries(selectedStation);
            const allData     = series.flatMap(s => s.data);
            const baseOptions = buildOptions(selectedStation, allData, isDark, tofTs);
            const options: ApexOptions = {
              ...baseOptions,
              stroke: buildStrokeOptions(series.length),
              colors: series.map(s => s.color),
            };

            return (
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <ReactApexChart
                  options={options}
                  series={series.map(s => ({ name: s.name, data: s.data }))}
                  type="line"
                  height={440}
                />
              </Card>
            );
          })()}
        </>
      )}
    </Box>
  );
};

export default WaterForecastChart;