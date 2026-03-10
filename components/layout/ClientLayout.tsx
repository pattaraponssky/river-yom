// src/components/layout/ClientLayout.tsx
'use client';

import { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import DrawerComponent from './Drawer';
import Footer from './Footer';
import dynamic from 'next/dynamic';
const AppHeader = dynamic(() => import('./AppHeader'), { ssr: false });

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div >
      <CssBaseline />
      <AppHeader
        title="ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ พื้นที่ฝั่งขวาแม่น้ำยม"
        open={drawerOpen}
        setOpen={setDrawerOpen}
      />
      <DrawerComponent open={drawerOpen} setOpen={setDrawerOpen} />

      <Box
        component="main"
        sx={{
          mt: { xs: '64px', md: '72px' },
          ml: { md: drawerOpen ? '290px' : '72px' },
          transition: 'margin-left 0.3s',
          minHeight: 'calc(100vh - 200px)',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
        <Footer/>
    </div>
  );
}