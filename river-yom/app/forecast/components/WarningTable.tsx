import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import { API_URL } from "@/lib/utility";
import { getCellDiffStyle, getCellStyle, HeaderCellStyle, fontTitle } from "@/theme/style";
import { useThemeMode } from '@/contexts/ThemeContext';
import SourceIcon from '@mui/icons-material/Source';
import { TELE_WARN_LEVELS, FLOW_WARN_LEVELS, getWarnLevel, WarnLevel } from "@/lib/warnLevels";

const COMBINED_WARN_LEVELS: Record<string, WarnLevel> = {
  ...TELE_WARN_LEVELS,
  ...FLOW_WARN_LEVELS,
};

interface StationMeta {
  id: number;
  staCode: string;
  location: string;
  subdistrict: string;
  district: string;
  province: string;
  bank: number | null; // ← เป็น null ได้ ถ้ายังไม่มีข้อมูลระดับตลิ่ง
}

const warningData: StationMeta[] = [
  // {
  //   id: 1,
  //   staCode: 'Y.4',
  //   location: '',
  //   subdistrict: 'ธานี',
  //   district: 'เมืองสุโขทัย',
  //   province: 'สุโขทัย',
  //   bank: 51.59,
  // },
  {
    id: 2,
    staCode: 'Y.15',
    location: '',
    subdistrict: 'บ้านกง',
    district: 'กงไกรลาศ',
    province: 'สุโขทัย',
    bank: 45.64,
  },
  {
    id: 3,
    staCode: 'YR.01',
    location: '',
    subdistrict: 'ชุมแสงสงคราม',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 40.67,
  },
  // TODO: เติมข้อมูล ตำบล/อำเภอ/จังหวัด/ระดับตลิ่ง จริงของ YR.02
  {
    id: 4,
    staCode: 'YR.02',
    location: '',
    subdistrict: 'บางระกำ',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 41.57,
  },
  // TODO: เติมข้อมูล ตำบล/อำเภอ/จังหวัด/ระดับตลิ่ง จริงของ YR.03
  {
    id: 5,
    staCode: 'YR.03',
    location: '',
    subdistrict: 'ชุมแสงสงคราม',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 44.37,
  },
  // TODO: เติมข้อมูล ตำบล/อำเภอ/จังหวัด/ระดับตลิ่ง จริงของ YR.04
  {
    id: 6,
    staCode: 'YR.04',
    location: '',
    subdistrict: 'บางระกำ',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 42.86,
  },
  // TODO: เติมข้อมูล ตำบล/อำเภอ/จังหวัด/ระดับตลิ่ง จริงของ YR.05
  {
    id: 7,
    staCode: 'YR.05',
    location: '',
    subdistrict: 'ท่านางงาม',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 40.30,
  },
  // TODO: เติมข้อมูล ตำบล/อำเภอ/จังหวัด/ระดับตลิ่ง จริงของ YR.06
  {
    id: 8,
    staCode: 'YR.06',
    location: '',
    subdistrict: 'บ่อทอง',
    district: 'บางระกำ',
    province: 'พิษณุโลก',
    bank: 39.55,
  },
];

interface PeakData {
  elevation: number;
  time: string;
}

interface FloodWarningTableProps {
  maxLevels: Record<string, number>;
  waterTrends: Record<string, string>;
  waterPeaks: Record<string, PeakData>;
}

