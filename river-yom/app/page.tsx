// src/app/page.tsx
'use client';
import Link from 'next/link';
import {
  Box, Container, Typography, Chip, IconButton,
  Tooltip, Paper,
} from '@mui/material';
import DarkModeIcon          from '@mui/icons-material/DarkMode';
import LightModeIcon         from '@mui/icons-material/LightMode';
import DashboardIcon         from '@mui/icons-material/Dashboard';
import RadioIcon             from '@mui/icons-material/Radio';
import WavesIcon             from '@mui/icons-material/Waves';
import CloudIcon             from '@mui/icons-material/Cloud';
import LockOpenIcon          from '@mui/icons-material/LockOpen';
import InfoOutlinedIcon      from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';
import { useColorScheme }    from '@mui/material/styles';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

// ─── Menu definitions ──────────────────────────────────────────
const BIG_CARDS = [
  {
    href:        '/dashboard',
    icon:        <DashboardIcon sx={{ fontSize: 26 }} />,
    iconBg:      '#E6F1FB',
    iconColor:   '#185FA5',
    badgeBg:     '#E6F1FB',
    badgeColor:  '#0C447C',
    badge:       'สรูปสถานการณ์น้ำปัจจุบัน',
    title:       'Dashboard',
    description: 'ภาพรวมสถานการณ์น้ำทั้งหมด แผนที่ และสรุปค่าสำคัญแบบเรียลไทม์',
  },
  {
    href:        '/forecast',
    icon:        <ModelTrainingIcon sx={{ fontSize: 26 }} />,
   iconBg:       '#E1F5EE',
    iconColor:   '#0F6E56',
    badgeBg:     '#E1F5EE',
    badgeColor:  '#085041',
    badge:       'พยากรณ์น้ำ',
    title:       'Forecast',
    description: 'ผลการพยากรณ์สถานการณ์น้ำล่วงหน้า 7 วันข้างหน้า พร้อมรูปตัดตามยาวแม่น้ำยมฝั่งขวาและกราฟแสดงแนวโน้ม',
  },
  {
    href:        '/report',
    icon:        <AssessmentIcon sx={{ fontSize: 26 }} />,
    iconBg:      '#FAEEDA',
    iconColor:   '#854F0B',
    badgeBg:     '#FAEEDA',
    badgeColor:  '#633806',
    badge:       'รายงานสถานการณ์น้ำจาก สำนักงานชลประทานที่ 3',
    title:       'Report',
    description: 'รายงานสถานการณ์น้ำประจำวัน สรุปเหตุการณ์สำคัญ และการแจ้งเตือนต่างๆจากสำนักงานชลประทานที่ 3 ',
  },
   {
    href:        '/schematic',
    icon:        <AccountTreeIcon sx={{ fontSize: 22 }} />,
    iconBg:      '#E6F1FB',
    iconColor:   '#185FA5',
    badgeBg:     '#E6F1FB',
    badgeColor:  '#0C447C',
    badge:       'แผนผังลุ่มน้ำ',
    title:       'Schematic',
    description: 'แผนผังลุ่มน้ำแสดงสถานีวัดน้ำท่า สถานีติดตั้งโครงการ และประตูระบายน้ำ พร้อมข้อมูลสรุปสถานการณ์น้ำแต่ละจุด',
  },
    {
    href:        '/aboutus',
    icon:        <InfoOutlinedIcon sx={{ fontSize: 20 }} />,
    iconBg:      '#F1EFE8',
    iconColor:   '#5F5E5A',
    badgeBg:     '#F1EFE8',
    badgeColor:  '#444441',
    badge:       'เกี่ยวกับ',
    title:       'About Us',
    description: 'ข้อมูลเกี่ยวกับโครงการ และช่องทางติดต่อ',
  },

];

const SMALL_CARDS = [
  {
    href:        '/rain',
    icon:        <CloudIcon sx={{ fontSize: 20 }} />,
    iconBg:      '#FAEEDA',
    iconColor:   '#854F0B',
    badgeBg:     '#FAEEDA',
    badgeColor:  '#633806',
    badge:       'ฝน',
    title:       'Rain',
    description: 'ปริมาณน้ำฝนสะสมและรายวัน ของสถานีวัดน้ำฝนของกรมชลประทาน',
  },
  {
    href:        '/gate',
    icon:        <LockOpenIcon sx={{ fontSize: 20 }} />,
    iconBg:      '#FAECE7',
    iconColor:   '#993C1D',
    badgeBg:     '#FAECE7',
    badgeColor:  '#4A1B0C',
    badge:       'ประตูน้ำ',
    title:       'Gate',
    description: 'สถานะประตูระบายน้ำ ข้อมูลการเปิด-ปิด ระดับน้ำเหนือ-ท้าย และอัตราการไหลผ่านประตูระบายน้ำ',
  },
    {
    href:        '/tele',
    icon:        <RadioIcon sx={{ fontSize: 22 }} />,
    iconBg:      '#E1F5EE',
    iconColor:   '#0F6E56',
    badgeBg:     '#E1F5EE',
    badgeColor:  '#085041',
    badge:       'สถานีติดตั้งโครงการ',
    title:       'Tele',
    description: 'ติดตามสถานีติดตั้งโครงการในพื้นที่ฝั่งขวาแม่น้ำยม ระดับน้ำ อัตราการไหล และกล้อง CCTV',
  },
  {
    href:        '/flow',
    icon:        <WavesIcon sx={{ fontSize: 22 }} />,
    iconBg:      '#E6F1FB',
    iconColor:   '#185FA5',
    badgeBg:     '#E6F1FB',
    badgeColor:  '#0C447C',
    badge:       'น้ำท่า',
    title:       'Flow',
    description: 'ข้อมูลอัตราการไหลและระดับน้ำตามสถานีวัดน้ำท่าของกรมชลประทาน',
  },
];

