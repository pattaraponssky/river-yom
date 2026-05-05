'use client';

import React from 'react';
import { Grid, Skeleton, Box, Typography } from '@mui/material';
import { Path_URL } from '../../../lib/utility';
import DashboardCard from '../../../components/Dashboard/DashboardCard';

interface DashboardCardsProps {
  data: any;
  loading?: boolean;   // เพิ่ม prop นี้เพื่อบอกว่ากำลังโหลด
  error?: string | null; // ถ้ามี error จาก fetch
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ data, loading = false, error = null }) => {
  // สร้าง array การ์ดจากข้อมูลจริง (dynamic)
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
          image: `${Path_URL}images/icons/gate_icon.png`,
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
          image: `${Path_URL}images/icons/flow_station_icon.png`,
          gradient: 'linear-gradient(135deg, #4db6ac, #00796b)',
          link: '/flow',
        },
        {
          title: 'สถานีวัดน้ำฝน',
          subTitle: 'ฝนเฉลี่ยวันนี้',
          value: '8',
          unit: 'สถานี',
          value_data: 8.23,
          // value_data: data.avg_rain_mm ?? '—',
          unit_data: 'มม.',
          image: `${Path_URL}images/icons/rain_station_icon.png`,
          gradient: 'linear-gradient(135deg, #ffd54f, #ff8f00)',
          link: '/rain',
        },
        {
          title: 'สถานีโทรมาตร',
          subTitle: 'ระบายน้ำรวม',
          value: '6',
          unit: 'สถานี',
          value_data: data.discharge_flow
            ? [
                '01',
                '02',
                '03',
                '04',
                '05',
                '06',
              ]
                .reduce((sum: number, code: string) => {
                  return sum + parseFloat(data.discharge_flow[code] || '0');
                }, 0)
                .toFixed(2)
            : '—',
          unit_data: 'ลบ.ม./วินาที',
          image: `${Path_URL}images/icons/tele_station_icon.png`,
          gradient: 'linear-gradient(135deg, #64b5f6, #1976d2)',
          link: '/tele',
        },
        
      ]
    : [];

  // แสดง loading skeleton
  if (loading) {
    return (
      <Grid container spacing={2}>
        {[...Array(5)].map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 4 }} />
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
    <Grid container spacing={2}>
      {cardData.map((card, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
          <DashboardCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardCards;