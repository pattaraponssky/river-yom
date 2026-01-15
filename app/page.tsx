// src/app/page.tsx
'use client';

import { Container, Typography, Button, Box } from '@mui/material';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';

export default function Home() {
  return (
    <>
      {/* แถบด้านบน */}
      <AppHeader />

      {/* เนื้อหาหลัก */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography 
          variant="h3" 
          align="center" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold', 
            color: 'primary.main',
            mt: 4,
          }}
        >
          ระบบเฝ้าระวังสถานการณ์น้ำ
        </Typography>

        <Typography 
          variant="h6" 
          align="center" 
          color="text.secondary" 
          paragraph
          sx={{ mb: 8 }}
        >
          แม่น้ำยมฝั่งขวา - ข้อมูล real-time และประวัติ
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            component={Link} 
            href="/dashboard"
            sx={{ 
              px: 8, 
              py: 2, 
              fontSize: '1.2rem',
              borderRadius: 3,
              boxShadow: 3,
            }}
          >
            เข้าสู่ Dashboard
          </Button>
        </Box>
      </Container>
    </>
  );
}