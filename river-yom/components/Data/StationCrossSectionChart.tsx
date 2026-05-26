// components/Data/StationCrossSectionChart.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Box, Typography, Chip, Skeleton } from '@mui/material';
import { Path_URL } from '@/lib/utility';
import dynamic from 'next/dynamic';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────
interface WarnLevel {
  watch:  number;
  alert:  number;
  crisis: number;
  normal: number;
}

interface Props {
  staCode:     string;          // ชื่อคอลัมน์ใน ground_station.csv เช่น "C.13"
  waterLevel:  number | null;   // ระดับน้ำ ม.รทก. ค่าเดียว
  warnLevels?: WarnLevel;       // เกณฑ์ (optional)
  chartHeight?: number;
  title?:      string;
}

// ─── สถานะระดับน้ำ ────────────────────────────────────────────
const getWaterStatus = (wl: number, warn?: WarnLevel) => {
  if (!warn) return { label: 'ปกติ', color: '#69fc00', textColor: '#000' };
  if (wl >= warn.crisis) return { label: 'วิกฤต',      color: '#D32F2F', textColor: '#fff' };
  if (wl >= warn.alert)  return { label: 'เตือนภัย',   color: '#F57C00', textColor: '#fff' };
  if (wl >= warn.watch)  return { label: 'เฝ้าระวัง',  color: '#FFD700', textColor: '#000' };
  return                        { label: 'ปกติ',        color: '#388E3C', textColor: '#fff' };
};

