import React, { useState, useEffect } from 'react';
import { Card, Box, Typography, Grid ,useTheme} from '@mui/material';
import { ApexOptions, } from 'apexcharts'; // เพิ่ม ApexAnnotations
import CenteredLoading from '@/components/Layout/CenteredLoading';
import { titleStyle } from '@/theme/style';
import dynamic from "next/dynamic";

// (ส่วน stationMapping และ Interfaces ยังคงเดิม)
const stationMapping: Record<string, number> = {
  "Y.15": 170764,
  "Y.16": 142824,
  "Y.64": 125488,
  "Y.17": 84876,
  // "Y.64": 55827,
};

interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}

interface Props {
  data: waterData[];
}


interface ThresholdData {
  staCode: string;
  location: string;
  watch: number;
  alert: number;
  crisis: number;
  maxY: number;
}

// === เกณฑ์ระดับน้ำ (Watch, Alert, Crisis) ===
const thresholdData: ThresholdData[] = [
  {
    staCode: 'Y.15',
    location: 'วัดพระรูป',
    watch: 2.90,
    alert: 3.20,
    crisis: 3.50,
    maxY: 3.5,
  },
  {  
    staCode: 'Y.16',
    location: 'บ้านบางการ้อง',
    watch: 2.16,
    alert: 2.28,
    crisis: 2.40,
    maxY: 2.40,
  },
   {
    staCode: 'Y.4',
    location: 'บ้านบางไทรป่า',
    watch: 1.60,
    alert: 1.70,
    crisis: 1.80,
    maxY: 1.80,
  },
  {
    staCode: 'Y.50',
    location: 'ที่ว่าการอำเภอ',
    watch: 1.25,
    alert: 1.38,
    crisis: 1.50,
    maxY: 1.50,
  },
  {
    staCode: 'Y.64',
    location: 'ตลาดสามพราน',
    watch: 1.20,
    alert: 1.35,
    crisis: 1.50,
    maxY: 1.50,
  },
];

const thresholdMap = new Map<string, ThresholdData>(
    thresholdData.map(item => [item.staCode, item])
);


const WaterForecastChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const bgColor = isDark ? "#1e2533" : "#f8fafc"; 
  const textColor = isDark ? "#e2e8f0" : "#334155";    

  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // const [lastRunTime, setLastRunTime] = useState<string>(''); 
  const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
  // สร้างค่าเวลากำหนด 9:00 น. ของวันนี้
  const today = new Date();
  today.setHours(9, 0, 0, 0); // ตั้งเวลาเป็น 09:00:00.000

  // ใช้ค่าเวลา 9:00 น. ของวันนี้เป็นตำแหน่ง TOF
  const tofTime = today.getTime(); 

  useEffect(() => {
    if (data && data.length > 0) {
      const today = new Date();
      const start = new Date(today);
      const end = new Date(today);
      start.setDate(today.getDate() - 3);
      end.setDate(today.getDate() + 7);
    
      const result: any[] = Object.entries(stationMapping).map(([name, crossSectionId]) => {
        const stationData = data
          .filter(d => {
            if (!d.Date) return false;
            const dTime = new Date(d.Date);
            return d.CrossSection === crossSectionId && dTime >= start && dTime <= end;
          })
          .sort((a, b) => new Date(a.Date!).getTime() - new Date(b.Date!).getTime())
          .map(d => ({
            x: d.Date!,
            y: parseFloat(d.WaterLevel.toFixed(2)),
          }));
    
        return {
          name,
          data: stationData,
        };
      });
      setSeriesData(result);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [data]);

  if (loading) return <CenteredLoading />;


  return (
    <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" }, // มือถือ: ซ้อนแนวตั้ง / จอใหญ่: แนวนอน
            alignItems: { xs: "center", sm: "center" },
            justifyContent: { xs: "center",md:"space-between"},
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >

        <Typography sx={{ paddingBottom: 2, fontWeight: "bold", ...titleStyle, color: "#28378B" }}>
          ผลการพยากรณ์ระดับน้ำ 7 วัน ล่วงหน้า
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ width: 50, height: 4, backgroundColor: '#1E88E5', mr: 1 }} />
            <Typography sx={{ fontFamily: 'Prompt', mr: 2 }}>ค่าตรวจวัดจริง</Typography>

            <Box sx={{ width: 50, height: 0, borderTop: '4px dashed #66BB6A', mr: 1 }} />
            <Typography sx={{ fontFamily: 'Prompt' }}>ค่าพยากรณ์</Typography>
        </Box>

        {/* {lastRunTime && (
          <Typography sx={{ paddingBottom: 2, fontStyle: 'italic', color: '#555',fontFamily: "Prompt", marginLeft: 'auto',fontSize:"1rem" }}>
            แบบจำลองทำงานล่าสุดเวลา: {lastRunTime}
          </Typography>
        )} */}
       </Box>
      <Grid container spacing={2}>
        {seriesData.map((seriesItem: any, index: number) => {
          const stationCode = seriesItem.name; // Y.15, Y.16, etc.
          const thresholds = thresholdMap.get(stationCode);

          // แบ่งข้อมูลตามตำแหน่ง TOF ที่กำหนด (9:00 น. ของวันนี้)
          const normalData = seriesItem.data.filter((d: {x: string}) => new Date(d.x).getTime() < tofTime);
          const dashedData = seriesItem.data.filter((d: {x: string}) => new Date(d.x).getTime() >= tofTime);

          // 1. หาค่าสูงสุดของข้อมูลใน Series นี้ทั้งหมด
          const maxDataValue = seriesItem.data.reduce((max: number, point: { x: string; y: number }) => Math.max(max, point.y), -Infinity);
          const minDataValue = seriesItem.data.reduce(
            (min: number, point: { x: string; y: number }) => Math.min(min, point.y),
            Infinity
          );

          const crisisLevel = thresholds?.crisis ?? -Infinity;
          const explicitMax = thresholds?.maxY ?? -Infinity; // Custom override max

          let baseMax: number;
          let baseMin: number;
          let buffer: number;

          if (maxDataValue < crisisLevel) {
              // Rule: If maxDataValue < crisisLevel. Base must be crisisLevel to show annotation. Use safe 0.5 buffer.
              baseMax = crisisLevel;
              buffer = 0.2;
          } else {
              // Rule: If maxDataValue >= crisisLevel. Base is data max. Use minimal 0.1 buffer.
              baseMax = maxDataValue;
              buffer = 0.2;
          }

          if (minDataValue < crisisLevel) {
              // Rule: If maxDataValue < crisisLevel. Base must be crisisLevel to show annotation. Use safe 0.5 buffer.
              baseMin = minDataValue;
              buffer = 0.2;
          } else {
              // Rule: If maxDataValue >= crisisLevel. Base is data max. Use minimal 0.1 buffer.
              baseMin = crisisLevel;
              buffer = 0.2;
          }

          // Override: Ensure the base maximum respects the custom explicitMax if it is higher than the calculated baseMax.
          baseMax = Math.max(baseMax, explicitMax, 0); 
          
          const finalMax = baseMax + buffer;
          const finalMin = baseMin - buffer;
          // === End Custom Y-Axis Min/Max Logic ===

          const yAxisAnnotations: ApexAnnotations['yaxis'] = [];
          if (thresholds) {
              // ระดับตลิ่ง
            yAxisAnnotations.push({
              y: thresholds.crisis,
              borderColor: '#D32F2F', // Yellow/Amber
              borderWidth: 2,
              strokeDashArray: 5,
              label: {
                borderColor: '#D32F2F',
                style: { color: '#fff', background: '#D32F2F', fontSize: '12px' ,fontWeight: 600 },
                text: `ระดับตลิ่ง (${thresholds.crisis.toFixed(2)} ม.รทก.)`,
              },
            });
            yAxisAnnotations.push({
              y: thresholds.alert,
              borderColor: '#FFD700', // Yellow/Amber
              borderWidth: 2,
              label: { 
                borderColor: '#FFD700',
                style: { color: '#fff', background: '#FFD700', fontSize: '12px' ,fontWeight: 600 },
              },
            });
             yAxisAnnotations.push({
              y: thresholds.watch,
              borderColor: '#69fc00ff', // Yellow/Amber
              borderWidth: 2,
              label: {
                borderColor: '#69fc00ff',
                style: { color: '#fff', background: '#69fc00ff', fontSize: '12px' ,fontWeight: 600 },
              },
            });
          }
          
          // === ตั้งค่า X-axis Annotation ที่ 9:00 น. ของวันนี้ ===
          const tofAnnotation: ApexAnnotations['xaxis'] = [{
                x: tofTime, // ใช้ค่าที่ตั้งไว้ 9:00 น.
                borderColor: '#FF0000',
                label: {
                  position: 'top',
                  offsetY: -40,
                  borderColor: '#000',
                  style: {
                    color: '#fff',
                    background: '#FF0000',
                    fontSize: '14px',
                  },
                  text: 'TOF', // เปลี่ยนข้อความเพื่อให้ชัดเจนขึ้น
                },
              }];
          // === สิ้นสุดการตั้งค่า X-axis Annotation ===

          const options: ApexOptions = {
            chart: {
              id: `chart-${index}`,
              background: bgColor,
              fontFamily: "Prompt",
              foreColor: textColor,
              type: 'line',
              height: 350,
              zoom: { enabled: false },
              toolbar: {
                show: true,
                tools: {
                  download: true,
                  selection: true,
                  zoom: true,
                  zoomin: true,
                  zoomout: true,
                  pan: true,
                  reset: true,
                },
                export: {
                  png: {
                    filename: `สถานีน้ำท่า ${seriesItem.name}`,
                  },
                  svg: {
                    filename: `สถานีน้ำท่า ${seriesItem.name}`,
                  },
                  csv: {
                    filename: `สถานีน้ำท่า ${seriesItem.name}`,
                    columnDelimiter: ',',
                    headerCategory: 'วันที่-เวลา',
                    headerValue: 'ระดับน้ำ (ม.รทก.)',
                    // Formatter สำหรับ csv export (ไม่เกี่ยวกับ label บนกราฟ แต่ช่วยให้ csv มีเวลา)
                    categoryFormatter: (x: any) => {
                      return new Date(x).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      });
                    },
                  }
                },
              },
            },
            title: {
              text: `สถานีน้ำท่า ${seriesItem.name}`,
              align: 'center',
              style: { fontSize: '18px' },
            },
            
            stroke: { width: 3, curve: 'smooth', dashArray: [0, 8] },
            xaxis: {
              type: 'datetime',
              labels: {
                datetimeUTC: false,
                format: 'dd MMM',
                style: { fontSize: '14px' },
              },
            },
            yaxis: {
              max: finalMax,
              min: finalMin,
              labels: {
                formatter: (val: any) => Number(val.toFixed(2)).toLocaleString(),
                style: { fontSize: '14px' },
              },
              title: {
                text: 'ระดับน้ำ (ม.รทก.)',
                style: { fontSize: '16px' },
              },
            },
            tooltip: {
              x: { format: 'dd MMM yyyy HH:mm' },
              y: {
                formatter: (val: any) =>
                  `${Number(val.toFixed(2)).toLocaleString()} ม.รทก.`,
              },
              style: {
                fontSize: '14px',
                fontFamily: 'Prompt'
              }
            },
            annotations: {
              xaxis: tofAnnotation, // ใช้ตัวแปรใหม่
              yaxis: yAxisAnnotations,
            },
          };
          
          return (
            <Grid size={{ xs: 12, sm: 6, md: 6 }} key={index}>
              <Card sx={{ borderRadius: 2, boxShadow: {md:3,xs:0}, my: {md:2,xs:0}, paddingTop: {md:'10px', xs:"5px"} }}>
                <ReactApexChart
                  options={options}
                  series={[
                    { name: `${seriesItem.name} (ค่าตรวจวัดจริง)`, data: normalData },
                    { name: `${seriesItem.name} (ค่าพยากรณ์)`, data: dashedData },
                  ]}
                  type="line"
                  height={350}
                />
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default WaterForecastChart;