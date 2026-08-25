// components/Data/StationCrossSectionChart.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Box, Typography, Chip, Skeleton } from '@mui/material';
import { Path_URL } from '@/lib/utility';
import dynamic from 'next/dynamic';
import { fontWeight } from 'html2canvas/dist/types/css/property-descriptors/font-weight';

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

interface WarnLabelOffset {
  offsetX: number;
  offsetY: number;
}

interface WarnLabelOffsetSet {
  normal: WarnLabelOffset;
  watch:  WarnLabelOffset;
  alert:  WarnLabelOffset;
  crisis: WarnLabelOffset;
}

interface StaffGaugeXPos {
  x: number;
  label?: string;
  label2?: string;
  color?: string;
  offsetY?: number;
  offsetYtext?:number;
  offsetX?: number;
}

const DEFAULT_GAUGE_COLOR = '#66B2FF';

const STAFF_GAUGE_POSITIONS: Record<string, StaffGaugeXPos[]> = {
  'YR.01': [
    { x: 7, label:'----------------------' ,label2: '41 ม.รทก', offsetY:-135 ,offsetX: 0 ,offsetYtext: -40  },
    { x: 7.5, label:'---------' ,label2: '40 ม.รทก', offsetY:-100 ,offsetX: 0 ,offsetYtext: -10 },
  ],
  'YR.02': [
    { x: 9, label:'------------------' ,label2: '41 ม.รทก', offsetY: -30, offsetX: -50 ,offsetYtext: 80 },
    { x: 9.5, label:'------------------' ,label2: '42 ม.รทก', offsetY: -80, offsetX: 0 ,offsetYtext: 60 },
  ],
  'YR.03': [
    { x: 12, label:'------------------' ,label2: '43 ม.รทก', offsetY: -10, offsetX: -50 ,offsetYtext: 90 },
    { x: 12.5, label:'------------------' ,label2: '44 ม.รทก', offsetY: -60, offsetX: 0 ,offsetYtext: 70 },
    { x: 11, label:'------------------' ,label2: '42 ม.รทก', offsetY: 35, offsetX: 0 ,offsetYtext: 110 },
  ],
  'YR.04': [
    { x: 12, label:'------------------' ,label2: '40 ม.รทก', offsetY: -5, offsetX: 55 ,offsetYtext: 90 },
    { x: 12.65, label:'------------------' ,label2: '42 ม.รทก', offsetY: -90, offsetX: 0 ,offsetYtext: 60 },
  ],
  'YR.05': [
    { x: 8.2, label:'----------------------' ,label2: '41 ม.รทก', offsetY: -140, offsetX: 45 ,offsetYtext: 70 },
  ],
  'YR.06': [
    { x: 3.8, label:'------------------' ,label2: '38 ม.รทก', offsetY: -55, offsetX: -50 ,offsetYtext: 50 },
    { x: 5, label:'------------------' ,label2: '39 ม.รทก', offsetY: -23, offsetX: 0 ,offsetYtext: 70 },
  ],
};

const DEFAULT_WARN_LABEL_OFFSETS: WarnLabelOffsetSet = {
  normal: { offsetX: -170, offsetY: 30 },
  watch:  { offsetX: -170, offsetY: 14 },
  alert:  { offsetX: -220, offsetY: 14 },
  crisis: { offsetX: -270, offsetY: 14 },
};

const WARN_LABEL_OFFSETS_OVERRIDE: Record<string, Partial<WarnLabelOffsetSet>> = {
  'YR.05': {
      normal: { offsetX: 330, offsetY: 20 },
      watch:  { offsetX: 170, offsetY: 14 },
      alert:  { offsetX: 220, offsetY: 5 },
      crisis: { offsetX: 270, offsetY: 0 },
  },
  'YR.06': {
      normal: { offsetX: 330, offsetY: 20 },
      watch:  { offsetX: 170, offsetY: 14 },
      alert:  { offsetX: 220, offsetY: 5 },
      crisis: { offsetX: 270, offsetY: 0 },
  },
};

// ─── สถานะระดับน้ำ ────────────────────────────────────────────
const getWaterStatus = (wl: number, warn?: WarnLevel) => {
  if (!warn) return { label: 'ปกติ', color: '#69fc00', textColor: '#000' };
  if (wl >= warn.crisis) return { label: 'วิกฤต',      color: '#D32F2F', textColor: '#fff' };
  if (wl >= warn.alert)  return { label: 'เตือนภัย',   color: '#F57C00', textColor: '#fff' };
  if (wl >= warn.watch)  return { label: 'เฝ้าระวัง',  color: '#FFD700', textColor: '#000' };
  return                        { label: 'ปกติ',        color: '#388E3C', textColor: '#fff' };
};

