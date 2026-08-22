'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import { fontInfo } from '@/theme/style';
import dynamic from 'next/dynamic';

const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DataChartProps {
  data: any; 
  type: string;
  height?: number;
  sta_code?: string;
  sta_name?: string;
  mode?: 'daily' | 'hourly';
  isDark?: boolean;
}

const BASE_YEAR = 2000;

const flowAnnotations: Record<string, ApexAnnotations> = {
  'YR.01': {
    yaxis: [
      { y: 40.67, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 40.67 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 39.82, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 39.82 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 38.96, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 38.96 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'YR.02': {
    yaxis: [
      { y: 41.57, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 41.57 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 41.23, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 41.23 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 40.89, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 40.89 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'YR.03': {
    yaxis: [  
      { y: 44.37, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 44.37 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 43.98, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 43.98 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 43.60, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 43.60 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      ]
  },
  'YR.04': {
    yaxis: [
      { y: 42.86, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 42.86 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 42.28, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 42.28 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 41.71, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 41.71 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'YR.05': {
    yaxis: [
      { y: 40.30, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 40.30 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 39.46, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 39.46 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 38.62, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 38.62 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'YR.06': {
    yaxis: [
      { y: 39.55, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 39.55 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 39.02, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 39.02 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 38.48, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 38.48 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  '': {
    yaxis: [
    ]
  },
};

// เพิ่มตรงส่วนบน (หลัง flowAnnotations หรือใกล้ ๆ)
const flowDischargeAnnotations: Record<string, ApexAnnotations> = {
  'Y.4': {
    yaxis: [
      { y: 600, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 600 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 450, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 450 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 320, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 320 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  }
};

const flowWaterLevelYAxisRange: Record<string, { min: number; max: number }> = {
  'YR.01': { min: 32, max: 41 },
  'YR.02': { min: 33, max: 43 },
  'YR.03': { min: 36, max: 46 },
  'YR.04': { min: 35, max: 44 },
  'YR.05': { min: 32, max: 42 },
  'YR.06': { min: 32, max: 41 },
};

const FlowChart: React.FC<DataChartProps> = ({ data, type, height = 350 ,sta_code ,sta_name, mode = 'daily', isDark }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const bgColor = isDark ? "#1e2533" : "#f8fafc"; 
  const textColor = isDark ? "#e2e8f0" : "#334155";         // ตัวอักษรหลัก
  const gridColor = isDark ? "#334155" : "#e2e8f0";         // เส้น grid

  if (!data || !data.series) return null;

  const chartOptionsMap = {
    discharge: {
      chart: {
        id: 'flow-data',
        zoom: { enabled: true },
        // toolbar: { show: false },
        background: bgColor,
        fontFamily: "Prompt",
        foreColor: textColor,
        stacked: false,
      },
      title: {
        text: 'อัตราการไหล',
        align: "center" as const,
        style: {
          fontSize: '16px',
          color: '#333',
          fontFamily: 'Prompt',
        },
      },
      stroke: {
        width: Array(20).fill(4),
        dashArray:  Array(20).fill(0),
        curve: 'smooth' as const,
      },  
      xaxis: {
        type: 'datetime',
        min: new Date(`${BASE_YEAR}-01-01`).getTime(),
        max: new Date(`${BASE_YEAR}-12-31`).getTime(),
        labels: { datetimeUTC: false, format: 'dd MMM', style: { colors: textColor } },
        axisBorder: { show: false },
        axisTicks: { color: gridColor },
      },
      yaxis: [
          {
            seriesName: 'อัตราการไหล (ลบ.ม./วินาที)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', colors: textColor },
            },
            title: {
              text: 'อัตราการไหล (ลบ.ม./วินาที)',
              style: { fontSize: '16px', colors: textColor },
            },
          },

        ],

      tooltip: {  enabled: true, intersect: true,shared: false,followCursor: false, x: { format: 'dd MMM HH:mm' } },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','#FFD700','#000000','orange'],
    },
    wl: {
      chart: {
        id: 'flow-wl',
        zoom: { enabled: true },
        toolbar: { show: true },
        background: bgColor,
        fontFamily: "Prompt",
        foreColor: textColor,
  
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          sizeOffset: 0,
        },
      },
      title: {
        text: 'ระดับน้ำ',
        align: "center" as const,
        style: {
          fontSize: '18px',
          color: '#333',
          fontFamily: 'Prompt',
        },
      },
      stroke: {
        width: Array(20).fill(4),
        dashArray:  Array(20).fill(0),
        curve: 'smooth' as const,
      },
      xaxis: {
        type: 'datetime',
        min: new Date(`${BASE_YEAR}-01-01`).getTime(),
        max: new Date(`${BASE_YEAR}-12-31`).getTime(),
        labels: { datetimeUTC: false, format: 'dd MMM', },
      },
      yaxis: [
          {
            seriesName: 'ระดับน้ำ (ม.รทก.)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', color: '#2196F3' },
            },
            title: {
              text: 'ระดับน้ำ (ม.รทก.)',
              style: { fontSize: '16px', color: '#2196F3' },
            },
          }
        ],
      tooltip: { intersect: false, x: { format: 'dd MMM HH:mm' } },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','#FFD700','#000000','orange'],
    },
    rain_sum: {
      chart: {
        id: 'rain-data',
        zoom: { enabled: true },
        background: bgColor,
        fontFamily: "Prompt",
        foreColor: textColor,
        stacked: false,
      },
      title: {
        text: 'ปริมาณฝนสะสม',
        align: "center" as const,
        style: {
          fontSize: '18px',
          color: textColor,
          fontFamily: 'Prompt',
        },
      },
      stroke: {
          width: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], 
        dashArray: [0, 0, 0, 0, 0, 0,0, 0, 0, 0, 0, 0, 0, 0,0, 0, 0], 
        curve: 'smooth' as const,
      },  
      xaxis: {
        type: 'datetime',
        min: new Date(`${BASE_YEAR}-01-01`).getTime(),
        max: new Date(`${BASE_YEAR}-12-31`).getTime(),
        labels: { datetimeUTC: false, format: 'dd MMM', style: { colors: textColor }},
        axisBorder: { show: false },
        axisTicks: { color: gridColor },
      },
      yaxis: [
        
          {
            seriesName: 'ปริมาณน้ำฝนสะสม (มม.)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', color: textColor },
            },
            title: {
              text: 'ปริมาณน้ำฝนสะสม (มม.)',
              style: { fontSize: '16px', color: textColor },
            },
          },
        ],
    
        tooltip: {
          shared: true,        // แสดง tooltip หลาย series พร้อมกัน
          intersect: false,    // ไม่จำเป็นต้องชี้ตรงจุดพอดี
          x: { format: 'dd MMM' },
          y: {
            formatter: (val: number) => `${val.toFixed(2).toLocaleString()} มม.`,
          },
        },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','#009966','#000000','#333399'],
    },
    rain: {
      chart: {
        id: 'rain-rain',
        zoom: { enabled: true },
        toolbar: { show: true },
        background: bgColor,
      fontFamily: "Prompt",
      foreColor: textColor,
  
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          sizeOffset: 0,
        },
      },
      
      title: {
        text: 'ปริมาณฝนรายวัน',
        align: "center" as const,
        style: {
          fontSize: '18px',
          color: textColor,
          fontFamily: 'Prompt',
        },
      },
      stroke: {
        width: Array(20).fill(2),
        dashArray:  Array(20).fill(0),
        curve: 'smooth' as const,
      },
      xaxis: {
        type: 'datetime',
        min: new Date(`${BASE_YEAR}-01-01`).getTime(),
        max: new Date(`${BASE_YEAR}-12-31`).getTime(),
        labels: { datetimeUTC: false, format: 'dd MMM', style: { colors: textColor }},
        axisBorder: { show: false },
        axisTicks: { color: gridColor },
      },
      yaxis: [
          {
            seriesName: 'ปริมาณน้ำฝน (มม.)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', color: textColor },
            },
            title: {
              text: 'ปริมาณน้ำฝน (มม.)',
              style: { fontSize: '16px', color: textColor },
            },
          }
        ],
        tooltip: {
          shared: true,        // แสดง tooltip หลาย series พร้อมกัน
          intersect: false,    // ไม่จำเป็นต้องชี้ตรงจุดพอดี
          x: { format: 'dd MMM' },
          y: {
            formatter: (val: number) => `${val.toFixed(2).toLocaleString()} มม.`,
          },
        },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','#009966','#000000','#333399'],
    },
  };

  // เลือก options ตาม type
  const baseOptions = chartOptionsMap[type as 'wl' | 'discharge' | 'rain_sum' | 'rain'] as ApexCharts.ApexOptions;
  let annotations: ApexAnnotations | undefined;
  if (type === 'wl') {
    annotations = sta_code ? flowAnnotations[sta_code] || { yaxis: [] } : undefined;
  } else if (type === 'discharge') {
    annotations = sta_code ? flowDischargeAnnotations[sta_code] || { yaxis: [] } : undefined;
  }
  let yaxis = baseOptions.yaxis;

  if (type === 'wl' && sta_code && flowWaterLevelYAxisRange[sta_code]) {
    yaxis = [{
      ...(Array.isArray(baseOptions.yaxis) ? baseOptions.yaxis[0] : baseOptions.yaxis),
      min: flowWaterLevelYAxisRange[sta_code].min,
      max: flowWaterLevelYAxisRange[sta_code].max,
    }];
  }

  const options = {
    ...baseOptions,
    ...(annotations && { annotations }),
    ...(yaxis && { yaxis }),
    tooltip: {
      shared: true,
      intersect: false,
      x: {
        format: mode === 'hourly' 
          ? 'dd MMM HH:mm' 
          : 'dd MMM'  // รายวัน → ไม่แสดงเวลาเลย
      },
      y: {
        formatter: (val: number) => 
          type === 'wl' 
            ? `${val.toFixed(2)} ม.รทก.` 
            : `${val.toFixed(1)} ลบ.ม./วินาที`
      }
    },
    
  };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleClose = () => {
      setAnchorEl(null);
    };
  
  
  const handleExport = async (format: "png" | "jpg" | "jpeg" | "pdf") => {
    handleClose();
    const chartElement = document.getElementById("chart-container");
    if (!chartElement) return;

    // สร้าง canvas จาก html2canvas
    const canvas = await html2canvas(chartElement);

    // สำหรับ png / jpg / jpeg
    if (format === "png" || format === "jpg" || format === "jpeg") {
      const imgData =
        format === "jpg" || format === "jpeg"
          ? canvas.toDataURL("image/jpeg", 1.0)
          : canvas.toDataURL("image/png", 1.0);

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `chart_${sta_code}_${sta_name}.${format}`;
      link.click();
    }

    else if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png"); // pdf ต้องใช้ PNG
      const pdf = new jsPDF("landscape");
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`chart_${sta_code}_${sta_name}.pdf`);
    }
  };

  return (
    <Box position="relative">
      <Box
        position="absolute"
        top={{ xs: 22, sm: 0 }}    // xs เลื่อนลง 22px, sm+ อยู่บนสุด
        left={{ xs: '50%', sm: 10, md: 'auto' }}  // xs กึ่งกลาง, sm+ ซ้าย/right ตามต้องการ
        right={{ xs: 'auto', sm: 'auto', md: 150 }}
        zIndex={10}
        sx={{
          display:{md:"block",sm:"none",xs:"none"},
          transform: { xs: 'translateX(-50%)', sm: 'none' } // xs กึ่งกลาง, sm+ ไม่ต้องแปลง
        }}
      >
        <Button
          variant="contained"
          color="success"
          onClick={handleClick}
          endIcon={<ArrowDropDownIcon />}
          sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
        >
          Export Chart
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          <MenuItem sx={fontInfo} onClick={() => handleExport("png")}>
            <TableChartIcon sx={{ mr: 1 }} />
            Export PNG
          </MenuItem>
          <MenuItem sx={fontInfo} onClick={() => handleExport("jpg")}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export JPG
          </MenuItem>
          <MenuItem sx={fontInfo} onClick={() => handleExport("jpeg")}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export JPEG
          </MenuItem>
          <MenuItem sx={fontInfo} onClick={() => handleExport("pdf")}>
            <TextSnippetIcon sx={{ mr: 1 }} />
            Export PDF
          </MenuItem>
        </Menu>

      </Box>

      {/* กราฟ */}
      <div id="chart-container">
        <ApexCharts
          options={options}
          series={data.series}
          type="line"
          height={height}
        />
      </div>
    </Box>
  );
};

export default FlowChart;
