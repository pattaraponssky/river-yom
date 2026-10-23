'use client';

import '@/app/globals.css';
import { Container, Typography, Grid, Box } from '@mui/material';
import DashboardCards from './components/DashboardCard';
import  { useState, useEffect } from "react";
import { API_URL, formatThaiDay } from '../../lib/utility';
import HydroMap from './components/Map';
import FlowCard from '../../components/Dashboard/FlowCard';
import RainCard from '../../components/Dashboard/RainCard';
import GateCard from '@/components/Dashboard/GateCard';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import TeleCard from '@/components/Dashboard/TeleCard';
import { dashboardMenus } from '@/lib/menuFloating';

const BASE_PATH = "/river-yom";
const JsonPaths = [
  `${BASE_PATH}/data/River.geojson`,
  `${BASE_PATH}/data/ProjectArea.geojson`,
];

export default function Dashboard() {
  const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
  const [dailySummary, setDailySummary] = useState<any>(null);

  // โหลด dailySummary
  useEffect(() => {
    fetch(`${API_URL}/api/dailySummary`)
      .then((res) => {
        if (!res.ok) throw new Error(`dailySummary failed: ${res.status}`);
        return res.json();
      })
      .then((json) => setDailySummary(json))
      .catch((err) => console.error("Failed to load dailySummary:", err));
  }, []);
    
  return (
  <>
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 } }}>
      <Typography id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: { md: 'left', xs: 'center' }, fontSize: { xs: 16, sm: 20, md: 24 }, mb: { xs: 1, sm: 1.5 } }}>
        ภาพรวมสถานการณ์น้ำ วันที่ {formatThaiDay(Date())}
      </Typography>
        <Box sx={{ minHeight: { xs: 0, md: 120 } }}>
          <DashboardCards data={dailySummary} />
        </Box>
      <Grid size={{xs:12, md:6}}>
        <Box id="map" sx={{
              display:"flex",
              flexDirection:{xs:"column",md:"row"},
              py: { xs: 1, sm: 2 },
          }}>
          <HydroMap
              mapKey={mapKey}
              JsonPaths={JsonPaths} // ส่งข้อมูล GeoJSON เข้าไป}
            />
        </Box>
      </Grid>
        <Grid container spacing={1} id="water-daily">
          <Grid size={{xs:12, md:12}}>
            <TeleCard />
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <FlowCard />
          </Grid>
            <Grid size={{xs:12, md:6}}>
            <RainCard />
          </Grid>
          <Grid size={{xs:12, md:12}}>
            <GateCard />
          </Grid>
        </Grid>
      <FloatingMenu menus={dashboardMenus} />
    </Container>
  </>
  );
}