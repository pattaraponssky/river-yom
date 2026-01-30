import { Box, Button, Menu, MenuItem } from '@mui/material';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useState } from 'react';
import ApexCharts from 'react-apexcharts';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { fontInfo } from '@/theme/style';

interface DataChartProps {
  data: any; // หรือกำหนด type ให้ละเอียดขึ้นได้
  type: string;
  height?: number;
  isDark: boolean;
}

const BASE_YEAR = 2000;


const RainChart: React.FC<DataChartProps> = ({ data, type = 'rain', height = 350, isDark }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const bgColor = isDark ? "#1e2533" : "#f8fafc"; 
    const textColor = isDark ? "#e2e8f0" : "#334155";         // ตัวอักษรหลัก
    const gridColor = isDark ? "#334155" : "#e2e8f0";  
  if (!data || !data.series) return null;


  const chartOptionsMap = {
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
    }
  };
  // เลือก options ตาม type
  const baseOptions = chartOptionsMap[type as 'rain' | 'rain_sum'] as ApexCharts.ApexOptions;

   const options = {
    ...baseOptions,
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

export default RainChart;
