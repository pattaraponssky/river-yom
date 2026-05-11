import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Box, Typography, Grid, ToggleButton, ToggleButtonGroup,
  useTheme 
} from '@mui/material';
import { ApexOptions } from 'apexcharts';
import dynamic from "next/dynamic";
import CenteredLoading from '@/components/Layout/CenteredLoading';
import { titleStyle } from '@/theme/style';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const stationMapping: Record<string, number> = {
  "Y.15": 170764,
  "Y.16": 142824,
  "Y.64": 125488,
  "Y.17": 84876,
  "01": 170764,
  "02": 142824,
};

interface waterData {
  CrossSection: number;
  Date: string | null;
  WaterLevel: number;
}

interface ThresholdData {
  staCode: string;
  location: string;
  tambon: string;
  watch: number;
  alert: number;
  crisis: number;
  maxY: number;
}

const thresholdData: ThresholdData[] = [
  {
    staCode: 'Y.15',
    location: 'วัดพระรูป',
    tambon: 'ต.ในเมือง อ.เมือง จ.พิษณุโลก',
    watch: 2.90,
    alert: 3.20,
    crisis: 3.50,
    maxY: 3.5,
  },
  {  
    staCode: 'Y.16',
    location: 'บ้านบางการ้อง',
    tambon: 'ต.บางการ้อง อ.เมือง จ.พิษณุโลก',
    watch: 2.16,
    alert: 2.28,
    crisis: 2.40,
    maxY: 2.40,
  },
   {
    staCode: 'Y.4',
    location: 'บ้านบางไทรป่า',
      tambon: 'ต.บางไทรป่า อ.เมือง จ.พิษณุโลก',
    watch: 1.60,
    alert: 1.70,
    crisis: 1.80,
    maxY: 1.80,
  },
  {
    staCode: 'Y.50',
    location: 'ที่ว่าการอำเภอ',
    tambon: 'ต.ในเมือง อ.เมือง จ.พิษณุโลก',
    watch: 1.25,
    alert: 1.38,
    crisis: 1.50,
    maxY: 1.50,
  },
  {
    staCode: 'Y.64',
    location: 'ตลาดสามพราน',
    tambon: 'ต.ในเมือง อ.เมือง จ.พิษณุโลก',
    watch: 1.20,
    alert: 1.35,
    crisis: 1.50,
    maxY: 1.50,
  },
  {
    staCode: 'Y.17',
    location: 'บ้านสามง่าม',
    tambon: 'ต.สามง่าม อ.สามง่าม จ.พิจิตร',
    watch: 2.90,
    alert: 3.20,
    crisis: 3.50,
    maxY: 3.5,
  },
  {  
    staCode: '01',
    location: 'สะพานชุมแสงสงคราม',
    tambon: 'ต.ชุมแสงสงคราม อ.บางระกำ จ.พิษณุโลก',
    watch: 2.16,
    alert: 2.28,
    crisis: 2.40,
    maxY: 2.40,
  },
   {  
    staCode: '02',
    location: 'สะพานบ้านห้วงกระได',
    tambon: 'ต.บางระกำ อ.บางระกำ จ.พิษณุโลก',
    watch: 2.16,
    alert: 2.28,
    crisis: 2.40,
    maxY: 2.40,
  },
];

const thresholdMap = new Map<string, ThresholdData>(
  thresholdData.map(item => [item.staCode, item])
);

interface Props {
  data: waterData[];
}

type ViewMode = 'all' | 'single';

