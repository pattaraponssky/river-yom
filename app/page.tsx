// src/app/page.tsx
'use client';

import { Container, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
      <Typography
        variant="h3"
        fontWeight="bold"
        color="primary.main"
        gutterBottom
        sx={{ fontFamily: 'Prompt, sans-serif' }}
      >
        ยินดีต้อนรับสู่ ระบบเฝ้าระวังสถานการณ์น้ำ
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        paragraph
        sx={{ mb: 6, maxWidth: '800px', mx: 'auto', fontFamily: 'Noto Sans Thai' }}
      >
        แม่น้ำยมฝั่งขวา - ข้อมูล real-time และประวัติการบริหารจัดการน้ำ
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          component={Link}
          href="/dashboard"
          sx={{
            px: 6,
            py: 2,
            fontSize: '1.2rem',
            borderRadius: 3,
            boxShadow: 4,
            fontFamily: 'Prompt, sans-serif',
          }}
        >
          เข้าสู่ Dashboard
        </Button>

        <Button
          variant="outlined"
          color="primary"
          size="large"
          component={Link}
          href="/aboutus"
          sx={{
            px: 6,
            py: 2,
            fontSize: '1.2rem',
            borderRadius: 3,
            fontFamily: 'Prompt, sans-serif',
          }}
        >
          เกี่ยวกับระบบ
        </Button>
      </Box>
    </Container>
  );
}