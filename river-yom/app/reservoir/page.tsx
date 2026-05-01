// src/app/reservoir/page.tsx
'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';

const ReservoirStation = dynamic(
  () => import('./components/ReservoirStation'),
  { ssr: false }   // ปิด SSR สำหรับ component นี้
);
export default function ReservoirPage() {
  return <Box sx={{p:1}}>
    <ReservoirStation/>
  </Box>
}