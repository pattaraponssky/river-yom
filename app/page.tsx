// src/app/page.tsx
'use client';
import Link from 'next/link';
import { Box, Container, Typography, Button, Chip, Grid, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>

      {/* Hero */}
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 10 }}>
        <Chip
          label="● ระบบออนไลน์ · อัปเดตล่าสุด 28 มี.ค. 2568"
          variant="outlined"
          size="small"
          sx={{ mb: 3.5, fontFamily: 'Prompt', fontSize: 12, color: 'text.secondary' }}
        />
        <Typography variant="h4" fontWeight={600} fontFamily="Prompt, sans-serif" gutterBottom>
          ระบบบริหารจัดการน้ำ<br />ฝั่งขวาแม่น้ำยม
        </Typography>
        <Typography variant="body1" color="text.secondary" fontFamily="Prompt" sx={{ mb: 5, maxWidth: 640, lineHeight: 1.9 }}>
          ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ สำหรับงานเพิ่มประสิทธิภาพการบริหารจัดการน้ำ
          ในเขตอำเภอบางระกำ จังหวัดพิษณุโลก
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="contained" size="large" component={Link} href="/dashboard"
            startIcon={<DashboardIcon />}
            sx={{ px: 4, py: 1.5, fontFamily: 'Prompt', borderRadius: 2, textTransform: 'none', fontSize: '0.95rem' }}>
            เข้าสู่หน้าหลัก
          </Button>
          <Button variant="outlined" size="large" component={Link} href="/aboutus"
            startIcon={<InfoOutlinedIcon />}
            sx={{ px: 4, py: 1.5, fontFamily: 'Prompt', borderRadius: 2, textTransform: 'none', fontSize: '0.95rem' }}>
            เกี่ยวกับระบบ
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={1.5} justifyContent="center">
          {[
            { label: 'สถานีตรวจวัด', value: '12', unit: 'สถานี' },
            { label: 'ระดับน้ำเฉลี่ย', value: '2.34', unit: 'เมตร (ปกติ)' },
            { label: 'พื้นที่ครอบคลุม', value: '84,000', unit: 'ไร่' },
            { label: 'แจ้งเตือนใน 24 ชม.', value: '0', unit: 'รายการ' },
          ].map((s) => (
            <Grid key={s.label}>
              <Paper variant="outlined" sx={{ py:2, px: 4, borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">{s.label}</Typography>
                <Typography variant="h5" fontWeight={500} fontFamily="Prompt">{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" fontFamily="Prompt">{s.unit}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}