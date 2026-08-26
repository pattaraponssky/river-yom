// components/Equipment/MaintenanceQueryWrapper.tsx
'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import MaintenanceClient from '../../app/equipment/[id]/maintenance/MaintenanceClient';

export default function MaintenanceQueryWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          ไม่พบรหัสอุปกรณ์ (?id=... หายไปจาก URL)
        </Typography>
        <Button variant="contained" onClick={() => router.push('/equipment')}>
          กลับไปหน้ารายการอุปกรณ์
        </Button>
      </Box>
    );
  }

  return <MaintenanceClient id={id} />;
}