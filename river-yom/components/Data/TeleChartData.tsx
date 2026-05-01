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
  'Y.4': {
    yaxis: [
      { y: 51.4, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 51.4 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 50.5, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 50.5 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 49.6, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 49.6 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'Y.15': {
    yaxis: [
      { y: 46.0, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 46.0 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 44.7, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 44.7 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 43.5, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 43.5 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'Y.50': {
    yaxis: [  
      { y: 41.5, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 41.5 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 40.5, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 40.5 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 39.5, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 39.5 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      ]
  },
  'Y.16': {
    yaxis: [
      { y: 39.3, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 39.3 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 38.4, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 38.4 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 37.6, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 37.6 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'Y.64': {
    yaxis: [
      { y: 38.0, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 38.0 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 37.3, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 37.3 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 36.7, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 36.7 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'Y.51': {
    yaxis: [
      { y: 42.0, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 42.0 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 40.4, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 40.4 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 38.8, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 38.8 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ]
  },
  'Y.17': {
    yaxis: [
      { y: 41.8, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 41.8 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 40.6, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 40.6 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'orange' } } },
      { y: 39.4, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 39.4 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
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
  },
  'Y.15': {
    yaxis: [
      { y: 500, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 500 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 400, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 400 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 250, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 250 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'Y.50': {
    yaxis: [
      { y: 350, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 350 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 300, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 300 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 250, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 250 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'Y.16': {
    yaxis: [
      { y: 260, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 260 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 220, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 220 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 180, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 180 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'Y.64': {
    yaxis: [
      { y: 300, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 300 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 240, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 240 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 180, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 180 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'Y.51': {
    yaxis: [
      { y: 900, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 900 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 800, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 800 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 530, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 530 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  'Y.17': {
    yaxis: [
      { y: 850, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต > 850 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 720, borderColor: 'orange', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 720 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#000', background: 'orange' } } },
      { y: 600, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 600 ลบ.ม./วินาที', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
    ],
  },
  '': { yaxis: [] },
};

const flowWaterLevelYAxisRange: Record<string, { min: number; max: number }> = {
  'Y.4': { min: 42, max: 53 },
  'Y.15': { min: 33, max: 48 },
  'Y.16': { min: 30, max: 44 },
  'Y.50': { min: 34, max: 44 },
  'Y.64': { min: 33, max: 43 },
  'Y.51': { min: 32, max: 44 },
  'Y.17': { min: 30, max: 42 },
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
        labels: { datetimeUTC: false, format: 'dd MMM HH:mm', style: { colors: textColor } },
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
    }
  };

  // เลือก options ตาม type
  const baseOptions = chartOptionsMap[type as 'wl' | 'discharge'] as ApexCharts.ApexOptions;
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
