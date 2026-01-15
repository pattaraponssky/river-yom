// src/components/layout/AppHeader.tsx
'use client';

import { AppBar, Toolbar, Typography, IconButton, Box, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ThemeSwitcher from '@/components/ThemeSwitcher'; // ปุ่มสลับธีมที่เราทำก่อนหน้า
import Link from 'next/link';

export default function AppHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < md = มือถือ/แท็บเล็ต

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(40, 55, 139, 0.85)', // สีน้ำเงินกรมชลฯ แบบโปร่งแสง
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* โลโก้ / ชื่อระบบ */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            sx={{
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: 1,
              fontFamily: 'Prompt, sans-serif',
            }}
          >
            ระบบเฝ้าระวังน้ำ
          </Typography>
        </Link>

        {/* ส่วนขวา: สวิตช์ธีม + เมนูมือถือ */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* ปุ่มสลับธีม */}
          <ThemeSwitcher />

          {/* ปุ่มเมนูสำหรับมือถือ (ถ้าจะทำ drawer ภายหลัง) */}
          {isMobile && (
            <IconButton 
              color="inherit" 
              edge="end"
              sx={{ ml: 1 }}
              // onClick={เปิด drawer} ถ้ามี drawer
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}