// src/app/rain/page.tsx
'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';

const RainStation = dynamic(
  () => import('./components/RainStation'),
  { ssr: false } 
);

export default function RainPage() {
    return <Box sx={{p:1}}>
        <RainStation/>
    </Box>
}