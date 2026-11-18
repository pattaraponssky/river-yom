'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useTheme } from '@mui/material';
import { API_URL } from '@/lib/utility';

const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={24} /></Box>,
});
const WINDOW_MS = 48 * 60 * 60 * 1000;
const timeZone = 'Asia/Bangkok';
const dateTime = new Intl.DateTimeFormat('th-TH', {
  timeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

type Metric = 'wl' | 'wl_upper' | 'wl_lower' | 'discharge';
const metrics: Record<Metric, { label: string; unit: string }> = {
  wl: { label: 'ระดับน้ำ', unit: 'ม.รทก.' },
  wl_upper: { label: 'ระดับน้ำเหนือประตู', unit: 'ม.รทก.' },
  wl_lower: { label: 'ระดับน้ำท้ายประตู', unit: 'ม.รทก.' },
  discharge: { label: 'อัตราการไหล', unit: 'ลบ.ม./วินาที' },
};

export interface StationHistoryContext {
  type: 'tele' | 'flow' | 'gate';
  stationCode: string;
  currentTime?: string | null;
  previousTime?: string | null;
}

export function stationTimestamp(value?: string | null) {
  const text = value?.trim().replace(' ', 'T');
  if (!text) return NaN;
  return Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(text) ? text : `${text}+07:00`);
}

interface Props {
  history: StationHistoryContext & { metric: Metric };
  current: number;
  previous: number;
  onClose: () => void;
}

export default function StationHistoryDialog({ history, current, previous, onClose }: Props) {
  const theme = useTheme();
  const { type, stationCode, metric } = history;
  const { label, unit } = metrics[metric];
  const end = stationTimestamp(history.currentTime);
  const start = end - WINDOW_MS;
  const earlier = stationTimestamp(history.previousTime);
  const [rows, setRows] = useState<Array<{ x: number; y: number }> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const url = `${API_URL}/api/station-history/${type}/${encodeURIComponent(stationCode)}?end=${Math.floor(end / 1000)}`;
    fetch(url, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('history');
        const { data } = await response.json();
        if (!Array.isArray(data)) throw new Error('history');
        return data.flatMap(row => {
          const x = stationTimestamp(row.datetime);
          const value = row[metric];
          const y = Number(value);
          return x >= start && x <= end && value != null && value !== '' && Number.isFinite(y) ? [{ x, y }] : [];
        });
      })
      .then(points => { if (!controller.signal.aborted) setRows(points); })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setRows([]); } });
    return () => controller.abort();
  }, [type, stationCode, metric, start, end]);

  const references = [
    { x: earlier, y: previous, label: 'ค่าเมื่อวาน', color: '#c2410c' },
    { x: end, y: current, label: 'ค่าล่าสุด', color: '#1d4ed8' },
  ];
  const points = new Map(rows?.map(point => [point.x, point.y]));
  references.forEach(point => points.set(point.x, point.y));
  const series = [{ name: label, data: Array.from(points, ([x, y]) => ({ x, y })).sort((a, b) => a.x - b.x) }];
  const options: ApexOptions = {
    chart: { type: 'line', toolbar: { show: false }, animations: { enabled: false }, foreColor: theme.palette.text.secondary },
    colors: [theme.palette.primary.main],
    stroke: { curve: 'straight', width: rows?.length ? 2 : 0 },
    markers: { size: 2 },
    xaxis: { type: 'datetime', min: start, max: end, labels: { formatter: (_, timestamp) => timestamp == null ? '' : dateTime.format(timestamp) } },
    yaxis: { labels: { formatter: value => value.toFixed(2) }, title: { text: unit } },
    tooltip: { theme: theme.palette.mode, x: { formatter: value => Number.isFinite(Number(value)) ? dateTime.format(Number(value)) : String(value) }, y: { formatter: value => `${value.toFixed(2)} ${unit}` } },
    annotations: { points: references.map(point => ({
      x: point.x, y: point.y, marker: { size: 6, fillColor: point.color, strokeColor: '#fff' },
    })) },
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="station-history-title">
      <DialogTitle id="station-history-title">{label}ย้อนหลัง 48 ชั่วโมง · {stationCode}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {dateTime.format(start)} – {dateTime.format(end)} น. ตามเวลาไทย
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {references.map(point => (
            <Box key={point.label} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.25, flex: '1 1 180px' }}>
              <Typography variant="body2" sx={{ display: 'flex', gap: 1, alignItems: 'center', fontWeight: 700 }}>
                <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: point.color }} />
                {point.label} {point.y.toFixed(2)} {unit}
              </Typography>
              <Typography variant="caption" color="text.secondary">{dateTime.format(point.x)} น.</Typography>
            </Box>
          ))}
        </Box>
        {rows === null ? (
          <Box role="status" sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={28} aria-label="กำลังโหลดข้อมูลย้อนหลัง" /></Box>
        ) : (
          <>
            {!rows.length && <Alert severity={error ? 'warning' : 'info'}>{error ? 'โหลดข้อมูลย้อนหลังไม่สำเร็จ' : 'ไม่มีข้อมูลย้อนหลังเพิ่มเติม'} แสดงเฉพาะจุดอ้างอิงสองจุด</Alert>}
            <Chart options={options} series={series} type="line" height={300} />
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>ปิด</Button></DialogActions>
    </Dialog>
  );
}
