// components/Equipment/EquipmentEditQueryWrapper.tsx
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import EquipmentFormClient from './EquipmentFormClient';

interface Props {
  staCode?: string; // ถ้ามี = โหมด fix สถานี (มาจาก /stations/[code]/equipment/edit)
}

export default function EquipmentEditQueryWrapper({ staCode }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error" sx={{ mb: 2 }}>
          ไม่พบรหัสอุปกรณ์ที่ต้องการแก้ไข 
        </Typography>
        <Button variant="contained" onClick={() => router.push(staCode ? `/stations/${encodeURIComponent(staCode)}` : '/equipment')}>
          กลับไปหน้าก่อนหน้า
        </Button>
      </Box>
    );
  }

  return <EquipmentFormClient mode="edit" staCode={staCode} equipmentId={id} />;
}