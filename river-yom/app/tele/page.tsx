'use client';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';

const TeleStation = dynamic(
  () => import('./components/TeleStation'),
  { ssr: false }   // ปิด SSR สำหรับ component นี้
);

export default function TelePage() {
  return <Box sx={{p:1}}>
          <TeleStation/>
        </Box>
}