'use client';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';

const TeleStation = dynamic(
  () => import('./TeleStation'),
  { ssr: false }   // ปิด SSR สำหรับ component นี้
);

export default function TelePage() {
  return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
          <TeleStation/>
        </Box>
}