const FloodWarningTable: React.FC<FloodWarningTableProps> = ({ maxLevels, waterTrends, waterPeaks }) => {
  const isSmallScreen = useMediaQuery("(max-width: 600px)");
  const isMediumScreen = useMediaQuery("(max-width: 900px)");
  const [flowLevels, setFlowLevels] = useState<Record<string, number>>({});

 useEffect(() => {
    const fetchCurrentLevels = async () => {
      try {
        const [flowRes, teleRes] = await Promise.all([
          fetch(`${API_URL}/api/flow_today`),
          fetch(`${API_URL}/api/tele_today`),
        ]);

        const [flowJson, teleJson] = await Promise.all([
          flowRes.json(),
          teleRes.json(),
        ]);

        const wlMap: Record<string, number> = {};

        if (flowJson.status === "success" && Array.isArray(flowJson.data)) {
          flowJson.data.forEach((item: any) => {
            if (item.sta_code != null && item.wl != null) {
              wlMap[item.sta_code] = parseFloat(item.wl);
            }
          });
        }

        if (teleJson.status === "success" && Array.isArray(teleJson.data)) {
          teleJson.data.forEach((item: any) => {
            const val = item.wl ?? item.water_level ?? item.wl_upper;
            if (item.sta_code != null && val != null) {
              wlMap[item.sta_code] = parseFloat(val);
            }
          });
        }

        setFlowLevels(wlMap);
      } catch (err) {
        console.error("โหลดข้อมูลระดับน้ำปัจจุบันไม่สำเร็จ:", err);
      }
    };

    fetchCurrentLevels();
  }, []);

  // ── รวมข้อมูลตำแหน่งสถานีเข้ากับเกณฑ์เตือนภัยจาก warnLevels.ts ──
  const stationsWithLevels = useMemo(() => {
    return warningData.map((item) => {
      const level = getWarnLevel(COMBINED_WARN_LEVELS, item.staCode);

      if (!level) {
        console.warn(
          `[FloodWarningTable] ไม่พบเกณฑ์เตือนภัยของสถานี "${item.staCode}" ใน warnLevels.ts`
        );
      }

      return {
        ...item,
        watch: level?.watch ?? null,
        alert: level?.alert ?? null,
        crisis: level?.crisis ?? null,
      };
    });
  }, []);

  const getLevelColor = (
    currentLevel: number,
    watch: number,
    alert: number,
    crisis: number
  ) => {
    if (currentLevel >= crisis) return "#ff0008ff";
    if (currentLevel >= alert) return "#a7a700ff";
    if (currentLevel >= watch) return "#69fc00ff";
    return "#00a2ffff";
  };

  const getDiffColor = (diff: number) => {
    if (diff >= 0) return "red";
    if (diff < 0) return "green";
    return "#00a2ffff";
  };

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

    const rows = stationsWithLevels.map(item => {
      const wl = flowLevels[item.staCode];
      const currentLevelStr = wl != null ? wl.toFixed(2) : "-";

      const diff = wl != null && item.bank != null ? (wl - item.bank) : null;
      const diffStr = diff != null ? diff.toFixed(2) : "-";

      const currentMaxLevel = maxLevels[item.staCode];
      const maxLevelStr = currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-";

      const currentTrend = waterTrends[item.staCode] || '-';
      const trendStr = currentTrend === 'ไม่มีข้อมูลเพียงพอ' ? '-' : currentTrend;

      let peakStatusStr: string;
      if (item.crisis != null && wl != null && wl > item.crisis) {
        peakStatusStr = "สูงกว่าตลิ่ง (ปัจจุบัน)";
      } else if (item.crisis != null && waterPeaks[item.staCode]?.elevation != null && waterPeaks[item.staCode].elevation > item.crisis) {
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
        item.bank != null ? item.bank.toFixed(2) : "-",
        currentLevelStr,
        diffStr,
        maxLevelStr,
        peakStatusStr,
        trendStr,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
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
      <Box sx={{ display: "flex", flexDirection: { md: "row", xs: "column" }, justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography sx={fontTitle}>
          เกณฑ์การเฝ้าระวังและเตือนภัยในพื้นที่ศึกษาโครงการ
          <Typography component="span" sx={{ fontWeight: "bold", fontSize: { md: "1.1rem", xs: "0.85rem" }, fontFamily: "Prompt", color: "text.secondary", ml: 1 }}>
            (ข้อมูล ณ เวลา 07:00 น. ของทุกวัน)
            <Tooltip title="แหล่งที่มาของข้อมูล">
              <IconButton
                size="medium"
                sx={{ ml: 1 }}
                onClick={() =>
                  window.open(
                    'https://rid.go.th/',
                    '_blank'
                  )
                }
              >
                <SourceIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          </Typography>
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
            backgroundColor: '#2e7d32',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#1b5e20',
              boxShadow: theme.shadows[4],
            },
            '&:active': {
              backgroundColor: '#144d1a',
              boxShadow: theme.shadows[2],
            },
            display: { md: 'inline-flex', sm: 'none', xs: 'none' },
            px: { xs: 1, sm: 2 },
            py: { xs: 0.75, sm: 1 },
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
        <TableHead sx={{ clipPath: "none" }}>
          <TableRow>
            <TableCell sx={HeaderCellStyle} rowSpan={2}>
              ตำแหน่งเตือนภัย
            </TableCell>
            {!isSmallScreen && !isMediumScreen && <TableCell sx={HeaderCellStyle} rowSpan={2}>ตำบล</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={HeaderCellStyle} rowSpan={2}>อำเภอ</TableCell>}
            {!isSmallScreen && !isMediumScreen && <TableCell sx={HeaderCellStyle} rowSpan={2}>จังหวัด</TableCell>}
            <TableCell sx={HeaderCellStyle} rowSpan={2}>ระดับตลิ่ง<br />(ม.รทก.)</TableCell>
            <TableCell sx={HeaderCellStyle} rowSpan={2}>
              ระดับน้ำ<br />(ม.รทก.)
            </TableCell>
            <TableCell sx={HeaderCellStyle} rowSpan={2}>
              <span style={{ color: "red" }}>สูง</span>/<span style={{ color: "green" }}>ต่ำ</span> (ม.)<br />ระดับตลิ่ง
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

        <TableBody>
          {stationsWithLevels.map((item, index) => {
            const currentMaxLevel = maxLevels[item.staCode];
            const wl = flowLevels[item.staCode];
            const diff =
              wl != null && item.bank != null
                ? (wl - item.bank).toFixed(2)
                : "-";
            const diffColor =
              wl != null && item.bank != null
                ? getDiffColor(wl - item.bank)
                : undefined;
            const currentTrend = waterTrends[item.staCode];
            const maxLevelColor = currentMaxLevel != null && item.watch != null && item.alert != null && item.crisis != null
              ? getLevelColor(currentMaxLevel, item.watch, item.alert, item.crisis)
              : undefined;

            const isCrisis = item.crisis != null && wl != null && wl > item.crisis;
            const isPeakOverCrisis = item.crisis != null && waterPeaks[item.staCode]?.elevation != null && waterPeaks[item.staCode].elevation > item.crisis;

            return (
              <TableRow key={item.id}>
                <TableCell sx={getCellStyle(index)}>{item.staCode}</TableCell>
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.subdistrict}</TableCell>}
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.district}</TableCell>}
                {!isSmallScreen && !isMediumScreen && <TableCell sx={getCellStyle(index)}>{item.province}</TableCell>}
                <TableCell sx={getCellStyle(index)}>{item.bank != null ? item.bank.toFixed(2) : "-"}</TableCell>
                <TableCell sx={getCellDiffStyle(index, "#00a2ffff")}>
                  {wl != null ? wl.toFixed(2) : "-"}
                </TableCell>
                <TableCell sx={getCellDiffStyle(index, diffColor)}>{diff}</TableCell>
                <TableCell sx={getCellDiffStyle(index, maxLevelColor)}>
                  {currentMaxLevel != null ? currentMaxLevel.toFixed(2) : "-"}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>
                  {isCrisis
                    ? "สูงกว่าตลิ่ง"
                    : isPeakOverCrisis
                      ? formatPeakTime(waterPeaks[item.staCode].time)
                      : "-"}
                </TableCell>
                <TableCell sx={getCellStyle(index)}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getTrendIcon(currentTrend)}
                    <Typography sx={{ ml: 1, fontSize: 'inherit', fontFamily: "Prompt" }}>
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