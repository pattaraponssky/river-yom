'use client';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';

const FlowStation = dynamic(
  () => import('./components/FlowStation'),
  { ssr: false }   // ปิด SSR สำหรับ component นี้
);

export default function FlowPage() {
  return <Box sx={{p:1}}>
          <FlowStation/>
        </Box>
}