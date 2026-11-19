'use client';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import StationPageSkeleton from '@/components/Data/StationPageSkeleton';

const FlowStation = dynamic(
  () => import('./FlowStation'),
  { ssr: false, loading: () => <StationPageSkeleton metrics={3} /> }
);

export default function FlowPage() {
  return <Box sx={{ p: 1, maxWidth: 'xl', mx: 'auto', width: '100%'}}>
          <FlowStation/>
        </Box>
}