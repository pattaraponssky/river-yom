'use client';

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { Box, Button, Menu, MenuItem, useTheme } from '@mui/material';
import { fontInfo } from '@/theme/style';
import dynamic from 'next/dynamic';

const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DataChartProps {
  data: any; // หรือกำหนด type ให้ละเอียดขึ้นได้
  type: string;
  height?: number;
  sta_code?: string;
  mode?: 'daily' | 'hourly';
  isDark?: boolean;
}

const BASE_YEAR = 2000;

const flowAnnotations: Record<string, ApexAnnotations> = {
  'Y.50': {
    yaxis: [
      { y: 1.50, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 1.50 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 1.38, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 1.38 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      { y: 1.25, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 1.25 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
    ],
  },
  'Y.15': {
    yaxis: [
      { y: 3.50, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 3.50 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 3.20, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 3.20 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      { y: 2.90, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 2.90 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
    ]
  },
  'Y.16': {
    yaxis: [  
      { y: 2.40, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 2.40 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 2.28, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 2.28 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      { y: 2.16, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 2.16 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
      ]
  },
  'Y.64': {
    yaxis: [
      { y: 1.50, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 1.50 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 1.35, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 1.35 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      { y: 1.20, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 1.20 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
    ]
  },
  'Y.4': {
    yaxis: [
      { y: 1.80, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 1.80 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
      { y: 1.70, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 1.70 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
      { y: 1.60, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 1.60 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
    ]
  },
  '': {
    yaxis: [
    ]
  },
};


const flowYAxisRange: Record<string, { min: number; max: number }> = {
  'Y.50': { min: -10, max: 2 },
  'Y.15': { min: -2.5, max: 7 },
  'Y.16': { min: -4, max: 3 },
  'Y.64': { min: -9, max: 2 },
  'Y.4': { min: -6, max: 3 },
};

const FlowChart: React.FC<DataChartProps> = ({ data, type, height = 350 ,sta_code ,mode = 'daily', isDark }) => {
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
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','green','#000000','#FFD700'],
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
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','green','#000000','#FFD700'],
    }
  };

  // เลือก options ตาม type
  const baseOptions = chartOptionsMap[type as 'wl' | 'discharge'] as ApexCharts.ApexOptions;
  const annotations = sta_code && type === 'wl' ? flowAnnotations[sta_code] || { yaxis: [] } : undefined;
  let yaxis = baseOptions.yaxis;
  if (type === 'wl' && sta_code && flowYAxisRange[sta_code]) {
    yaxis = [{
      ...(Array.isArray(baseOptions.yaxis) ? baseOptions.yaxis[0] : baseOptions.yaxis),
      min: flowYAxisRange[sta_code].min,
      max: flowYAxisRange[sta_code].max,
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
      link.download = `chart.${format}`;
      link.click();
    }

    else if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png"); // pdf ต้องใช้ PNG
      const pdf = new jsPDF("landscape");
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("chart.pdf");
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