const WaterForecastChart: React.FC<Props> = ({ data }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [viewMode, setViewMode] = useState<ViewMode>('all'); // 'all' หรือ 'single'
  const [selectedStation, setSelectedStation] = useState<string>("Y.15");
  const [loading, setLoading] = useState<boolean>(true);

  const tofTime = useMemo(() => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today.getTime();
  }, []);

  // ==================== ข้อมูลสำหรับโหมด Single ====================
  const singleChartData = useMemo(() => {
    const crossSectionId = stationMapping[selectedStation];
    if (!crossSectionId) return { name: selectedStation, data: [] };

    const today = new Date();
    const start = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const filtered = data
      .filter(d => {
        if (!d.Date) return false;
        const dTime = new Date(d.Date);
        return d.CrossSection === crossSectionId && dTime >= start && dTime <= end;
      })
      .sort((a, b) => new Date(a.Date!).getTime() - new Date(b.Date!).getTime())
      .map(d => ({ x: d.Date!, y: parseFloat(d.WaterLevel.toFixed(2)) }));

    return { name: selectedStation, data: filtered };
  }, [data, selectedStation]);

  const normalData = singleChartData.data.filter(d => new Date(d.x).getTime() < tofTime);
  const dashedData = singleChartData.data.filter(d => new Date(d.x).getTime() >= tofTime);
  

  // ==================== Options สำหรับกราฟ ====================
  const getChartOptions = (stationCode: string, chartData: any): ApexOptions => {
    const thresholds = thresholdMap.get(stationCode);
    const maxData = chartData.length > 0 ? Math.max(...chartData.map((d: any) => d.y)) : 0;
    const minData = chartData.length > 0 ? Math.min(...chartData.map((d: any) => d.y)) : 0;

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
        borderColor: 'orange', // Yellow/Amber
        borderWidth: 2,
        label: { 
          borderColor: 'orange',
          style: { color: '#fff', background: 'orange', fontSize: '12px' ,fontWeight: 600 },
        },
      });
        yAxisAnnotations.push({
        y: thresholds.watch,
        borderColor: '#FFD700', // Yellow/Amber
        borderWidth: 2,
        label: {
          borderColor: '#FFD700',
          style: { color: '#fff', background: '#FFD700', fontSize: '12px' ,fontWeight: 600 },
        },
      });
    }

    const baseMax = Math.max(maxData, thresholds?.crisis ?? 0, thresholds?.maxY ?? 0);
    const finalMax = baseMax + 0.3;
    const finalMin = Math.max(0, minData - 0.2);

    return {
      chart: {
        background: isDark ? "#1e2533" : "#f8fafc",
        fontFamily: "Prompt",
        foreColor: isDark ? "#e2e8f0" : "#334155",
        type: 'line',
        height: 420,
        zoom: { enabled: false },
        toolbar: { show: true },
      },
      title: {
        text: `สถานี ${stationCode} - ${thresholds?.location || ''}`,
        align: 'center',
        style: { fontSize: '18px', fontWeight: 700 },
      },
      stroke: { width: 3, curve: 'smooth', dashArray: [0, 8] },
      xaxis: { type: 'datetime', labels: { format: 'dd MMM' } },
      yaxis: {
        min: finalMin,
        max: finalMax,
        labels: { formatter: (val: number) => val.toFixed(2) },
        title: { text: 'ระดับน้ำ (ม.รทก.)' },
      },
      tooltip: {
        x: { format: 'dd MMM yyyy HH:mm' },
        y: { formatter: (val: number) => `${val.toFixed(2)} ม.รทก.` },
      },
      annotations: {
        xaxis: [{ x: tofTime, borderColor: '#FF0000',   
                label: {
                  position: 'top',
                  offsetY: -10,
                  borderColor: '#000',
                  style: {
                    color: '#fff',
                    background: '#FF0000',
                    fontSize: '14px',
                  },
                  text: 'TOF', // เปลี่ยนข้อความเพื่อให้ชัดเจนขึ้น
                }, }],
        yaxis: yAxisAnnotations ? yAxisAnnotations : [],
      },
      legend: { show: true, position: 'top' },
    };
  };

  useEffect(() => {
    if (data?.length > 0) setLoading(false);
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

          {/* ปุ่มสลับโหมด */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              aria-label="view mode"
            >
              <ToggleButton value="all">แสดงทั้งหมด</ToggleButton>
              <ToggleButton value="single">เลือกรายสถานี</ToggleButton>
            </ToggleButtonGroup>
          </Box>
  
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{ width: 50, height: 4, backgroundColor: '#1E88E5', mr: 1 }} />
              <Typography sx={{ fontFamily: 'Prompt', mr: 2 }}>ค่าตรวจวัดจริง</Typography>
  
              <Box sx={{ width: 50, height: 0, borderTop: '4px dashed #66BB6A', mr: 1 }} />
              <Typography sx={{ fontFamily: 'Prompt' }}>ค่าพยากรณ์</Typography>
          </Box>
        </Box>

      

      {/* ==================== โหมดแสดงทั้งหมด ==================== */}
      {viewMode === 'all' && (
        <Grid container spacing={2}>
          {Object.keys(stationMapping).map((code) => {
            const crossId = stationMapping[code];
            const stationData = data
              .filter(d => d.CrossSection === crossId)
              .sort((a, b) => new Date(a.Date!).getTime() - new Date(b.Date!).getTime())
              .map(d => ({ x: d.Date!, y: parseFloat(d.WaterLevel.toFixed(2)) }));

            const normal = stationData.filter(d => new Date(d.x).getTime() < tofTime);
            const forecast = stationData.filter(d => new Date(d.x).getTime() >= tofTime);

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={code}>
                <Card sx={{ borderRadius: 2, boxShadow: 2, p: 1 }}>
                  <ReactApexChart
                    options={getChartOptions(code, stationData)}
                    series={[
                      { name: "ค่าตรวจวัดจริง", data: normal },
                      { name: "ค่าพยากรณ์", data: forecast },
                    ]}
                    type="line"
                    height={380}
                  />
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ==================== โหมดเลือกทีละสถานี ==================== */}
      {viewMode === 'single' && (
        <>
          {/* การ์ดเลือกสถานี */}
          <Box sx={{ mb: 4 }}>
            {/* <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', fontFamily: 'Prompt' }}>
              เลือกสถานี
            </Typography> */}
            <Grid container spacing={2}>
              {Object.keys(stationMapping).map((code) => {
                const info = thresholdMap.get(code);
                const isSelected = selectedStation === code;

                return (
                  <Grid size={{ xs: 6, sm: 4, md: 4 }} key={code}>
                    <Card
                      onClick={() => setSelectedStation(code)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: isSelected ? '3px solid #1976d2' : '1px solid #e0e0e0',
                        bgcolor: isSelected ? (isDark ? '#1e3a5f' : '#e3f2fd') : 'background.paper',
                        boxShadow: isSelected ? 6 : 2,
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
                      }}
                    >
                      <Box sx={{ p: 2.5, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={700}>
                          {code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {info?.location}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {info?.tambon}
                        </Typography>
                        {/* {isSelected && (
                          <Typography sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}>
                            ● กำลังแสดง
                          </Typography>
                        )} */}
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* กราฟเดี่ยว */}
          <Card>
            <ReactApexChart
              options={getChartOptions(selectedStation, singleChartData.data)}
              series={[
                { name: "ค่าตรวจวัดจริง", data: normalData },
                { name: "ค่าพยากรณ์ (7 วัน)", data: dashedData },
              ]}
              type="line"
              height={420}
            />
          </Card>
        </>
      )}
    </Box>
  );
};

export default WaterForecastChart;