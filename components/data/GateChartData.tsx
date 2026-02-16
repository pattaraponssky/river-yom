'use client';

import { Box, Button, Menu, MenuItem } from '@mui/material';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { fontInfo } from '../../theme/style';
import dynamic from 'next/dynamic';

const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DataChartProps {
  data: any; // หรือกำหนด type ให้ละเอียดขึ้นได้
  type: string;
  height?: number;
  sta_code?: string;
  isDark: boolean;
}

const BASE_YEAR = 2000;

const GateChart: React.FC<DataChartProps> = ({ data, type , height = 350 ,sta_code, isDark}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const bgColor = isDark ? "#1e2533" : "#f8fafc"; 
  const textColor = isDark ? "#e2e8f0" : "#334155";         // ตัวอักษรหลัก
  const gridColor = isDark ? "#334155" : "#e2e8f0";  
  if (!data || !data.series) return null;
  

  const gateAnnotations: Record<string, ApexAnnotations> = {
    'T.1': {
      yaxis: [
        { y: 1.70, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 1.70 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
        { y: 0.56, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 0.56 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
        { y: -0.57, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง -0.57 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
      ],
    },
    'T.10': {
      yaxis: [
        { y: 6.32, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 6.32 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
        { y: 5.47, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 5.47 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
        { y: 4.61, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 4.61 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
      ]
    },
    'T.13': {
      yaxis: [  
        { y: 2.69, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 2.69 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
        { y: 2.02, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 2.02 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
        { y: 1.36, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 1.36 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
        ]
    },
    'T.14': {
      yaxis: [
        { y: 1.81, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 1.81 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
        { y: 0.75, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 0.75 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
        { y: -0.31, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง -0.31 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
      ]
    },
    'T.15': {
      yaxis: [
        { y: 2.71, borderColor: '#FF0000', borderWidth: 4, strokeDashArray: 10, label: { text: 'วิกฤต 2.71 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FF0000' } } },
        { y: 1.84, borderColor: '#FFD700', borderWidth: 4, strokeDashArray: 10, label: { text: 'เตือนภัย: 1.84 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: '#FFD700' } } },
        { y: 0.98, borderColor: 'green', borderWidth: 4, strokeDashArray: 10, label: { text: 'เฝ้าระวัง 0.98 ม.รทก.', style: { fontSize: '12px', color: '#fff', background: 'green' } } },
      ]
    },
    '': {
      yaxis: [
      ]
    },
  };

  const chartOptionsMap = {
    discharge: {
      chart: {
        id: 'gate-data',
        zoom: { enabled: true },
        toolbar: { show: true },
        fontFamily: "Prompt", 
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
        labels: { datetimeUTC: false, format: 'dd MMM', },
      },
      yaxis: [
          {
            seriesName: 'อัตราการไหล (ลบ.ม./วินาที)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', color: '#3366FF' },
            },
            title: {
              text: 'อัตราการไหล (ลบ.ม./วินาที)',
              style: { fontSize: '16px', color: '#3366FF' },
            },
          },

        ],

      tooltip: { intersect: false, x: { format: 'dd MMM' } },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','green','#000000','#FFD700'],
    },
    wl_lower: {
      chart: {
        id: 'gate-wl_lower',
        zoom: { enabled: true },
        toolbar: { show: true },
        fontFamily: "Prompt", 
  
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          sizeOffset: 0,
        },
      },
      title: {
        text: 'ระดับน้ำท้าย',
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
            seriesName: 'ระดับน้ำท้าย (ม.รทก.)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', color: '#2196F3' },
            },
            title: {
              text: 'ระดับน้ำท้าย (ม.รทก.)',
              style: { fontSize: '16px', color: '#2196F3' },
            },
          }
        ],
      tooltip: { intersect: false, x: { format: 'dd MMM' } },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','green','#000000','#FFD700'],
    },
    wl_upper: {
      chart: {
        id: 'gate-wl_upper',
        zoom: { enabled: true },
        toolbar: { show: true },
        fontFamily: "Prompt", 
  
      },
      markers: {
        size: 0,
        strokeWidth: 0,
        hover: {
          sizeOffset: 0,
        },
      },
      title: {
        text: 'ระดับน้ำเหนือ',
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
            seriesName: 'ระดับน้ำเหนือ (ม.รทก.)',
            labels: {
              formatter: (val: number) => val.toFixed(2),
              style: { fontSize: '12px', color: '#2196F3' },
            },
            title: {
              text: 'ระดับน้ำเหนือ (ม.รทก.)',
              style: { fontSize: '16px', color: '#2196F3' },
            },
          }
        ],
      tooltip: { intersect: false, x: { format: 'dd MMM' } },
      colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','green','#000000','#FFD700'],
    }
  };


  // เลือก options ตาม type
  const baseOptions = chartOptionsMap[type as 'wl_upper'| 'wl_lower' | 'discharge'] as ApexCharts.ApexOptions;
  const annotations = sta_code && (type === 'wl_upper' || type === 'wl_lower') ? gateAnnotations[sta_code] || { yaxis: [] } : undefined;
  let yaxis = baseOptions.yaxis;

  const options = {
    ...baseOptions,
    ...(annotations && { annotations }),
    ...(yaxis && { yaxis }),
    // responsive: [{
    //         breakpoint: 768, 
    //         options: {
    //             chart: {
    //                 height: 300, // ลดความสูงบนมือถือ
    //             },
    //             title: {
    //                 style: { fontSize: '14px' }, // ลดขนาด Title
    //             },
    //             xaxis: {
    //                 labels: { style: { fontSize: '10px' } }, // ลดขนาด Label แกน X
    //             },
    //             yaxis: [{
    //                 labels: { style: { fontSize: '10px' } }, // ลดขนาด Label แกน Y
    //                 title: { style: { fontSize: '12px' } }, // ลดขนาด Title แกน Y
    //             }],
    //             tooltip: {
    //                 style: { fontSize: '10px' }, // ลดขนาด Tooltip
    //             },
    //             legend: {
    //                 fontSize: '10px', // ลดขนาด Legend
    //             },
    //         }
    //     }],
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

export default GateChart;
