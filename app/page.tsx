// src/app/page.tsx
'use client';

import { 
  Button, 
  Typography, 
  Container, 
  Box, 
  Card, 
  CardContent, 
  Grid 
} from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom 
        align="center" 
        sx={{ fontFamily: 'Prompt, sans-serif', color: '#28378B' }}
      >
        ยินดีต้อนรับสู่ Dashboard สถานการณ์น้ำ
      </Typography>

      <Typography variant="subtitle1" align="center" paragraph sx={{ mb: 6 }}>
        ระบบแสดงผลข้อมูลระดับน้ำ ปริมาณน้ำ และฝน แบบ real-time
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                ระดับน้ำปัจจุบัน
              </Typography>
              <Typography variant="h3" color="primary">
                3.45 ม.รทก.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                สถานี C.7A - วังสะตือ
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                ปริมาณน้ำท่า
              </Typography>
              <Typography variant="h3" color="error">
                1,264.32 ลบ.ม./วินาที
              </Typography>
              <Typography variant="body2" color="text.secondary">
                สถานี ปตร.ท่านางงาม
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                ปริมาณฝนสะสม
              </Typography>
              <Typography variant="h3" color="success.main">
                45.7 มม.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                24 ชม. ที่ผ่านมา
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          sx={{ px: 6, py: 1.5, fontSize: '1.2rem' }}
        >
          ดูข้อมูลทั้งหมด
        </Button>
      </Box>
    </Container>
  );
}