function getWarnLabelOffsets(staCode: string): WarnLabelOffsetSet {
  const override = WARN_LABEL_OFFSETS_OVERRIDE[staCode];
  if (!override) return DEFAULT_WARN_LABEL_OFFSETS;

  return {
    normal: override.normal ?? DEFAULT_WARN_LABEL_OFFSETS.normal,
    watch:  override.watch  ?? DEFAULT_WARN_LABEL_OFFSETS.watch,
    alert:  override.alert  ?? DEFAULT_WARN_LABEL_OFFSETS.alert,
    crisis: override.crisis ?? DEFAULT_WARN_LABEL_OFFSETS.crisis,
  };
}

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

  // ตำแหน่ง staff gauge ของสถานีนี้ — ไม่มีในนี้ = array ว่าง = ไม่แสดง annotation
  const gaugePositions = useMemo<StaffGaugeXPos[]>(
    () => STAFF_GAUGE_POSITIONS[staCode] ?? [],
    [staCode]
  );

  const warnLabelOffsets = useMemo(
    () => getWarnLabelOffsets(staCode),
    [staCode]
  );

  // ─── โหลด ground profile ────────────────────────────────────
  useEffect(() => {
    fetch(`${Path_URL}/data/ground_station.csv`)
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

  // ─── Annotations (yaxis) ────────────────────────────────────
  const yAnnotations = useMemo(() => {
    const result: any[] = [];

     if (warnLevels) {
      [
        { key: 'normal' as const, val: warnLevels.normal, color: '#388E3C', label: `ปกติ ต่ำกว่า ${warnLevels.normal.toFixed(2)} ม.รทก.`,       tc: '#fff' },
        { key: 'watch'  as const, val: warnLevels.watch,  color: '#FFD700', label: `เฝ้าระวัง ${warnLevels.watch.toFixed(2)} ม.รทก.`,   tc: '#333' },
        { key: 'alert'  as const, val: warnLevels.alert,  color: '#F57C00', label: `เตือนภัย ${warnLevels.alert.toFixed(2)} ม.รทก.`,    tc: '#fff' },
        { key: 'crisis' as const, val: warnLevels.crisis, color: '#D32F2F', label: `วิกฤต ${warnLevels.crisis.toFixed(2)} ม.รทก.`,      tc: '#fff' },
      ].forEach(l => {
        const offset = warnLabelOffsets[l.key];
        result.push({
          y: l.val + shiftValue,
          borderColor: l.color, borderWidth: 1.5, strokeDashArray: 4,
          label: {
            position: 'center', offsetY: offset.offsetY, offsetX: offset.offsetX,
            text: l.label,
            style: { color: l.tc, background: l.color, fontWeight: 'bold', fontSize: '0.72rem', padding: { top: 2, bottom: 2, left: 5, right: 5 } },
          },
        });
      });
    }

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
    }, [warnLevels, shiftValue, shiftedWL, waterLevel, warnLabelOffsets]);

  // ─── Annotations (xaxis) — Staff Gauge ตำแหน่งตามสถานี ────────
  const xAnnotations = useMemo(() => {
  return gaugePositions
    .map((g) => {
      const color = g.color ?? DEFAULT_GAUGE_COLOR;

      const mainLine = {
        x: g.x,
        borderColor: "#FE0000",
        borderWidth: 1,
        strokeDashArray: 4,
        label: {
          offsetY: g.offsetY,
          borderColor: color,
          position: "center",
          style: {
            fontSize: "4px",
            color: "#66B2FF",
            background: color,
          },
          text: g.label,
        },
      };

      const secondaryLine = {
        x: g.x,
        borderWidth: 0,
        label: {
          offsetY: g.offsetYtext, // เลื่อนข้อความไม่ให้ทับเส้นแรก
          position: 'center' as const,
          borderWidth: 0,
          style: {
              fontSize: "11px",
              color: "#333",
              fontWeight: 'bold',
            },
          text: g.label2,
        },
      };

      return [mainLine, secondaryLine];
    })
    .flat();
}, [gaugePositions]);

const pointAnnotations = useMemo(() => {
  return gaugePositions
    .slice(0, 1) // เหลือแค่ตัวแรก
    .filter((g) => g.x >= 1 && g.x <= groundData.length)
    .map((g) => {
      const idx = Math.round(g.x) - 1;
      const y = groundData[idx] ?? groundData[0];

      return {
        x: g.x,
        y,
        marker: { size: 0 },
        label: {
          text: 'Staff Gauge',
          offsetY: -14,
          offsetX: g.offsetX,
          borderColor: 'transparent',
          style: {
            fontSize: '11px',
            fontWeight: 700,
            color: '#0D47A1',
            background: 'rgba(227, 242, 253, 0.95)',
            padding: { left: 6, right: 6, top: 2, bottom: 2 },
          },
        },
      };
    });
}, [gaugePositions, groundData]);

  // ─── Chart ──────────────────────────────────────────────────
  const chartOptions: ApexCharts.ApexOptions = useMemo(() => ({
    chart: {
      type: "line" as "line",
      fontFamily: 'Prompt',
      zoom:    { enabled: false },
      toolbar: { show: true },
      animations: { enabled: false },
      background: 'transparent',
    },
    dataLabels: {
      enabled: false,
    },
    annotations: {
      yaxis: yAnnotations, 
      xaxis: xAnnotations,
      points: pointAnnotations,
    },
    xaxis: {
      type: "numeric",
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
  }), [yAnnotations, xAnnotations, pointAnnotations, groundData, shiftValue]);

  const chartSeries = useMemo(() => [
    {
      name: 'ระดับน้ำ',
      data: shiftedWL != null
        ? Array(groundData.length).fill(shiftedWL)
        : Array(groundData.length).fill(null),
      type: "area"
    },
    {
      name: 'Ground (พื้นดิน)',
      data: groundData,
      type: "area"
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
        type="line"
        height={chartHeight}
      />
    </Box>
  );
};

export default StationCrossSectionChart;