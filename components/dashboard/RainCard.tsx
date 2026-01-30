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
} from "@mui/material";
import { API_URL, Path_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';
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

        // ✅ คำนวณฝนเฉลี่ยวันนี้ และฝนสะสมเฉลี่ยจาก field rain_sum
        const totalRain = json.data.reduce(
          (sum: number, r: RainData) => sum + parseFloat(r.rain_mm || "0"),
          0
        );
        const totalRainSum = json.data.reduce(
          (sum: number, r: RainData) => sum + parseFloat((r.rain_sum || "0").replace(/,/g, "")),
          0
        );

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

  const titleStyle = {
    fontFamily: "Prompt",
    fontSize: { md: "1.2rem", xs: "1rem" },
  };

  return (
    <Box sx={{ mx: "auto", mb: 2 }}>
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardHeader
          avatar={
            <Avatar
              src={`${Path_URL}/images/icons/rain_station_icon.png`}
              sx={{ width: 40, height: 40 }}
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
          <TableContainer component={Paper}>
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
                  sx={{ ...titleStyle, color: "#28378B" }}
                  fontWeight="bold"
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
                  sx={{ ...titleStyle, color: "#1976D2" }}
                  fontWeight="bold"
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
                    sx={{ color: "white", fontWeight: "bold", ...textStyle }}
                  >
                    ปริมาณน้ำฝน
                    <br />
                    <span style={{ fontWeight: 100 }}>(มม.)</span>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "white", fontWeight: "bold", ...textStyle }}
                  >
                    ฝนสะสม
                    <br />
                    <span style={{ fontWeight: 100 }}>(มม.)</span>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataRain.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{...textStyle,whiteSpace: "nowrap",}}>{row.name}</TableCell>
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
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RainCard;
