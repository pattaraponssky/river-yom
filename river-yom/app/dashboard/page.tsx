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
import TeleCard, { type DashboardTeleReading } from '@/components/Dashboard/TeleCard';
import { thaiTodayYMD } from '@/components/hooks/useRasData';
import { dashboardMenus } from '@/lib/menuFloating';
import { useClientDate } from '@/components/hooks/useClientDate';

const BASE_PATH = "/river-yom";
const JsonPaths = [
  `${BASE_PATH}/data/River.geojson`,
  `${BASE_PATH}/data/ProjectArea.geojson`,
];

export default function Dashboard() {
  const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;
  const [summaryStatus, setSummaryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [yesterdayTele, setYesterdayTele] = useState<Record<string, DashboardTeleReading>>({});
  const clientDate = useClientDate();

  // โหลด dailySummary
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/dailySummary`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`dailySummary failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (controller.signal.aborted) return;
        setDailySummary(json);
        setSummaryStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setSummaryStatus("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const today = thaiTodayYMD();
    const previousDay = new Date(`${today}T00:00:00Z`);
    previousDay.setUTCDate(previousDay.getUTCDate() - 1);
    const yesterday = previousDay.toISOString().slice(0, 10);
    const controller = new AbortController();

    fetch(`${API_URL}/api/daily/tele/${yesterday}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (controller.signal.aborted || !Array.isArray(json?.data)) return;
        setYesterdayTele(Object.fromEntries(
          json.data
            .filter((row: DashboardTeleReading) => row.datetime?.slice(0, 10) === yesterday)
            .map((row: DashboardTeleReading) => [row.sta_code, row])
        ));
      })
      .catch(err => {
        if (!controller.signal.aborted) console.error(err);
      });
    return () => controller.abort();
  }, []);

  return (
  <>
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 } }}>
      <Typography id="card-daily" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: { md: 'left', xs: 'center' }, fontSize: { xs: 16, sm: 20, md: 24 }, mb: { xs: 1, sm: 1.5 } }}>
        ภาพรวมสถานการณ์น้ำ วันที่ {clientDate ? formatThaiDay(clientDate.toString()) : ''}
      </Typography>
        <Box sx={{ minHeight: { xs: 0, md: 120 } }}>
          <DashboardCards
            data={dailySummary}
            yesterdayYR05={yesterdayTele["YR.05"]}
            loading={summaryStatus === "loading"}
            error={summaryStatus === "error" ? "โหลดข้อมูลภาพรวมไม่สำเร็จ" : null}
          />
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
            <TeleCard previous={yesterdayTele} />
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <FlowCard
              flowStationsOverWl={dailySummary?.flow_stations_over_wl == null ? null : Number(dailySummary.flow_stations_over_wl)}
              summaryLoading={summaryStatus === "loading"}
            />
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