import React, { useEffect, useState } from "react";
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Paper,
  alpha,
} from "@mui/material";
import { API_URL, Path_URL } from '../../lib/utility';
import { textStyle, titleStyle } from '../../theme/style';
import { TableContainer, useTheme } from '@mui/material';

interface RainData {
  no: number;
  sta_code: string;
  name: string;
  province: string;
  lat: string;
  long: string;
  date: string;
  rain_mm: string;
  rain_sum: string;
}

const RainCard: React.FC = () => {
  const [dataRain, setDataRain] = useState<RainData[]>([]);
  const [sumRainToday, setSumRainToday] = useState<number>(0);
  const [avgRainSum, setAvgRainSum] = useState<number>(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const cardColor = isDark
    ? `linear-gradient(135deg, ${theme.palette.background.paper}88, ${theme.palette.background.paper}cc)` // โปร่งแสงเข้ม
    : "#E3F2FD"; // ใช้ gradient เดิมใน light

  // ดึงข้อมูลจาก API
  const fetchRainData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/daily/rain`);
      const json = await res.json();

      if (json?.data) {
        setDataRain(json.data);

        const totalRain = json.data.reduce(
          (sum: number, r: RainData) => sum + parseFloat(r.rain_mm || "0"),
          0
        );

        const totalRainSum = json.data.reduce((sum: number, r: RainData) => {
        const valueStr = String(r.rain_sum ?? "0"); // แปลงเป็น string เสมอ
        const cleaned = valueStr.replace(/,/g, "");
        return sum + parseFloat(cleaned || "0");
      }, 0);

        setSumRainToday(totalRain / json.data.length || 0);
        setAvgRainSum(totalRainSum / json.data.length || 0);
      }
    } catch (error) {
      console.error("Error fetching rain data:", error);
    }
  };

  useEffect(() => {
    fetchRainData();
  }, []);

  const numberFormat = (value: number | string, decimals = 2) =>
    parseFloat(value as string).toLocaleString("th-TH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });


  return (
    <Box sx={{ mx: "auto", mb: 2 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardHeader
          avatar={
            <Avatar
              src={`${Path_URL}/images/icons/rain_station_icon.png`}
               sx={{
                  width: { xs: 35, md: 45 },
                  height: { xs: 35, md: 45 },
                  boxShadow: `0 4px 12px ${alpha(primary, 0.4)}`,
                }}
            />
          }
          title={
            <Typography
              sx={{
                fontWeight: "bold",
                fontSize: { md: "1.4rem", xs: "1rem" },
                fontFamily: "Prompt",
              }}
            >
              น้ำฝน
            </Typography>
          }
        />
        <Divider />

        <CardContent>  
          
          <Paper
            variant="outlined"
            sx={{
              bgcolor: cardColor,
              borderColor: "rgba(0,0,0,0.05)",
              mb: 2,
              borderRadius: 2,
              p: 2,
            }}
          >
            
            <Grid container alignItems="center" spacing={1}>
              {/* ฝนเฉลี่ยวันนี้ */}
              <Grid size={{ xs: 6 }}>
                <Typography sx={textStyle}>ปริมาณฝนเฉลี่ย</Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="center">
                <Typography 
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                  {numberFormat(sumRainToday, 2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="right">
                <Typography color="gray">มม.</Typography>
              </Grid>

              {/* ฝนสะสมเฉลี่ย */}
              <Grid size={{ xs: 6 }}>
                <Typography sx={textStyle}>ฝนสะสมเฉลี่ยตั้งแต่ 1 ม.ค.</Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="center">
                <Typography 
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.4rem',
                      background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                  {numberFormat(avgRainSum, 2)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="right">
                <Typography sx={textStyle} color="gray">
                  มม.
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* ตารางข้อมูลสถานี */}
          <Card variant="outlined" sx={{ borderRadius: 2,overflow: "auto",  }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#01579B" }}>
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold", ...textStyle }}
                  >
                    สถานีวัดน้ำฝน
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold", ...textStyle }}
                  >
                    จังหวัด
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold", ...textStyle,  }}
                  >
                    ปริมาณน้ำฝน
                    <br />
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        fontFamily: "Prompt",
                      }}
                    >
                      (มม.)
                    </Typography>
                  </TableCell>
                    <TableCell align="center" sx={{ color: "white", ...textStyle, fontWeight: "bold",whiteSpace: "nowrap", }}>
                    ฝนสะสม
                    <br />
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        fontFamily: "Prompt",
                      }}
                    >
                      (มม.)
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {dataRain.map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{...textStyle,whiteSpace: "nowrap",lineHeight:{md:"1.94rem",xs:"1.2rem"}}}>{row.name}</TableCell>
                    <TableCell sx={textStyle} align="center">
                      {row.province}
                    </TableCell>
                    <TableCell sx={textStyle} align="center">
                      {numberFormat(row.rain_mm, 2)}
                    </TableCell>
                    <TableCell sx={textStyle} align="center">
                      {row.rain_sum}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RainCard;
