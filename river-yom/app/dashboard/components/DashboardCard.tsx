'use client';

import React from 'react';
import { Grid, Skeleton, Box, Paper, Stack, Typography } from '@mui/material';
import { Path_URL } from '../../../lib/utility';
import { StationReadingChange } from '@/components/Data/StationReadingChange';
import { thaiTodayYMD } from '@/components/hooks/useRasData';
import type { DashboardTeleReading } from '@/components/Dashboard/TeleCard';
import DashboardCard from '../../../components/Dashboard/DashboardCard';

interface DashboardCardsProps {
  data: any;
  yesterdayYR05?: DashboardTeleReading;
  loading?: boolean;   // เพิ่ม prop นี้เพื่อบอกว่ากำลังโหลด
  error?: string | null; // ถ้ามี error จาก fetch
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ data, yesterdayYR05, loading = false, error = null }) => {
  // สร้าง array การ์ดจากข้อมูลจริง (dynamic)
  const yesterday = data?.tha_nang_ngam_datetime?.slice(0, 10) === thaiTodayYMD() ? yesterdayYR05 : undefined;
  const cardData = data
    ? [
        {
          title: 'ประตูระบายน้ำ',
          subTitle: 'ระบายน้ำรวม',
          value: '3',
          unit: 'ปตร.',
          // value_data: data.discharge_gate?.['tng'] ?? '0', // ใช้ optional chaining + fallback
          value_data: data.discharge_gate
            ? [
                'tng',
                'wst',
                'kpk',
              ]
                .reduce((sum: number, code: string) => {
                  return sum + parseFloat(data.discharge_gate[code] || '0');
                }, 0)
                .toFixed(2)
            : '—',
          unit_data: 'ลบ.ม./วินาที',
          image: `${Path_URL}/images/icons/gate_icon.png`,
          gradient: 'linear-gradient(135deg, #e57373, #d32f2f)',
          link: '/gate',
        },
        {
          title: 'สถานีวัดน้ำท่า',
          subTitle: 'น้ำล้นตลิ่ง',
          value: '7',
          unit: 'สถานี',
          value_data: data.flow_stations_over_wl ?? '—',
          unit_data: 'สถานี',
          image: `${Path_URL}/images/icons/flow_station_icon.png`,
          gradient: 'linear-gradient(135deg, #4db6ac, #00796b)',
          link: '/flow',
        },
        {
          title: 'สถานีวัดน้ำฝน',
          subTitle: 'ฝนเฉลี่ยวันนี้',
          value: '7',
          unit: 'สถานี',
          // value_data: 8.23,
          value_data: data.avg_rain_mm ?? '—',
          unit_data: 'มม.',
          image: `${Path_URL}/images/icons/rain_station_icon.png`,
          gradient: 'linear-gradient(135deg, #ffd54f, #ff8f00)',
          link: '/rain',
        },
        {
          title: 'สถานีติดตั้งโครงการ',
          subTitle: 'ระดับน้ำสะพานท่านางงาม (YR.05)',
          value: '',
          unit: '',
          value_data: data.tha_nang_ngam_water_level != null
            && Number.isFinite(Number(data.tha_nang_ngam_water_level))
            ? Number(data.tha_nang_ngam_water_level).toFixed(2)
            : '—',
          unit_data: 'ม.รทก.',
          image: `${Path_URL}/images/icons/tele_station_icon.png`,
          gradient: 'linear-gradient(135deg, #64b5f6, #1976d2)',
          link: '/tele',
          comparison: <StationReadingChange value={data.tha_nang_ngam_water_level} previous={yesterday?.wl}
            history={{ type: 'tele', metric: 'wl', stationCode: 'YR.05', currentTime: data.tha_nang_ngam_datetime, previousTime: yesterday?.datetime }} unit="ม." />,
        },
        
      ]
    : [];

  // แสดง loading skeleton
  if (loading) {
    return (
      <Grid container spacing={{ xs: 1.5, sm: 2 }} aria-busy="true" aria-label="กำลังโหลดสรุปสถานการณ์น้ำ">
        {Array.from({ length: 4 }, (_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index} aria-hidden="true">
            <Paper
              variant="outlined"
              sx={{
                height: '100%',
                p: { xs: 1.5, sm: 3 },
                borderRadius: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                alignItems: { xs: 'center', sm: 'stretch' },
                gap: { xs: 1.25, sm: 2 },
              }}
            >
              <Stack direction="row" spacing={{ xs: 1.25, sm: 2 }} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton animation="wave" variant="rounded" sx={{ width: { xs: 40, sm: 60 }, height: { xs: 40, sm: 60 }, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Skeleton animation="wave" width="85%" />
                  <Skeleton animation="wave" width="65%" />
                </Box>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="baseline">
                <Skeleton animation="wave" width={58} sx={{ fontSize: { xs: '1.35rem', sm: '2.125rem' } }} />
                <Skeleton animation="wave" width={28} />
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  // แสดง error ถ้ามี
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  // แสดงการ์ดปกติ
  return (
    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
      {cardData.map((card, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
          <DashboardCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardCards;