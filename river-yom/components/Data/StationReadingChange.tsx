'use client';

import { useState } from 'react';
import StationHistoryDialog, { stationTimestamp } from './StationHistoryDialog';
import type { StationHistoryContext } from './StationHistoryDialog';
import { Box, Link, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';

export function StationReadingChange({ value, previous, unit, history, compact = false }: {
  value?: number | string | null;
  previous?: number | null;
  unit: string;
  history?: StationHistoryContext & { metric: 'wl' | 'discharge' | 'wl_upper' | 'wl_lower' };
  compact?: boolean;
}) {
  const [open, setOpen] = useState<{ history: NonNullable<typeof history>; current: number; previous: number } | null>(null);
  if (value == null || value === '' || !Number.isFinite(Number(value)) || previous == null || !Number.isFinite(previous)) return null;
  const change = Number((Number(value) - previous).toFixed(2));
  const Icon = change > 0 ? ArrowUpwardIcon : change < 0 ? ArrowDownwardIcon : RemoveIcon;
  const color = change > 0 ? 'error.main' : change < 0 ? 'success.main' : 'text.secondary';
  const label = change > 0 ? 'เพิ่มขึ้น' : change < 0 ? 'ลดลง' : 'คงที่';

  const canOpen = history && stationTimestamp(history.previousTime) < stationTimestamp(history.currentTime);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'inherit', flexWrap: 'wrap', gap: compact ? 0.25 : 0.5, mt: compact ? 0 : 0.75 }}>
      <Icon sx={{ color, fontSize: 18 }} />
      <Typography variant="body2" sx={{ color, fontWeight: 700, lineHeight: compact ? 1.2 : undefined }}>
        {label} {Math.abs(change).toFixed(2)} {unit}
      </Typography>
      {canOpen ? (
        <Link component="button" type="button" variant="caption" underline="always" sx={compact ? { lineHeight: 1.2 } : undefined}
          onClick={() => setOpen({ history, current: Number(value), previous })}>
          เทียบเมื่อวาน
        </Link>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={compact ? { lineHeight: 1.2 } : undefined}>เทียบเมื่อวาน</Typography>
      )}
      {open && <StationHistoryDialog {...open} onClose={() => setOpen(null)} />}
    </Box>
  );
}

