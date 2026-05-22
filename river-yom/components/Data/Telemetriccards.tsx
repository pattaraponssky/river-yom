// components/Data/TeleMetricCards.tsx
'use client';

import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import WaterIcon   from '@mui/icons-material/Water';
import StreamIcon  from '@mui/icons-material/Stream';

// ─── Types ────────────────────────────────────────────────────

interface WarnLevels {
  normal: number;
  watch:  number;
  alert:  number;
  crisis: number;
}

interface TeleMetricCardsProps {
  wl?:         number | null;
  discharge?:  number | null;
  rain?:       number | null;
  warnLevels?: WarnLevels;
  loading?:    boolean;
}

type StatusKey = 'normal' | 'watch' | 'alert' | 'crisis' | 'no_data';

// ─── Config ───────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bgColor: string; textColor: string }> = {
  normal:  { label: 'ปกติ',        color: '#1D9E75', bgColor: '#E1F5EE', textColor: '#085041' },
  watch:   { label: 'เฝ้าระวัง',   color: '#EF9F27', bgColor: '#FAEEDA', textColor: '#633806' },
  alert:   { label: 'เตือนภัย',    color: '#D85A30', bgColor: '#FAECE7', textColor: '#4A1B0C' },
  crisis:  { label: 'วิกฤต',       color: '#E24B4A', bgColor: '#FCEBEB', textColor: '#501313' },
  no_data: { label: 'ไม่มีข้อมูล', color: '#B4B2A9', bgColor: '#F1EFE8', textColor: '#5F5E5A' },
};

// ─── Helpers ──────────────────────────────────────────────────

function getWlStatus(wl: number | null | undefined, levels?: WarnLevels): StatusKey {
  if (wl == null || !levels) return 'no_data';
  if (wl >= levels.crisis) return 'crisis';
  if (wl >= levels.alert)  return 'alert';
  if (wl >= levels.watch)  return 'watch';
  return 'normal';
}

// ─── Sub-components ───────────────────────────────────────────

function StatusBadge({ status }: { status: StatusKey }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.25, borderRadius: 99, bgcolor: cfg.bgColor }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
      <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.7rem', fontWeight: 600, color: cfg.textColor, lineHeight: 1 }}>
        {cfg.label}
      </Typography>
    </Box>
  );
}

interface MetricCardProps {
  icon:     React.ReactNode;
  label:    string;
  value:    number | null | undefined;
  unit:     string;
  loading?: boolean;
  status?:  StatusKey;
  accent?:  string;
}

function MetricCard({ icon, label, value, unit, loading, status, accent = '#E6F1FB' }: MetricCardProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        bgcolor: 'background.paper',
        border: '0.5px solid',
        borderColor: 'divider',
        borderRadius: 3,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* icon + badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </Box>
        {status && <StatusBadge status={status} />}
      </Box>

      {/* label + value */}
      <Box>
        <Typography sx={{ fontFamily: 'Prompt', fontSize: '1rem', color: 'text.secondary', mb: 0.25 }}>
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={80} height={36} sx={{ borderRadius: 1 }} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '1.75rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.15 }}>
              {value != null ? value.toFixed(2) : '—'}
            </Typography>
            <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.9rem', color: 'text.secondary' }}>
              {unit}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── Card definitions ─────────────────────────────────────────
// ใช้ type แยกสำหรับ type-safety ของ cards array

interface CardDef {
  key:     string;
  icon:    React.ReactNode;
  label:   string;
  value:   number | null | undefined;
  unit:    string;
  accent:  string;
  status?: StatusKey;
}

// ─── Main Component ───────────────────────────────────────────

const TeleMetricCards: React.FC<TeleMetricCardsProps> = ({
  wl,
  discharge,
  rain,
  warnLevels,
  loading = false,
}) => {
  const wlStatus = getWlStatus(wl, warnLevels);

  // กฎ: prop เป็น undefined = ไม่ได้ส่งมา → ซ่อน card
  //     prop เป็น null หรือตัวเลข = ส่งมาแล้ว → แสดง card (null แสดงเป็น "—")
  const cards: CardDef[] = [
    ...(wl !== undefined ? [{
      key:    'wl',
      icon:   <WaterIcon   sx={{ fontSize: 20, color: '#185FA5' }} />,
      label:  'ระดับน้ำ',
      value:  wl,
      unit:   'ม.รทก.',
      accent: '#E6F1FB',
      status: wlStatus,
    }] : []),
    ...(discharge !== undefined ? [{
      key:    'discharge',
      icon:   <StreamIcon  sx={{ fontSize: 20, color: '#0F6E56' }} />,
      label:  'อัตราการไหล',
      value:  discharge,
      unit:   'ลบ.ม./วินาที',
      accent: '#E1F5EE',
    }] : []),
    ...(rain !== undefined ? [{
      key:    'rain',
      icon:   <OpacityIcon sx={{ fontSize: 20, color: '#185FA5' }} />,
      label:  'ปริมาณฝนสะสม',
      value:  rain,
      unit:   'มม.',
      accent: '#E6F1FB',
    }] : []),
  ];

  if (cards.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: '100%' }}>
      {cards.map(c => (
        <MetricCard
          key={c.key}
          icon={c.icon}
          label={c.label}
          value={c.value}
          unit={c.unit}
          accent={c.accent}
          status={c.status}
          loading={loading}
        />
      ))}
    </Box>
  );
};

export default TeleMetricCards;