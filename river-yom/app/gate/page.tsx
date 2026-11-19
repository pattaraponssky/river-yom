// src/app/gate/page.tsx
'use client';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import StationPageSkeleton from '@/components/Data/StationPageSkeleton';

const GateStation = dynamic(
  () => import('./GateStation'),
  { ssr: false, loading: () => <StationPageSkeleton metrics={0} /> }
);

export default function GatePage() {
  return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}
          >
    <GateStation/>
  </Box>
}