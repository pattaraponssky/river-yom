// src/app/rain/page.tsx
'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import StationPageSkeleton from '@/components/Data/StationPageSkeleton';

const RainStation = dynamic(
  () => import('./RainStation'),
  { ssr: false, loading: () => <StationPageSkeleton metrics={2} /> }
);

export default function RainPage() {
    return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
        <RainStation/>
    </Box>
}