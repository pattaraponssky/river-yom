'use client';

import { Box, Typography } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { visuallyHidden } from '@mui/utils';

const HOUR_MS = 60 * 60 * 1000;
const stationTimeFormat = new Intl.DateTimeFormat('th-TH', {
  timeZone: 'Asia/Bangkok',
  calendar: 'gregory',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function parseStationTime(value?: string | null) {
  const timestamp = value?.trim().replace(' ', 'T');
  if (!timestamp) return null;

  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp);
  const time = new Date(hasOffset ? timestamp : `${timestamp}+07:00`);
  return Number.isNaN(time.getTime()) ? null : time;
}

export default function StationUpdateBadge({
  datetime,
  loading,
  staleAfterHours = 24,
}: {
  datetime?: string | null;
  loading: boolean;
  staleAfterHours?: number;
}) {
  const time = parseStationTime(datetime);
  const isStale = time !== null && Date.now() - time.getTime() > staleAfterHours * HOUR_MS;
  const color = time ? (isStale ? '#fdba74' : '#86efac') : '#e2e8f0';

  return (
    <Box
      role="status"
      sx={{
        position: 'absolute', top: 12, left: 12,
        maxWidth: 'calc(100% - 24px)', display: 'flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 1, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.94)',
        border: '1px solid', borderColor: color, color,
      }}
    >
      <ScheduleIcon fontSize="small" sx={{ flexShrink: 0 }} />
      <Box>
        <Typography variant="caption" component="div" sx={{ color: '#e2e8f0' }}>
          ข้อมูลอัปเดตล่าสุด
        </Typography>
        <Typography variant="body2" component="div" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {time ? (
            <time dateTime={time.toISOString()}>{stationTimeFormat.format(time)} น.</time>
          ) : loading ? 'กำลังโหลดข้อมูล' : 'ไม่มีข้อมูลล่าสุด'}
        </Typography>
        {isStale && <Box component="span" sx={visuallyHidden}>ข้อมูลเกิน {staleAfterHours} ชั่วโมง</Box>}
      </Box>
    </Box>
  );
}
