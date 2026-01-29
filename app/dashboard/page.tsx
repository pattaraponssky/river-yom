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
import Papa from "papaparse";
import FloodWarningTable from './components/WarningTable';

interface WaterLevelData {
  time: string;
  station: string;
  elevation: number;
  crossSection: number;
}
interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}

const stationMapping: Record<string, number> = {
  "T.10": 194202,
  "T.13": 142824,
  "T.15": 125488,
  "T.1": 84876,
  "T.14": 55827,
  "ปตร.พลเทพ": 321863,
  "ปตร.ท่าโบสถ์": 293361,
  "ปตร.ชลมาร์คพิจารณ์": 241714,
  "ปตร.โพธิ์พระยา": 204540,
};

export default function Dashboard() {
  const mapKey = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY!;

  // State สำหรับข้อมูลจาก API dailySummary
  const [dailySummary, setDailySummary] = useState<any>(null);

  // State สำหรับข้อมูลจาก RAS CSV
  const [rawData, setRawData] = useState<WaterLevelData[]>([]);
  const [forecastData, setForecastData] = useState<WaterLevelData[]>([]);
  const [historicalData, setHistoricalData] = useState<WaterLevelData[]>([]);
  const [maxElevations, setMaxElevations] = useState<Record<string, number>>({});
  const [waterPeaks, setWaterPeaks] = useState<Record<string, { elevation: number; time: string }>>({});
  const [waterTrends, setWaterTrends] = useState<Record<string, string>>({});

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

  // โหลดและประมวลผล RAS CSV
  useEffect(() => {
      let isMounted = true;

      const loadRasData = async () => {
        try {
          // 1. ดึงไฟล์ CSV
          const response = await fetch(`${Path_URL}ras-output/output_ras.csv`);
          if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
          }
          const csvText = await response.text();

          // 2. Parse CSV
          const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
            Papa.parse<Record<string, string>>(csvText, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (header) => header.trim(),
              complete: (results) => resolve(results)
            });
          });

          if (!parseResult.data?.length) {
            console.warn("CSV has no data rows");
            return;
          }

          const rawRows = parseResult.data;

          // 3. กำหนดช่วงเวลา
          const now = new Date();
          const today9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);

          const startPast = new Date(today9am);
          startPast.setDate(today9am.getDate() - 6);

          const startForecast = new Date(today9am);
          const endForecast = new Date(today9am);
          endForecast.setDate(today9am.getDate() + 7);

          const tomorrow9am = new Date(today9am);
          tomorrow9am.setDate(today9am.getDate() + 1);

          // 4. ฟังก์ชันช่วยแปลงวันที่
          const parseDateString = (dateStr: string | undefined): string | null => {
            if (!dateStr) return null;
            const trimmed = dateStr.trim();
            const [datePart, timePart] = trimmed.split(" ");
            if (!datePart || !timePart) return null;

            const [day, month, year] = datePart.split("/").map(Number);
            if ([day, month, year].some(isNaN)) return null;

            const paddedMonth = month.toString().padStart(2, "0");
            const paddedDay = day.toString().padStart(2, "0");
            const paddedTime = timePart.padStart(8, "0"); // เผื่อกรณีไม่มีวินาที

            return `${year}-${paddedMonth}-${paddedDay}T${paddedTime}`;
          };

          // 5. แปลงข้อมูลทั้งหมดเป็น WaterLevelData[]
          const allPoints: WaterLevelData[] = rawRows
            .map((row) => {
              const dateStr = row["Date"]?.trim();
              const crossSectionStr = row["Cross Section"]?.trim();
              const elevationStr = row["Water_Elevation"]?.trim();

              const crossSection = Number(crossSectionStr);
              if (isNaN(crossSection)) return null;

              const elevation = parseFloat(elevationStr);
              if (isNaN(elevation)) return null;

              const time = parseDateString(dateStr);
              if (!time) return null;

              const station = Object.entries(stationMapping).find(
                ([, value]) => value === crossSection
              )?.[0];

              if (!station) return null;

              return { time, station, elevation, crossSection };
            })
            .filter((item): item is WaterLevelData => item !== null);

          if (!allPoints.length) return;

          // 6. กรองตามช่วงเวลา
          const historical = allPoints.filter((p) => {
            const d = new Date(p.time);
            return d >= startPast && d < today9am;
          });

          const forecast = allPoints.filter((p) => {
            const d = new Date(p.time);
            return d >= startForecast && d <= endForecast;
          });

          const todayAndFuture = allPoints.filter((p) => {
            const d = new Date(p.time);
            return d >= today9am;
          });

          // 7. คำนวณ max elevation + peak time (วันนี้และอนาคต)
          const stationMaxMap: Record<string, number> = {};
          const peakMap: Record<string, { elevation: number; time: string }> = {};

          Object.keys(stationMapping).forEach((station) => {
            const points = todayAndFuture.filter((p) => p.station === station);
            if (!points.length) return;

            const maxPoint = points.reduce((prev, curr) =>
              curr.elevation > prev.elevation ? curr : prev
            );

            stationMaxMap[station] = maxPoint.elevation;
            peakMap[station] = { elevation: maxPoint.elevation, time: maxPoint.time };
          });

          // 8. คำนวณ trend
          const trendResults: Record<string, string> = {};

          Object.keys(stationMapping).forEach((station) => {
            const points = forecast.filter((p) => p.station === station);
            if (points.length < 2) {
              trendResults[station] = "ไม่มีข้อมูลเพียงพอ";
              return;
            }

            const before = points.filter((p) => new Date(p.time) < tomorrow9am);
            const after = points.filter((p) => new Date(p.time) >= tomorrow9am);

            if (!before.length || !after.length) {
              trendResults[station] = "ไม่มีข้อมูลเพียงพอ";
              return;
            }

            const avgBefore = before.reduce((sum, p) => sum + p.elevation, 0) / before.length;
            const avgAfter = after.reduce((sum, p) => sum + p.elevation, 0) / after.length;

            const diff = avgAfter - avgBefore;
            if (diff > 0.01) trendResults[station] = "เพิ่มขึ้น";
            else if (diff < -0.01) trendResults[station] = "ลดลง";
            else trendResults[station] = "คงที่";
          });

          // 9. อัปเดต state
          if (isMounted) {
            setRawData(allPoints);
            setHistoricalData(historical);
            setForecastData(forecast);
            setMaxElevations(stationMaxMap);
            setWaterPeaks(peakMap);
            setWaterTrends(trendResults);
          }
        } catch (err) {
          console.error("RAS data loading failed:", err);
        }
      };

      loadRasData();

      return () => {
        isMounted = false;
      };
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
      
      <DashboardCards data={setDailySummary}/>

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
      <Box sx={BoxStyle}>
        <FloodWarningTable maxLevels={maxElevations} waterTrends={waterTrends} waterPeaks={waterPeaks}   />
      </Box>
    </Container>
  </>
  );
}1