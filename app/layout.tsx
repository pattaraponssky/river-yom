// src/app/layout.tsx
'use client';

import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import AppHeader from '@/components/layout/AppHeader';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { ThemeContextProvider } from '@/contexts/ThemeContext';
import DrawerComponent from '../components/layout/Drawer';
import { AuthProvider } from '@/contexts/AuthContext';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <html lang="th">
      <body className={prompt.className}>
        <AuthProvider>
          <ThemeContextProvider>{/* ถ้ามีธีม */}
            <CssBaseline />
            {/* Header + Drawer ห่อทุกหน้า */}
            <AppHeader 
              title="ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ พื้นที่ฝั่งขวาแม่น้ำยม" // หรือส่ง title ตาม route ได้
              open={drawerOpen}
              setOpen={setDrawerOpen}
              />
            <DrawerComponent 
              open={drawerOpen} 
              setOpen={setDrawerOpen} 
              />

            {/* เนื้อหาหลัก - เว้นระยะให้ไม่ทับ Header */}
            <Box
              component="main"
              sx={{
                mt: { xs: '64px', md: '72px' }, // ปรับตามความสูง Header
                ml: { md: drawerOpen ? '290px' : '72px' }, // เว้นระยะสำหรับ Drawer (persistent mode)
                transition: 'margin-left 0.3s',
                minHeight: 'calc(100vh - 64px)',
                backgroundColor: 'background.default',
              }}
              >
              {children}
            </Box>
          </ThemeContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}