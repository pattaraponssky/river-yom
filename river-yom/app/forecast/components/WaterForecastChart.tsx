// components/WaterForecastChart.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card, Box, Typography, Grid,
  ToggleButton, ToggleButtonGroup, useTheme,
} from '@mui/material';
import { ApexOptions } from 'apexcharts';
import dynamic from 'next/dynamic';
import { ForecastPlotSkeleton, ForecastSkeleton } from './ForecastSkeleton';
import { titleStyle } from '@/theme/style';
import { ForecastSnapshot, WaterLevelPoint, toTs, forecastStartTs } from '@/components/hooks/useRasData';
import { TELE_WARN_LEVELS, getWarnLevel } from '@/lib/warnLevels';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false, loading: () => <ForecastPlotSkeleton /> });

// ─── Types ────────────────────────────────────────────────────

interface Props {
  today:   ForecastSnapshot | null;
  archive: ForecastSnapshot[];          // เรียง เก่า → ใหม่
}

type ViewMode = 'all' | 'single';
interface StationMetaData {
  staCode:  string;
  location: string;
  tambon:   string;
  maxY:     number;
}

const STATION_META: StationMetaData[] = [
  { staCode: 'YR.01', location: 'สะพานชุมแสงสงคราม',    tambon: 'ต.ชุมแสงสงคราม อ.บางระกำ จ.พิษณุโลก', maxY: 41 },
  { staCode: 'YR.02', location: 'สะพานบ้านห้วงกระได',    tambon: 'ต.บางระกำ อ.บางระกำ จ.พิษณุโลก',      maxY: 42 },
  { staCode: 'YR.03', location: 'สะพานวัดทุ่งอ้ายโห้',    tambon: 'ต.ชุมแสงสงคราม อ.บางระกำ จ.พิษณุโลก', maxY: 45 },
  { staCode: 'YR.04', location: 'สะพานข้ามคลองกรุงกรัก', tambon: 'ต.บางระกำ อ.บางระกำ จ.พิษณุโลก',      maxY: 43 },
  { staCode: 'YR.05', location: 'สะพานท่านางงาม',        tambon: 'ต.ท่านางงาม อ.บางระกำ จ.พิษณุโลก',    maxY: 41 },
  { staCode: 'YR.06', location: 'สะพานข้ามคลองคด',       tambon: 'ต.บ่อทอง อ.บางระกำ จ.พิษณุโลก',       maxY: 40 },
];
interface ThresholdData {
  staCode:  string;
  location: string;
  tambon:   string;
  watch:    number;
  alert:    number;
  crisis:   number;
  maxY:     number;
}

function buildThresholdMap(): Map<string, ThresholdData> {
  const map = new Map<string, ThresholdData>();

  STATION_META.forEach(meta => {
    const level = getWarnLevel(TELE_WARN_LEVELS, meta.staCode);

    if (!level) {
      console.warn(
        `[WaterForecastChart] ไม่พบเกณฑ์เตือนภัยของสถานี "${meta.staCode}" ใน warnLevels.ts (TELE_WARN_LEVELS) — จะไม่แสดงเส้น threshold ของสถานีนี้`
      );
      return;
    }

    map.set(meta.staCode, {
      staCode: meta.staCode,
      location: meta.location,
      tambon: meta.tambon,
      watch: level.watch,
      alert: level.alert,
      crisis: level.crisis,
      maxY: meta.maxY,
    });
  });

  return map;
}

const THRESHOLD_MAP = buildThresholdMap();

const DAY_MS = 24 * 60 * 60 * 1000;
const YESTERDAY_COLOR = '#90A4AE';
const stations = STATION_META.map(meta => meta.staCode);

function stationPoints(points: WaterLevelPoint[], station: string, start: number, end: number) {
  return points
    .filter(point => point.station === station)
    .map(point => ({ x: toTs(point.time), y: Number(point.elevation.toFixed(2)) }))
    .filter(point => point.x >= start && point.x < end)
    .sort((a, b) => a.x - b.x);
}

// ─── Chart options builder ────────────────────────────────────

function buildOptions(
  stationCode: string,
  allSeriesData: { x: number; y: number }[],
  isDark: boolean,
  tofTs: number,
  historyStart: number,
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
    xaxis: {
      type: 'datetime',
      min: historyStart,
      labels: { format: 'dd MMM HH:mm', datetimeUTC: true },
    },
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
        label: { position: 'top', offsetY: -10, borderColor: '#000', style: { color: '#fff', background: '#FF0000', fontSize: '14px' }, text: 'TOF 08:00' },
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
  const [selectedStation,  setSelectedStation]  = useState<string>('YR.05');

  const tofTs = forecastStartTs();

  const historyStart = tofTs - 7 * DAY_MS;
  const yesterdayTofTs = tofTs - DAY_MS;
  const yesterdayDate = new Date(yesterdayTofTs).toISOString().slice(0, 10);
  const yesterday = archive.find(snapshot => snapshot.date === yesterdayDate);

  const allSeriesMap = useMemo(() => {
    return Object.fromEntries(stations.map(station => {
      const todayPoints = today?.points ?? [];
      const observed = stationPoints(todayPoints, station, historyStart, tofTs);
      const forecast = stationPoints(todayPoints, station, tofTs, Infinity);
      const previousForecast = stationPoints(
        yesterday?.points ?? [], station, yesterdayTofTs, Infinity,
      );

      const series = [
        { name: 'ค่าตรวจวัดจริง', data: observed, color: '#1E88E5' },
        { name: 'ค่าพยากรณ์ (วันนี้)', data: forecast, color: '#66BB6A' },
      ];
      if (previousForecast.length) {
        series.push({ name: 'ค่าพยากรณ์ (เมื่อวาน)', data: previousForecast, color: YESTERDAY_COLOR });
      }

      return [station, series];
    }));
  }, [today, yesterday, historyStart, yesterdayTofTs, tofTs]);

  const hasYesterdayForecast = Object.values(allSeriesMap).some(series => series.length === 3);

  function buildStrokeOptions(seriesCount: number): ApexOptions['stroke'] {
    return {
      width: [5, 5, ...Array(seriesCount - 2).fill(2.5)],
      curve: 'smooth',
      dashArray: [0, 8, ...Array(seriesCount - 2).fill(5)],
    };
  }

  // ─── Render ───────────────────────────────────────────────────
  if (!today && archive.length === 0) return <ForecastSkeleton section="forecast" />;

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
          {hasYesterdayForecast && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 36, height: 0, borderTop: `2px dashed ${YESTERDAY_COLOR}` }} />
              <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem' }}>
                พยากรณ์ {yesterdayDate}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── โหมดแสดงทั้งหมด ── */}
      {viewMode === 'all' && (
        <Grid container spacing={2}>
          {stations.map(code => {
            const series      = allSeriesMap[code];
            const allData     = series.flatMap(s => s.data);
            const baseOptions = buildOptions(code, allData, isDark, tofTs, historyStart);
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
                <Grid size={{ xs: 6, sm: 4, md: 4 }} key={code}>
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
            const series      = allSeriesMap[selectedStation];
            const allData     = series.flatMap(s => s.data);
            const baseOptions = buildOptions(selectedStation, allData, isDark, tofTs, historyStart);
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