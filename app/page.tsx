// src/app/page.tsx
'use client';
import Link from 'next/link';
import {
  Box, Container, Typography, Button, Chip, IconButton, Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useColorScheme } from '@mui/material/styles';

export default function Home() {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === 'dark';

  const toggleTheme = () => setMode(isDark ? 'light' : 'dark');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* ปุ่มสลับธีมมุมขวาบน */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1200 }}>
        <Tooltip title={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 2,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 10,
        }}
      >
        <Chip
          label="● ระบบออนไลน์ · อัปเดตเวอร์ชันล่าสุด 09 เม.ย. 2568"
          variant="outlined"
          size="small"
          sx={{ mb: 3.5, fontFamily: 'Prompt', fontSize: 14, color: 'text.secondary' }}
        />

        <Typography
          variant="h4"
          fontWeight={600}
          fontFamily="Prompt, sans-serif"
          gutterBottom
        >
          ระบบบริหารจัดการน้ำ<br />ฝั่งขวาแม่น้ำยม
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          fontFamily="Prompt"
          sx={{ mb: 5, maxWidth: 640, lineHeight: 1.9 }}
        >
          ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ สำหรับงานเพิ่มประสิทธิภาพการบริหารจัดการน้ำ
          ในเขตอำเภอบางระกำ จังหวัดพิษณุโลก
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            size="large"
            component={Link}
            href="/dashboard"
            startIcon={<DashboardIcon />}
            sx={{
              px: 4, py: 1.5,
              fontFamily: 'Prompt',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
            }}
          >
            เข้าสู่หน้าหลัก
          </Button>

          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/aboutus"
            startIcon={<InfoOutlinedIcon />}
            sx={{
              px: 4, py: 1.5,
              fontFamily: 'Prompt',
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
            }}
          >
            เกี่ยวกับระบบ
          </Button>
        </Box>
      </Container>
    </Box>
  );
}