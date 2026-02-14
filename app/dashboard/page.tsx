"use client";

import '@/app/globals.css';
import { Container, Typography, Grid, Box, useTheme } from '@mui/material';
import DashboardCards from './components/DashboardCard';
import  { useState, useEffect, use } from "react";
import { Path_URL, API_URL, formatThaiDay } from '../../lib/utility';
import HydroMap from './components/Map';
import FlowCard from '../../components/Dashboard/FlowCard';
import RainCard from '../../components/Dashboard/RainCard';
import ReservoirCard from '@/components/Dashboard/ReservoirCard';
import GateCard from '@/components/Dashboard/GateCard';
import { BoxStyle} from '@/theme/style';
import Papa from "papaparse";
import FloodWarningTable from './components/WarningTable';
import FloatingMenu from '@/components/Dashboard/FloatingMenu';
import ImageComponent from '../../components/Image';
import PdfViewer from '../../components/PdfViewer';
import LongProfileChart from './components/LongProfile';
import WaterLevelChart from './components/WaterLevelChart';
import WaterForecastChart from './components/WaterForecastChart';


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
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [dailySummary, setDailySummary] = useState<any>(null);

  const [forecastLongProfile, setForecastLongProfile] = useState<waterData[]>([]);
  const [forecastChart, setForecastChart] = useState<waterData[]>([]);
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
          throw new Error(`Failed to fetch CSV: ${response.status} - ${response.statusText}`);
        }
        const csvText = await response.text();

        // 2. Parse CSV อย่างปลอดภัย + trim header
        const parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
          Papa.parse<Record<string, string>>(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // สำคัญมาก! ลบช่องว่างท้าย header
            dynamicTyping: false, // ป้องกันการแปลงอัตโนมัติผิด
            complete: (results) => resolve(results)
          });
        });

        if (!parseResult.data?.length) {
          console.warn("CSV has no data rows after parsing");
          return;
        }

        const rawRows = parseResult.data;
        console.log("จำนวนแถวที่ parse ได้:", rawRows.length);

        // 3. กำหนดช่วงเวลา (เหมือนเดิม)
        const now = new Date();
        const today9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);

        const startPast = new Date(today9am);
        startPast.setDate(today9am.getDate() - 6);

        const startForecast = new Date(today9am);
        const endForecast = new Date(today9am);
        endForecast.setDate(today9am.getDate() + 7);

        const tomorrow9am = new Date(today9am);
        tomorrow9am.setDate(today9am.getDate() + 1);

        // 4. ฟังก์ชันแปลงวันที่ที่รองรับรูปแบบจริง (dd/mm/yyyy HH:mm)
        const parseDateString = (dateStr: string | undefined): string | null => {
          if (!dateStr) return null;
          const trimmed = dateStr.trim();
          const [datePart, timePart] = trimmed.split(/\s+/); // แยกด้วยช่องว่าง 1+ ตัว
          if (!datePart || !timePart) return null;

          const [day, month, year] = datePart.split("/").map(Number);
          if ([day, month, year].some(isNaN)) return null;

          // แปลงปี พ.ศ. → ค.ศ. (ถ้า > 2500 ถือว่าเป็น พ.ศ.)
          const fullYear = year > 2500 ? year - 543 : year;

          const [hour, minute] = timePart.split(":").map(Number);
          if ([hour, minute].some(isNaN)) return null;

          // สร้าง ISO string
          return `${fullYear}-${month.toString().padStart(2, "0")}-${day
            .toString()
            .padStart(2, "0")}T${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}:00`;
        };

        // 5. แปลงข้อมูลเป็น WaterLevelData[]
        const allPoints: WaterLevelData[] = rawRows
          .map((row) => {
            const dateStr = row["Date"]?.trim();
            let crossSectionStr = row["Cross Section"]?.trim();
            const elevationStr = row["Water_Elevation"]?.trim();

            // ลบช่องว่างท้าย cross section (กรณี CSV มี trailing space)
            crossSectionStr = crossSectionStr?.replace(/\s+$/, "");

            const crossSection = Number(crossSectionStr);
            if (isNaN(crossSection)) return null;

            const elevation = parseFloat(elevationStr);
            if (isNaN(elevation)) return null;

            const time = parseDateString(dateStr);
            if (!time) {
              console.warn("ไม่สามารถ parse วันที่:", dateStr);
              return null;
            }

            const stationEntry = Object.entries(stationMapping).find(
              ([, value]) => value === crossSection
            );

            if (!stationEntry) {
              // console.debug("ไม่พบ station สำหรับ Cross Section:", crossSection);
              return null;
            }

            const station = stationEntry[0];

            return { time, station, elevation, crossSection };
          })
          .filter((item): item is WaterLevelData => item !== null);

        console.log("จำนวนจุดข้อมูลที่ parse สำเร็จ:", allPoints.length);
        if (allPoints.length === 0) {
          console.warn("ไม่พบข้อมูลที่ match กับ stationMapping เลย");
          return;
        }

        // 6. กรองตามช่วงเวลา (เหมือนเดิม)
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

        if (isMounted) {
          setRawData(allPoints);
          setHistoricalData(historical);
          setForecastData(forecast);
          setMaxElevations(stationMaxMap);
          setWaterPeaks(peakMap);
          setWaterTrends(trendResults);
          const longProfileData: waterData[] = forecast.map((p) => ({
            CrossSection: p.crossSection,
            Date: p.time.replace("T", " "), // แปลง ISO → "YYYY-MM-DD HH:mm:ss"
            WaterLevel: p.elevation,
          }));
           const ChartData: waterData[] = allPoints.map((p) => ({
            CrossSection: p.crossSection,
            Date: p.time.replace("T", " "), // แปลง ISO → "YYYY-MM-DD HH:mm:ss"
            WaterLevel: p.elevation,
          }));

          setForecastChart(ChartData)
          setForecastLongProfile(longProfileData);
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
              JsonPaths={JsonPaths}// ส่งข้อมูล GeoJSON เข้าไป}
            />
        </Box>
      </Grid>
        <Grid container spacing={1} id="water-daily">
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
      <Box sx={BoxStyle} id="flood-warning">
        <FloodWarningTable maxLevels={maxElevations} waterTrends={waterTrends} waterPeaks={waterPeaks}   />
      </Box>
      <Box sx={BoxStyle} id="forecast-chart" >
        <WaterForecastChart data={forecastChart} />
      </Box>
       <Box sx={BoxStyle} id="profile-chart">
        <LongProfileChart waterData={forecastLongProfile} />
        {/* <LongProfileChart waterData={forecastLongProfile} isDark={isDark}/> */}
      </Box>
      <Box sx={BoxStyle} id="water-level" >
        <WaterLevelChart data={forecastData}/>
      </Box>
      <Box sx={BoxStyle} id="diagrams-report">
       <Grid container spacing={1}>
          <Grid size={{xs:12, md:6}}>
            <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/3dams.jpg" alt="สภาพน้ำเขื่อนภูมิพล เขื่อนสิริกิต์ และเขื่อแควน้อยฯ" title={'สภาพน้ำในเขื่อนประจำวัน'} />
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/onepages.jpg" alt="สถานการณ์น้ำ สำนักงานชลประทานที่ 3" title={'สถานการณ์น้ำ สำนักงานชลประทานที่ 3'} />
          </Grid>
        </Grid>
         <Grid container spacing={1}>
          <Grid size={{xs:12, md:6}}>
            <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/dailyreport.jpg" alt="สรุปสถานการณ์น้ำและการเฝ้าระวัง" title={'สรุปสถานการณ์น้ำและการเฝ้าระวัง'} />
          </Grid>
          <Grid size={{xs:12, md:6}}>
            <ImageComponent src="http://irrigation.rid.go.th/rid3/water/images/onepages.jpg" alt="สถานการณ์น้ำ สำนักงานชลประทานที่ 3" title={'สถานการณ์น้ำ สำนักงานชลประทานที่ 3'} />
          </Grid>
        </Grid>
      </Box>
        <Box sx={BoxStyle}>
            <PdfViewer src="http://irrigation.rid.go.th/rid3/water/report.pdf" title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3" />
        </Box>
        <Box sx={BoxStyle}>
            <PdfViewer src="http://irrigation.rid.go.th/rid3/water/rpt050269.pdf" title="รายงานสถานการณ์น้ำประจำวัน สำนักงานชลประทานที่ 3" />
        </Box>
      <FloatingMenu/>
    </Container>
  </>
  );
}