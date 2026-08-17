// src/app/rain/page.tsx
'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';

const RainStation = dynamic(
  () => import('./RainStation'),
  { ssr: false } 
);

export default function RainPage() {
    return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
        <RainStation/>
    </Box>
}