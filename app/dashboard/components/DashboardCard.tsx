'use client';

import React from 'react';
import { Grid, Skeleton, Box, Typography } from '@mui/material';
import { Path_URL } from '../../../lib/utility';
import DashboardCard from '../../../components/dashboard/DashboardCard';

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
          value: '4',
          unit: 'ปตร.',
          value_data: data.discharge_gate?.['T.16'] ?? '283', // ใช้ optional chaining + fallback
          unit_data: 'ลบ.ม./วินาที',
          image: `${Path_URL}images/icons/gate_icon.png`,
          gradient: 'linear-gradient(135deg, #e57373, #d32f2f)',
          link: '/gate',
        },
        // {
        //   title: 'ระบายผ่านอาคาร',
        //   subTitle: 'ระบายรวม',
        //   value: '10',
        //   unit: 'อาคาร',
        //   value_data: data.discharge_gate
        //     ? [
        //         'BYH',
        //         'PBL',
        //         'PPM',
        //         'KTB',
        //         'MHC',
        //         'MSW',
        //         'KYG',
        //         'BBP',
        //         'SPN',
        //         'PTL',
        //       ]
        //         .reduce((sum: number, code: string) => {
        //           return sum + parseFloat(data.discharge_gate[code] || '0');
        //         }, 0)
        //         .toFixed(2)
        //     : '—',
        //   unit_data: 'ลบ.ม./วินาที',
        //   image: `${Path_URL}images/icons/gate_icon2.png`,
        //   gradient: 'linear-gradient(135deg, #f06292, #c2185b)',
        //   link: '/gate',
        // },
        {
          title: 'สถานีวัดน้ำท่า',
          subTitle: 'น้ำล้นตลิ่ง',
          value: '6',
          unit: 'สถานี',
          value_data: data.flow_stations_over_wl ?? '—',
          unit_data: 'สถานี',
          image: `${Path_URL}images/icons/flow_station_icon.png`,
          gradient: 'linear-gradient(135deg, #4db6ac, #00796b)',
          link: '/flow',
        },
        {
          title: 'สถานีวัดน้ำฝน',
          subTitle: 'ฝนเฉลี่ย',
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
          title: 'อ่างเก็บน้ำ',
          subTitle: 'น้ำใช้การได้',
          value: '2',
          unit: 'แห่ง',
          value_data: "400",
          // value_data: data.total_reservoir_volume ?? '—',
          unit_data: 'ล้าน ลบ.ม.',
          image: `${Path_URL}images/icons/reservoir_icon.png`,
          gradient: 'linear-gradient(135deg, #64b5f6, #1976d2)',
          link: '/reservoir',
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