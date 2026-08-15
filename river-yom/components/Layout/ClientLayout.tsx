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


const DRAWER_WIDTH_OPEN = '268px';
const DRAWER_WIDTH_COLLAPSED = '68px';

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div>
      <CssBaseline />
      <AppHeader
        title="ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ พื้นที่ฝั่งขวาแม่น้ำยม"
        open={drawerOpen}
        setOpen={setDrawerOpen}
      />
      <DrawerComponent open={drawerOpen} setOpen={setDrawerOpen} />

      {/* รวม main + footer ไว้ใน Box เดียวกัน ให้ margin-left sync กันแน่นอน ไม่หลุดอีก */}
      <Box
        sx={{
          ml: { xs: 0, md: drawerOpen ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_COLLAPSED },
          transition: 'margin-left 0.3s',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box
          component="main"
          sx={{
            mt: { xs: '64px', md: '72px' },
            minHeight: 'calc(100vh - 200px)',
            backgroundColor: 'background.default',
            flex: 1,
          }}
        >
          {children}
        </Box>

        <Footer />
      </Box>
    </div>
  );
}