// ─── Shared card sx ────────────────────────────────────────────

const cardSx = {
  borderRadius: 3,
  border: '0.5px solid',
  borderColor: 'divider',
  p: { xs: 2, sm: 2.5 },
  bgcolor: 'background.paper',
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column' as const,
  transition: 'border-color 0.15s, box-shadow 0.15s',
  cursor: 'pointer',
  '&:hover': {
    borderColor: 'text.disabled',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
};

// ─── Component ────────────────────────────────────────────────

export default function Home() {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === 'dark';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary', transition: 'background-color 0.3s ease' }}>

      {/* ── Theme toggle ── */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1200 }}>
        <Tooltip title={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}>
          <IconButton
            onClick={() => setMode(isDark ? 'light' : 'dark')}
            sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 2, '&:hover': { bgcolor: 'action.hover' } }}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Container sx={{ py: { xs: 8, md: 10 } }}>

        {/* ── Hero ── */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Chip
            label="● ระบบออนไลน์ · อัปเดตเวอร์ชันล่าสุด 20 พ.ค. 2569"
            variant="outlined"
            size="small"
            sx={{ mb: 3, fontFamily: 'Prompt', fontSize: 13, color: 'text.secondary' }}
          />
          <Typography variant="h4" fontWeight={600} fontFamily="Prompt" gutterBottom lineHeight={1.5}>
            ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ พื้นที่ฝั่งขวาแม่น้ำยม
          </Typography>
          <Typography color="text.secondary" fontFamily="Prompt" sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.9, fontSize: '0.95rem' }}>
            ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ สำหรับงานเพิ่มประสิทธิภาพการบริหารจัดการน้ำ
            ในเขตอำเภอบางระกำ จังหวัดพิษณุโลก
          </Typography>
        </Box>

        {/* ── Big cards (Dashboard + Tele + Flow) ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>

          {/* Dashboard — full-width, horizontal layout */}
          <Box
            component={Link}
            href={BIG_CARDS[0].href}
            sx={{ ...cardSx, flexDirection: 'row', alignItems: 'center', gap: 2.5, gridColumn: { xs: '1', sm: '1 / -1' }, p: { xs: 2.5, sm: 3 } }}
          >
            <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: BIG_CARDS[0].iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: BIG_CARDS[0].iconColor }}>
              {BIG_CARDS[0].icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'inline-block', px: 1.25, py: 0.55, borderRadius: 99, bgcolor: BIG_CARDS[0].badgeBg, mb: 0.75 }}>
                <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.85rem', fontWeight: 600, color: BIG_CARDS[0].badgeColor, lineHeight: 1 }}>
                  {BIG_CARDS[0].badge}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '1.1rem', color: 'text.primary', mb: 0.25 }}>
                {BIG_CARDS[0].title}
              </Typography>
              <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.6 }}>
                {BIG_CARDS[0].description}
              </Typography>
            </Box>
            <ArrowForwardIcon sx={{ color: 'text.disabled', flexShrink: 0 }} />
          </Box>

          {/* Tele + Flow — 2 columns */}
          {BIG_CARDS.slice(1).map(c => (
            <Box key={c.href} component={Link} href={c.href} sx={cardSx}>
              <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.75, color: c.iconColor }}>
                {c.icon}
              </Box>
              <Box sx={{ display: 'inline-block', px: 1.25, py: 0.55, borderRadius: 99, bgcolor: c.badgeBg, mb: 1 }}>
                <Typography sx={{ fontFamily: 'Prompt', fontSize: '1rem', fontWeight: 600, color: c.badgeColor, lineHeight: 1 }}>
                  {c.badge}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', mb: 0.5 }}>
                {c.title}
              </Typography>
              <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}>
                {c.description}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── Small cards (Rain, Gate, About) ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          {SMALL_CARDS.map(c => (
            <Box key={c.href} component={Link} href={c.href} sx={cardSx}>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, color: c.iconColor }}>
                {c.icon}
              </Box>
              <Box sx={{ display: 'inline-block', px: 1.25, py: 0.55, borderRadius: 99, bgcolor: c.badgeBg, mb: 0.75 }}>
                <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.85rem', fontWeight: 600, color: c.badgeColor, lineHeight: 1 }}>
                  {c.badge}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: 'Prompt', fontWeight: 600, fontSize: '0.95rem', color: 'text.primary', mb: 0.5 }}>
                {c.title}
              </Typography>
              <Typography sx={{ fontFamily: 'Prompt', fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.6 }}>
                {c.description}
              </Typography>
            </Box>
          ))}
        </Box>

      </Container>
    </Box>
  );
}