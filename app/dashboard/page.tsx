'use client';

import { Container, Typography, Grid } from '@mui/material';
import AppHeader from '@/components/layout/AppHeader';  

export default function Dashboard() {
  return (
  <>
    <AppHeader />
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        ภาพรวมสถานการณ์น้ำ - วันที่ {new Date().toLocaleDateString('th-TH')}
      </Typography>

      <Grid container spacing={4}>
        <Grid xs={12} md={4}>
          <Typography variant="h6">แผนที่สถานีวัดน้ำ</Typography>
        </Grid>
        <Grid xs={12} md={4}>
          <Typography variant="h6">สถานะเตือนภัย</Typography>
        </Grid>
      </Grid>
    </Container>
  </>
  );
}