'use client';

import '@/app/globals.css';
import { Container, Typography, Grid, Box } from '@mui/material';
import AppHeader from '@/components/layout/AppHeader';  
import DashboardCards from './components/DashboardCard';
import React, { useState, useEffect } from "react";
import { Path_URL, API_URL, formatThaiDay } from '../../lib/utility';
import HydroMap from './components/Map';
import FlowCard from '../../components/dashboard/FlowCard';
import RainCard from '../../components/dashboard/RainCard';
import ReservoirChart from '@/components/data/ReservoirChartData';
import ReservoirCard from '@/components/dashboard/ReservoirCard';
import GateCard from '@/components/dashboard/GateCard';
import { BoxStyle } from '@/theme/style';

export default function Dashboard() {
  const mapKey = process.env.LONGDO_MAP_KEY!;
  const [data, setData] = useState<any>(null);

   useEffect(() => {
    fetch(`${API_URL}/api/dailySummary`)
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error(err));
  }, []);

  const JsonPaths = [
    `${Path_URL}data/River.geojson`,
    `${Path_URL}data/ProjectArea.geojson`,
  ];

  return (
  <>
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        ภาพรวมสถานการณ์น้ำ วันที่ {formatThaiDay(Date())}
      </Typography>
      
      <DashboardCards data={data}/>

      <Box sx={{
            display:"flex",
            flexDirection:{xs:"column",md:"row"},
            py:2,
            ...BoxStyle
        }}>
          <Box sx={{
              width:"100%",
              p:0, 
              }}>
              <HydroMap
                id="longdo-map"
                mapKey={mapKey}
                JsonPaths={JsonPaths}// ส่งข้อมูล GeoJSON เข้าไป}
                />
          </Box>
      </Box>
          <Grid size={{xs:12, md:6}} id="water-daily">  
        <Grid container spacing={1}>
          <Grid size={{xs:12, md:7}}>
            <ReservoirCard />
          </Grid>
            <Grid size={{xs:12, md:5}}>
            <RainCard />
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <FlowCard />
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <GateCard />
          </Grid>
        </Grid>
      </Grid>
    </Container>
  </>
  );
}1