// ─── Component ────────────────────────────────────────────────
const StationCrossSectionChart: React.FC<Props> = ({
  staCode,
  waterLevel,
  warnLevels,
  chartHeight = 300,
  title,
}) => {
  const [groundData,    setGroundData]    = useState<number[]>([]);
  const [shiftValue,    setShiftValue]    = useState(0);
  const [groundLoading, setGroundLoading] = useState(true);

  // ─── โหลด ground profile ────────────────────────────────────
  useEffect(() => {
    fetch(`${Path_URL}data/ground_station.csv`)
      .then(r => r.text())
      .then(csv => {
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }: any) => {
            const raw: any[] = data;
            if (!raw.length) { setGroundLoading(false); return; }

            const elevations = raw
              .map(row => parseFloat((row[staCode] ?? '').replace(/[^\d.-]/g, '')))
              .filter(v => !isNaN(v));

            if (!elevations.length) { setGroundLoading(false); return; }

            const minEl = Math.min(...elevations);
            const shift = minEl < 0 ? Math.abs(minEl) + 1 : 0;
            setShiftValue(shift);
            setGroundData(elevations.map(v => v + shift));
            setGroundLoading(false);
          },
        });
      })
      .catch(() => setGroundLoading(false));
  }, [staCode]);

  // ─── ระดับน้ำ + shift ────────────────────────────────────────
  const shiftedWL = waterLevel != null ? waterLevel + shiftValue : null;

  // ─── สถานะ ─────────────────────────────────────────────────
  const status = waterLevel != null ? getWaterStatus(waterLevel, warnLevels) : null;

  // ─── Annotations ────────────────────────────────────────────
  const yAnnotations = useMemo(() => {
    const result: any[] = [];

    // เกณฑ์เตือนภัย
    if (warnLevels) {
      [
        { val: warnLevels.normal, color: '#388E3C', label: `ปกติ ${warnLevels.normal.toFixed(2)} ม.รทก.`,       tc: '#fff' ,offsetX: -10 },
        { val: warnLevels.watch,  color: '#FFD700', label: `เฝ้าระวัง ${warnLevels.watch.toFixed(2)} ม.รทก.`,   tc: '#333' ,offsetX: -60 },
        { val: warnLevels.alert,  color: '#F57C00', label: `เตือนภัย ${warnLevels.alert.toFixed(2)} ม.รทก.`,    tc: '#fff' ,offsetX: -110 },
        { val: warnLevels.crisis, color: '#D32F2F', label: `วิกฤต ${warnLevels.crisis.toFixed(2)} ม.รทก.`,      tc: '#fff' ,offsetX: -160 },
      ].forEach(l => result.push({
        y: l.val + shiftValue,
        borderColor: l.color, borderWidth: 1.5, strokeDashArray: 4,
        label: {
          position: 'center', offsetY: 14, offsetX: l.offsetX,
          text: l.label,
          style: { color: l.tc, background: l.color, fontWeight: 'bold', fontSize: '0.72rem', padding: { top: 2, bottom: 2, left: 5, right: 5 } },
        },
      }));
    }

    // เส้นระดับน้ำจริง
    if (shiftedWL != null) {
      result.push(
      {
          y: shiftedWL,
          borderColor: "#007bff",
          borderWidth: 0,
          label: {
            position: "center",
            offsetY: 0,
            offsetX: 0,
            text: `ระดับน้ำ: ${waterLevel!} (ม.รทก.)`,
             style: {
            color: '#fff', background: '#1565C0',
            fontWeight: 'bold', fontSize: '0.82rem',
            padding: { top: 3, bottom: 3, left: 6, right: 6 },
          },
          },
        },
        {
        y: shiftedWL,
        borderWidth: 0,
        label: {
          position: "right",
          offsetX: -10,
          offsetY: -10,
          text: `ตลิ่งขวา`,
           style: {
            color: '#fff', background: '#8D6E63',
            fontWeight: 'bold', fontSize: '0.82rem',
            padding: { top: 3, bottom: 3, left: 6, right: 6 },
          },
        },
      },
      {
        y: shiftedWL,
        borderWidth: 0,
        label: {
          position: "left",
          offsetX: 55,
          offsetY: -10,
          text: `ตลิ่งซ้าย`,
           style: {
            color: '#fff', background: '#8D6E63',
            fontWeight: 'bold', fontSize: '0.82rem',
            padding: { top: 3, bottom: 3, left: 6, right: 6 },
          },
        },
      },
    );
    }

    return result;
  }, [warnLevels, shiftValue, shiftedWL, waterLevel]);

  // ─── Chart ──────────────────────────────────────────────────
  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: 'area',
      fontFamily: 'Prompt',
      zoom:    { enabled: false },
      toolbar: { show: true },
      animations: { enabled: false },
      background: 'transparent',
    },
    dataLabels: {
      enabled: false,
    },
    annotations: { yaxis: yAnnotations ,},
    xaxis: {
      categories: groundData.map((_, i) => i + 1),
      labels:     { show: false },
      axisBorder: { show: false },
      axisTicks:  { show: false },
    },
    yaxis: {
      labels: {
        formatter: (v: any) => (Number(v) - shiftValue).toFixed(1),
        style: { fontSize: '0.78rem' },
      },
      title: {
        text: 'ระดับ (ม.รทก.)',
        style: { fontSize: '0.82rem' },
      },
    },
    tooltip: {
      x: { formatter: (v: number) => `เมตรที่ ${v*5}` },
      y: { formatter: (v: any) => `${(Number(v) - shiftValue).toFixed(2)} ม.รทก.` },
    },
    stroke:  { width: [2, 2], curve: 'straight' },
    colors:  ['#1565C0', '#744111'],
    fill: {
      type: ['gradient', 'solid'],
      gradient: {
        shade: 'light', type: 'vertical',
        stops: [0, 90],
        colorStops: [
          [
            { offset: 0,   color: '#1565C0', opacity: 0.5 },
            { offset: 100, color: '#1565C0', opacity: 0.05 },
          ],
          [
            { offset: 0,   color: '#6D4C41', opacity: 1 },
            { offset: 100, color: '#6D4C41', opacity: 1 },
          ],
        ],
      },
    },
    legend: { show: true, position: 'top', fontFamily: 'Prompt', fontSize: '12px' },
    grid: {
      borderColor: '#e0e0e0',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
  }), [yAnnotations, groundData, shiftValue]);

  const chartSeries = useMemo(() => [
    {
      name: 'ระดับน้ำ',
      // เส้นระนาบ = ค่าเดียวกันตลอด
      data: shiftedWL != null
        ? Array(groundData.length).fill(shiftedWL)
        : Array(groundData.length).fill(null),
    },
    {
      name: 'Ground (พื้นดิน)',
      data: groundData,
    },
  ], [groundData, shiftedWL]);

  // ─── Loading ─────────────────────────────────────────────────
  if (groundLoading) {
    return <Skeleton variant="rounded" height={chartHeight} sx={{ borderRadius: 2 }} />;
  }

  if (groundData.length === 0) return null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontFamily: 'Prompt', fontWeight: 700, fontSize: '0.92rem' }}>
          {title ?? 'ภาพตัดขวางระดับน้ำ'}
          {' — '}
          <Box component="span" sx={{ color: 'primary.main' }}>{staCode}</Box>
        </Typography>

        {waterLevel != null && status && (
          <>
            <Chip
              label={`${waterLevel} ม.รทก.`}
              size="small"
              sx={{
                fontFamily: 'Prompt', fontWeight: 700, fontSize: '0.78rem',
                bgcolor: `${status.color}22`,
                color: status.color,
                border: `1px solid ${status.color}88`,
              }}
            />
            <Chip
              label={status.label}
              size="small"
              sx={{
                fontFamily: 'Prompt', fontWeight: 700, fontSize: '0.72rem',
                bgcolor: status.color,
                color: status.textColor,
              }}
            />
          </>
        )}

        {waterLevel == null && (
          <Chip
            label="ไม่มีข้อมูล"
            size="small"
            sx={{ fontFamily: 'Prompt', fontSize: '0.72rem', bgcolor: 'grey.200', color: 'text.disabled' }}
          />
        )}
      </Box>

      {/* Chart */}
      <ApexChart
        options={chartOptions}
        series={chartSeries}
        type="area"
        height={chartHeight}
      />
    </Box>
  );
};

export default StationCrossSectionChart;