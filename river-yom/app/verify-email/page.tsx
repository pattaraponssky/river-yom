'use client';

import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import VerifyEmailPage from '@/components/Users/VerifyEmailPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
    >
      <VerifyEmailPage />
    </Suspense>
  );
}
