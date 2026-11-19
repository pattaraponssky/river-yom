// src/app/reservoir/page.tsx
'use client';

import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import StationPageSkeleton from '@/components/Data/StationPageSkeleton';

const ReservoirStation = dynamic(
  () => import('./ReservoirStation'),
  { ssr: false, loading: () => <StationPageSkeleton metrics={0} /> }
);
export default function ReservoirPage() {
  return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
    <ReservoirStation/>
  </Box>
}