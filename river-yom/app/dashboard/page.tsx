'use client';

import '@/app/globals.css';
import { Container, Typography, Grid, Box } from '@mui/material';
import DashboardCards from './components/DashboardCard';
import  { useState, useEffect } from "react";
import { Path_URL, API_URL, formatThaiDay } from '../../lib/utility';
import HydroMap from './components/Map';
import FlowCard from '../../components/Dashboard/FlowCard';
import RainCard from '../../components/Dashboard/RainCard';
import GateCard from '@/components/Dashboard/GateCard';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import TeleCard from '@/components/Dashboard/TeleCard';

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
    
  const JsonPaths = [
    `${Path_URL}data/River.geojson`,
    `${Path_URL}data/ProjectArea.geojson`,
  ];

  return (
  <>
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h5" id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        ภาพรวมสถานการณ์น้ำ วันที่ {formatThaiDay(Date())}
      </Typography>
        <DashboardCards data={dailySummary}/>
      <Grid size={{xs:12, md:6}}>
        <Box id="map" sx={{
              display:"flex",
              flexDirection:{xs:"column",md:"row"},
              py:2,
          }}>
          <HydroMap
              mapKey={mapKey}
              JsonPaths={JsonPaths} // ส่งข้อมูล GeoJSON เข้าไป}
            />
        </Box>
      </Grid>
        <Grid container spacing={1} id="water-daily">
          <Grid size={{xs:12, md:6}}>
            <FlowCard />
          </Grid>
            <Grid size={{xs:12, md:6}}>
            <RainCard />
          </Grid>
          <Grid size={{xs:12, md:12}}>
            <GateCard />
          </Grid>
          <Grid size={{xs:12, md:12}}>
            <TeleCard />
          </Grid>
        </Grid>
      <FloatingMenu/>
    </Container>
  </>
  );
}