import { Box,MenuItem, Button, Menu } from '@mui/material';
import React, { useState } from 'react';
import ApexCharts from 'react-apexcharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import { menuStyle } from '../../theme/style';

interface DataChartProps {
  data: any;
  type: string;
  height?: number;
  resCode?: string;
}

const BASE_YEAR = 2000;

const reservoirAnnotations: Record<string, ApexAnnotations> = {
  'ks': {
    yaxis: [
      { y: 40, borderColor: '#CC3333', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักต่ำสุด 40 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#CC3333' } } },
      { y: 299, borderColor: '#333399', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักปกติ 299 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#333399' } } },
      { y: 390, borderColor: '#009966', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักสูงสุด 390 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#009966' } } },
    ],
  },
  'htd': {
    yaxis: [
      { y: 0.2, borderColor: '#CC3333', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักต่ำสุด 0.2 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#CC3333' } } },
      { y: 2.8, borderColor: '#333399', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักปกติ 2.8 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#333399' } } },
      // { y: 390, borderColor: '#009966', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักสูงสุด 390 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#009966' } } },
    ]
  },
  'hkk': {
    yaxis: [  
      { y: 2.17, borderColor: '#CC3333', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักต่ำสุด 2.17 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#CC3333' } } },
      { y: 52, borderColor: '#333399', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักปกติ 52 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#333399' } } },
      // { y: 390, borderColor: '#009966', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักสูงสุด 390 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#009966' } } },
      ]
  },
  'ht': {
    yaxis: [
      { y: 3.7, borderColor: '#CC3333', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักต่ำสุด 3.7 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#CC3333' } } },
      { y: 6.9, borderColor: '#333399', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักปกติ 6.9 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#333399' } } },
      { y: 10.2, borderColor: '#009966', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักสูงสุด 10.2 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#009966' } } },
    ]
  },
  'hnl': {
    yaxis: [
      { y: 11.39, borderColor: '#CC3333', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักต่ำสุด 11.39 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#CC3333' } } },
      { y: 11, borderColor: '#333399', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักปกติ 11 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#333399' } } },
      { y: 15, borderColor: '#009966', borderWidth: 4, strokeDashArray: 10, label: { text: 'ปริมาณน้ำเก็บกักสูงสุด 15 ล้าน ลบ.ม.', style: { fontSize: '12px', color: '#fff', background: '#009966' } } },
    ]
  },
};

const reservoirYAxisRange: Record<string, { min: number; max: number }> = {
  ks: { min: 0, max: 400 },
  htd: { min: 0, max: 4 },
  hkk: { min: 0, max: 60 },
  ht: { min: 0, max: 11 },
  hnl: { min: 0, max: 16 },
};

const chartOptionsMap = {
  main: {
    chart: {
      id: 'reservoir',
      zoom: { enabled: true, allowMouseWheelZoom: false },
      fontFamily: "Prompt",
      // stacked: false,
    },
    title: {
      text: 'ปริมาณน้ำในอ่างเก็บน้ำ',
      align: "center",
      style: { fontSize: '16px', color: '#333', fontFamily: 'Prompt' },
    },
    stroke: {
      width: Array(13).fill(3),
      curve: 'smooth',
      dashArray: Array(13).fill(0),
    },
    xaxis: {
      type: 'datetime',
      min: new Date(`${BASE_YEAR}-01-01`).getTime(),
      max: new Date(`${BASE_YEAR}-12-31`).getTime(),
      labels: { datetimeUTC: false, format: 'dd MMM', style: { fontSize: '12px', color: '#333' } },
    },
    yaxis: [{
      seriesName: 'ปริมาณน้ำ (Volume)',
      labels: { formatter: (val: number) => (val.toFixed(2)), style: { fontSize: '12px', color: '#333' } },
      title: { text: 'ปริมาณน้ำ (ล้าน ลบ.ม.)', style: { fontSize: '16px', color: '#333' } },
    }],
    
    tooltip: {
      shared: true,        // แสดง tooltip หลาย series พร้อมกัน
      intersect: false,    // ไม่จำเป็นต้องชี้ตรงจุดพอดี
      x: { format: 'dd MMM' },
      y: {
        formatter: (val: number) => `${val.toFixed(2).toLocaleString()} ล้าน ลบ.ม.`,
      },
    },
    colors: ['#3366FF', '#FF0033', '#00FF33', '#CD853F', '#FF9900', '#66CCFF', '#9933FF', '#009966', '#000000', '#333399'],
  },
  inflow: {
    chart: {
      id: 'reservoir-inflow',
      zoom: { enabled: true, allowMouseWheelZoom: false },
      type: 'line',
      fontFamily: "Prompt",
    },
    title: {
      text: 'ปริมาณน้ำไหลเข้าอ่างเก็บน้ำ',
      align: "center",
      style: { fontSize: '16px', color: '#333', fontFamily: 'Prompt' },
    },
    stroke: {
      width: Array(13).fill(3),
      curve: 'smooth',
      dashArray: Array(13).fill(0),
    },
    xaxis: {
      type: 'datetime',
      min: new Date(`${BASE_YEAR}-01-01`).getTime(),
      max: new Date(`${BASE_YEAR}-12-31`).getTime(),
      labels: { datetimeUTC: false, format: 'dd MMM', },
    },
    yaxis: [{
      seriesName: 'ปริมาณน้ำไหลเข้าอ่าง (ล้าน ลบ.ม.)',
      labels: { formatter: (val: number) => (val.toFixed(2)), style: { fontSize: '12px', color: '#333' } },
      title: { text: 'ปริมาณน้ำไหลเข้าอ่าง (ล้าน ลบ.ม.)', style: { fontSize: '14px', color: '#333' } },
    }],
    tooltip: {
      shared: true,        // แสดง tooltip หลาย series พร้อมกัน
      intersect: false,    // ไม่จำเป็นต้องชี้ตรงจุดพอดี
      x: { format: 'dd MMM' },
      y: {
        formatter: (val: number) => `${val.toFixed(2).toLocaleString()} ล้าน ลบ.ม.`,
      },
    },
    colors: ['#3366FF', '#FF0033', '#00FF33', '#CD853F', '#FF9900', '#66CCFF', '#9933FF', '#009966', '#000000', '#333399'],
  },
  outflow: {
    chart: {
      id: 'reservoir-outflow',
      zoom: { enabled: true, allowMouseWheelZoom: false },
      type: 'line',
      fontFamily: "Prompt",
    },
    title: {
      text: 'ปริมาณน้ำระบายออกอ่างเก็บน้ำ',
      align: "center",
      style: { fontSize: '16px', color: '#333', fontFamily: 'Prompt' },
    },
    stroke: {
      width: Array(13).fill(3),
      curve: 'smooth',
      dashArray: Array(13).fill(0),
    },
    xaxis: {
      type: 'datetime',
      min: new Date(`${BASE_YEAR}-01-01`).getTime(),
      max: new Date(`${BASE_YEAR}-12-31`).getTime(),
      labels: { datetimeUTC: false, format: 'dd MMM', },
    },
    yaxis: [{
      seriesName: 'ปริมาณน้ำระบาย (ล้าน ลบ.ม.)',
      labels: { formatter: (val: number) => val.toFixed(2), style: { fontSize: '12px', color: '#333' } },
      title: { text: 'ปริมาณน้ำระบาย (ล้าน ลบ.ม.)', style: { fontSize: '14px', color: '#333' } },
    }],
    tooltip: {
      shared: true,        // แสดง tooltip หลาย series พร้อมกัน
      intersect: false,    // ไม่จำเป็นต้องชี้ตรงจุดพอดี
      x: { format: 'dd MMM' },
      y: {
        formatter: (val: number) => `${val.toFixed(2).toLocaleString()} ล้าน ลบ.ม.`,
      },
    },
    
    colors: ['#3366FF', '#FF0033', '#00FF33', '#CD853F', '#FF9900', '#66CCFF', '#9933FF', '#009966', '#000000', '#333399'],
  },
  
};

const ReservoirChart: React.FC<DataChartProps> = ({ data, type = 'main', height = 350, resCode }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  if (!data || !data.series) return null;

  const baseOptions = chartOptionsMap[type as 'main' | 'inflow' | 'outflow'] as ApexCharts.ApexOptions;
  const annotations = resCode && type === 'main' ? reservoirAnnotations[resCode] || { yaxis: [] } : undefined;

  let yaxis = baseOptions.yaxis;
  if (type === 'main' && resCode && reservoirYAxisRange[resCode]) {
    yaxis = [{
      ...(Array.isArray(baseOptions.yaxis) ? baseOptions.yaxis[0] : baseOptions.yaxis),
      min: reservoirYAxisRange[resCode].min,
      max: reservoirYAxisRange[resCode].max,
    }];
  }

  const options = {
    ...baseOptions,
    ...(annotations && { annotations }),
    ...(yaxis && { yaxis }),
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
          <MenuItem sx={menuStyle} onClick={() => handleExport("png")}>
            <TableChartIcon sx={{ mr: 1 }} />
            Export PNG
          </MenuItem>
          <MenuItem sx={menuStyle} onClick={() => handleExport("jpg")}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export JPG
          </MenuItem>
          <MenuItem sx={menuStyle} onClick={() => handleExport("jpeg")}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export JPEG
          </MenuItem>
          <MenuItem sx={menuStyle} onClick={() => handleExport("pdf")}>
            <TextSnippetIcon sx={{ mr: 1 }} />
            Export PDF
          </MenuItem>
        </Menu>

      </Box>

      {/* กราฟ */}
      <div id="chart-container">
        <ApexCharts options={options} series={data.series} height={height} />
      </div>
    </Box>
  );
};

export default ReservoirChart;