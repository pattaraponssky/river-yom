import React, { useEffect, useState } from "react";
import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import { API_URL } from "@/lib/utility";
import { getCellDiffStyle, getCellStyle, HeaderCellStyle, fontTitle } from "@/theme/style";
import { useThemeMode } from '@/contexts/ThemeContext';

const warningData = [
   {
    id: 1,
    staCode: 'Y.4',
    location: '',
    subdistrict: 'ธานี',
    district: 'เมืองสุโขทัย',
    province: 'สุโขทัย',
    bank: 51.59,
    depth: 8.15,
    // leftBank: 3.53,
    // rightBank: 2.71,
    // canalBottom: -5.91,
    watch: 49.6,
    alert: 50.5,
    crisis: 51.4,
  },
  {
    id: 2,
    staCode: 'Y.15',
    location: '',
    subdistrict: 'บ้านกง',
    district: 'กงไกรลาศ',
    province: 'สุโขทัย',
    bank: 45.64,
    depth: 10.32,
    // leftBank: 6.32,
    // rightBank: 6.34,
    // canalBottom: -2.24,
    watch: 43.5,
    alert: 44.7,
    crisis: 46.0,
  },
    {
    id: 3,
    staCode: 'Y.50',
    location: '',
    subdistrict: 'บ้านท่านางงาม',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 40.76,
    depth: 6.10,
    // leftBank: 2.00,
    // rightBank: 2.85,
    // canalBottom: -9.65,
    watch: 39.5,
    alert: 40.5,
    crisis: 41.5,
  },
  {  
    id: 4,
    staCode: 'Y.16',
    location: '',
    subdistrict: 'บางระกำ',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 38.93,
    depth: 7.30,
    // leftBank: 2.98,
    // rightBank: 2.69,
    // canalBottom: -3.98,
    watch: 37.6,
    alert: 38.4,
    crisis: 39.3,
  },
  {
    id: 5,
    staCode: 'Y.64',
    location: '',
    subdistrict: 'บางระกำ',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 38.91,
    depth: 6.40,
    // leftBank: 2.02,
    // rightBank: 1.81,
    // canalBottom: -8.80,
    watch: 36.7,
    alert: 37.3,
    crisis: 38.0,
  },
    {
    id: 6,
    staCode: 'Y.51',
    location: '',
    subdistrict: 'บ้านท่าแห',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 42.72,
    depth: 13.69,
    // leftBank: 2.02,
    // rightBank: 1.81,
    // canalBottom: -8.80,
    watch: 38.8,
    alert: 40.4,
    crisis: 42.0,
  },
    {
    id: 7,
    staCode: 'Y.17',
    location: '',
    subdistrict: 'สามง่าม',
    district: 'สามง่าม',
    province: 'พิจิตร',
    bank: 38.25,
    depth: 6.76,
    // leftBank: 2.02,
    // rightBank: 1.81,
    // canalBottom: -8.80,
    watch: 39.4,
    alert: 40.6,
    crisis: 41.8,
  },
];

interface PeakData {
  elevation: number;
  time: string;
}

interface FloodWarningTableProps {
  maxLevels: Record<string, number>;
  waterTrends: Record<string, string>; // เพิ่ม prop สำหรับค่าแนวโน้ม
  waterPeaks: Record<string, PeakData>;
}


