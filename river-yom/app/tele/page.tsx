'use client';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import StationPageSkeleton from '@/components/Data/StationPageSkeleton';

const TeleStation = dynamic(
  () => import('./TeleStation'),
  { ssr: false, loading: () => <StationPageSkeleton metrics={3} /> }
);

export default function TelePage() {
  return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
          <TeleStation/>
        </Box>
}