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
        ยินดีต้อนรับ
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        paragraph
        sx={{ mb: 6, maxWidth: '800px', mx: 'auto', fontFamily: 'Prompt' }}
      >
        ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ พื้นที่ฝั่งขวาแม่น้ำยม สำหรับงานเพิ่มประสิทธิภาพการบริหารจัดการน้ำฝั่งขวาแม่น้ำยมในเขตอำเภอบางระกำ จังหวัดพิษณุโลก 
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
          เข้าสู่หน้าหลัก
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