import React, { useState } from 'react';
import ApexCharts from 'react-apexcharts';
import { Box, Button, Menu, MenuItem } from '@mui/material';
import { ArrowDropDownIcon } from '@mui/x-date-pickers';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

interface DataChartProps {
  data: any; // หรือกำหนด type ให้ละเอียดขึ้นได้
  type: string;
  height?: number;
}
const menuStyle = {
    fontFamily: "Noto Sans Thai",
    fontSize: "1rem",
    backgroundColor: '#fff',

  };

const BASE_YEAR = 2000;

const chartOptionsMap = {
  wl: {
    chart: {
      id: 'sea-wl',
      zoom: { enabled: true },
      toolbar: { show: true },
      fontFamily: "Noto Sans Thai", 
 
    },
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: {
        sizeOffset: 0,
      },
    },
    
    title: {
      text: 'ระดับน้ำทะเล',
      align: "center" as const,
      style: {
        fontSize: '18px',
        color: '#333',
        fontFamily: 'Noto Sans Thai',
      },
    },
    stroke: {
      width: [4, 4, 4], // เส้น volume, คอลัมน์ wl, คอลัมน์ outsea
      dashArray: [0, 0, 0], // เส้น volume, คอลัมน์ wl, คอลัมน์ outsea
      curve: 'smooth' as const,
    },
    xaxis: {
      type: 'datetime',
      min: new Date(`${BASE_YEAR}-01-01`).getTime(),
      max: new Date(`${BASE_YEAR}-12-31`).getTime(),
      labels: { datetimeUTC: false, format: 'MMM HH:mm' },
    },
    yaxis: [
        {
          seriesName: 'ระดับน้ำทะเล (ม.รทก.)',
          labels: {
            formatter: (val: number) => val.toFixed(2),
            style: { fontSize: '12px', color: '#2196F3' },
          },
          title: {
            text: 'ระดับน้ำทะเล (ม.รทก.)',
            style: { fontSize: '16px', color: '#2196F3' },
          },
        }
      ],
    tooltip: { intersect: false, x: { format: 'dd MMM HH:mm' } },
    colors: ['#3366FF','#FF0033','#00FF33','#CD853F','#FF9900','#66CCFF','#9933FF','#009966','#000000','#333399'],
  }
};

const SeaLevelChart: React.FC<DataChartProps> = ({ data, type = 'wl', height = 350 }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  if (!data || !data.series) return null;

  // เลือก options ตาม type
  const options = chartOptionsMap[type as 'wl'] as ApexCharts.ApexOptions;


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

export default SeaLevelChart;