const FloodWarningTable: React.FC<FloodWarningTableProps> = ({ maxLevels, waterTrends, waterPeaks }) => {
  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isMediumScreen = useMediaQuery("(max-width: 900px)");
  const [flowLevels, setFlowLevels] = useState<Record<string, number>>({});
  const theme = useThemeMode();
  
  // โหลดข้อมูลจาก API
  useEffect(() => {
    const fetchFlowData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/flow_today`);
        const json = await res.json();
        if (json.status === "success") {
          const wlMap: Record<string, number> = {};
          json.data.forEach((item: any) => {
            wlMap[item.sta_code] = parseFloat(item.wl);
          });
          setFlowLevels(wlMap);
        }
      } catch (err) {
        console.error("โหลดข้อมูล flow_today ไม่สำเร็จ:", err);
      }
    };

    fetchFlowData();
  }, []);

  // ฟังก์ชันช่วยในการกำหนดสีพื้นหลังตามระดับน้ำ
   const getLevelColor = (
    currentLevel: number,
    watch: number,
    alert: number,
    crisis: number
    ) => {
      if (currentLevel >= crisis) return "#ff0008ff"; // วิกฤต
      if (currentLevel >= alert) return "#a7a700ff"; // เตือนภัย
      if (currentLevel >= watch) return "#69fc00ff"; // เฝ้าระวัง
      return "#00a2ffff";
    };

    const getDiffColor = (
    diff: number,
    ) => {
      if (diff >= 0) return "red"; // สูงกว่า/เท่ากับตลิ่ง
      if (diff < 0) return "green"; // ต่ำกว่าตลิ่ง
      return "#00a2ffff";
    };

  // ฟังก์ชันช่วยในการแสดงไอคอนตามแนวโน้ม
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'เพิ่มขึ้น':
        return <ArrowUpwardIcon sx={{ color: 'red' }} />;
      case 'ลดลง':
        return <ArrowDownwardIcon sx={{ color: 'blue' }} />;
      case 'คงที่':
        return <RemoveIcon sx={{ color: 'gray' }} />;
      default:
        return null;
    }
  };

  const formatPeakTime = (isoTime: string) => {
    if (!isoTime) return 'ไม่มีข้อมูล';
    try {
      const date = new Date(isoTime);
      if (isNaN(date.getTime())) return 'ข้อมูลเวลาไม่ถูกต้อง';
      
      const formatter = new Intl.DateTimeFormat('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return formatter.format(date).replace('น.', '');
    } catch (error) {
      return 'ข้อมูลเวลาไม่ถูกต้อง';
    }
  };

    const exportToCsv = () => {
      // 1. Define headers to match the displayed table structure
      const headers = [
        "ตำแหน่งเตือนภัย (รหัส)",
        "ตำแหน่งเตือนภัย (บ้าน)",
        "ตำบล", 
        "อำเภอ",
        "จังหวัด",
        "ระดับตลิ่ง (ม.รทก.)",
        "ระดับน้ำปัจจุบัน (ม.รทก.)",
        "สูง/ต่ำ (ม.) ระดับตลิ่ง",
        "ระดับน้ำสูงสุด 7 วัน (ม.รทก.)",
        "เริ่มสูงกว่าตลิ่ง / วันที่น้ำสูงสุด 7 วัน",
        "แนวโน้ม",
      ];

      // 2. Create rows using your existing data and calculated values
      const rows = warningData.map(item => {
        // Current Level
        const wl = flowLevels[item.staCode];
        const currentLevelStr = wl != null ? wl.toFixed(2) : "-";
        
        // Diff from Bank
        const diff = wl != null ? (wl - item.bank) : null;
        const diffStr = diff != null ? diff.toFixed(2) : "-";
        
        // Max Level (7 Days)
        const currentMaxLevel = maxLevels[item.staCode];
        const maxLevelStr = currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-";
        
        // Trend
        const currentTrend = waterTrends[item.staCode] || '-';
        const trendStr = currentTrend === 'ไม่มีข้อมูลเพียงพอ' ? '-' : currentTrend;

        // Peak Time / Over Bank Status (Logic from the table cell)
        let peakStatusStr: string;
        if (wl != null && wl > item.crisis) {
          peakStatusStr = "สูงกว่าตลิ่ง (ปัจจุบัน)";
        } else if (waterPeaks[item.staCode]?.elevation != null && waterPeaks[item.staCode].elevation > item.crisis) {
          peakStatusStr = formatPeakTime(waterPeaks[item.staCode].time);
        } else {
          peakStatusStr = "-";
        }

        return [
          item.staCode,
          item.location,
          item.subdistrict,
          item.district,
          item.province,
          item.bank.toFixed(2),
          currentLevelStr,
          diffStr,
          maxLevelStr,
          peakStatusStr, 
          trendStr,
        ];
      });

      // 3. Construct and download the CSV
   
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")) // ใช้ map เพื่อใส่ quote ครอบข้อมูลแต่ละ cell
      ].join("\n");

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "flood_warning_thachin.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <TableContainer
      sx={{
        justifySelf: "center",
        maxWidth: "90vw",
        overflowX: "auto",
        paddingBottom: 2,
      }}
    >
       <Box sx={{ display: "flex", flexDirection: {md:"row",xs:"column"}, justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography
          sx={fontTitle}
        >
          เกณฑ์การเฝ้าระวังและเตือนภัยในพื้นที่ศึกษาโครงการ
        </Typography>

        <Button
            variant="contained"
            onClick={exportToCsv}
            startIcon={<CloudDownloadIcon />}
            sx={(theme) => ({
                fontFamily: 'Prompt, sans-serif',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '10px',
                whiteSpace: 'nowrap',
                minWidth: 'auto',

                /* สีหลัก */
                backgroundColor: '#2e7d32', // เขียวสุภาพ
                color: '#fff',

                /* Hover / Active */
                '&:hover': {
                backgroundColor: '#1b5e20',
                boxShadow: theme.shadows[4],
                },
                '&:active': {
                backgroundColor: '#144d1a',
                boxShadow: theme.shadows[2],
                },

                /* Responsive */
                display: { md: 'inline-flex', sm: 'none', xs: 'none' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.75, sm: 1 },

                /* Icon spacing */
                '& .MuiButton-startIcon': {
                marginRight: { xs: 0.5, sm: 1 },
                marginLeft: { xs: 0, sm: 0 },
                },

                ...(theme.palette.mode === 'dark' && {
                backgroundColor: '#388e3c',
                '&:hover': {
                    backgroundColor: '#2e7d32',
                },
                }),
            })}
            >
            ส่งออก CSV
            </Button>

      </Box>
      <Table sx={{ minWidth: isSmallScreen ? 333 : 1000, tableLayout: "auto" }}>

        {/* หัวตาราง */}
        <TableHead sx={{ clipPath: "none" }}>
          <TableRow>
            <TableCell sx={HeaderCellStyle} rowSpan={2}>
              ตำแหน่งเตือนภัย
            </TableCell>
            {/* <TableCell sx={HeaderCellStyle} rowSpan={2}>
              บ้าน
            </TableCell> */}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={HeaderCellStyle} rowSpan={2}>ตำบล</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={HeaderCellStyle} rowSpan={2}>อำเภอ</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={HeaderCellStyle} rowSpan={2}>จังหวัด</TableCell>}
            <TableCell sx={HeaderCellStyle} rowSpan={2}>ระดับตลิ่ง<br />(ม.รทก.)</TableCell>
            <TableCell sx={HeaderCellStyle} rowSpan={2}>
              ระดับน้ำ<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={HeaderCellStyle} rowSpan={2}>
              <span style={{color:"red"}}>สูง</span>/<span style={{color:"green"}}>ต่ำ</span> (ม.)<br/>ระดับตลิ่ง
            </TableCell>
            <TableCell sx={HeaderCellStyle} colSpan={3}>
              ระดับน้ำสูงสุด 7 วัน<br />(ม.รทก.)
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell sx={HeaderCellStyle}>
              (ม.รทก.)
            </TableCell>
            <TableCell sx={HeaderCellStyle}>
              เริ่มสูงกว่าตลิ่ง
            </TableCell>
            <TableCell sx={HeaderCellStyle}>
              แนวโน้ม
            </TableCell>

          </TableRow>
        </TableHead>

        {/* ข้อมูลในตาราง */}
        <TableBody>
          {warningData.map((item, index) => {
            const currentMaxLevel = maxLevels[item.staCode];
            const wl = flowLevels[item.staCode]; // ดึงค่าจาก API
            const diff =
              wl != null 
              ? (wl - item.bank).toFixed(2)
              : "-"; // คำนวณผลต่าง
            const diffColor =
              wl != null 
              ? getDiffColor(wl - item.bank)
              : undefined; // คำนวณผลต่าง
            const currentTrend = waterTrends[item.staCode]; // รับค่าแนวโน้มสำหรับแต่ละสถานี
            const maxLevelColor = currentMaxLevel != null 
              ? getLevelColor(currentMaxLevel, item.watch, item.alert, item.crisis)
              : undefined; 
              
            
            return (
              <TableRow key={item.id}>
                <TableCell sx={getCellStyle(index)}>{item.staCode}</TableCell>
                {/* <TableCell sx={getCellStyle(index)}>{item.location}</TableCell> */}
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.subdistrict}</TableCell>} 
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.district}</TableCell>} 
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.province}</TableCell>}
                <TableCell sx={getCellStyle(index)}>{item.bank.toFixed(2)}</TableCell>
                <TableCell
                  sx={getCellDiffStyle(index, "#00a2ffff")}
                >
                  {wl != null ? wl.toFixed(2) : "-"}
                </TableCell>
                <TableCell sx={getCellDiffStyle(index, diffColor)}>{diff}</TableCell>
                <TableCell sx={getCellDiffStyle(index, maxLevelColor)}>
                  {currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-"}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {  wl != null && wl > item.crisis
                    ? "สูงกว่าตลิ่ง"
                    : waterPeaks[item.staCode]?.elevation != null && waterPeaks[item.staCode].elevation > item.crisis
                      ? formatPeakTime(waterPeaks[item.staCode].time)
                      : "-"}
                </TableCell>

                <TableCell sx={getCellStyle(index)}>
                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {getTrendIcon(currentTrend)}
                       <Typography sx={{ ml: 1, fontSize: 'inherit',fontFamily: "Prompt", }}>
                         {currentTrend === 'ไม่มีข้อมูลเพียงพอ' ? '-' : currentTrend}
                       </Typography>
                   </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FloodWarningTable;