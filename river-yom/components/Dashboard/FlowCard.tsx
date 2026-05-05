import React, { useEffect, useState } from "react";
import { API_URL, Path_URL } from '../../lib/utility';
import { textStyle, titleStyle } from '../../theme/style';
import { alpha, CardHeader, useTheme } from '@mui/material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface FlowData {
  sta_code: string;
  sta_name: string;
  province: string;
  wl: number;
  discharge: number;
}

const FlowCard: React.FC = () => {
  const [data, setData] = useState<FlowData[]>([]);
  const [flowStationsOverWl, setFlowStationsOverWl] = useState<number>(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const cardColor = isDark
    ? `linear-gradient(135deg, ${theme.palette.background.paper}88, ${theme.palette.background.paper}cc)` // โปร่งแสงเข้ม
    : "#E3F2FD"; // ใช้ gradient เดิมใน light

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/daily/flow`).then((res) => res.json()),
      fetch(`${API_URL}/api/dailySummary`).then((res) => res.json()),
    ])
      .then(([flowJson, summaryJson]) => {
        // --- ข้อมูลน้ำท่า ---
        const fetchedData = flowJson.data.map((d: any) => ({
          sta_code: d.sta_code,
          sta_name: d.sta_name,
          province: d.province,
          wl: parseFloat(d.wl),
          discharge: parseFloat(d.discharge),
        }));
        setData(fetchedData);

        // --- ข้อมูลจำนวนสถานีที่น้ำล้นตลิ่ง ---
        if (summaryJson && summaryJson.flow_stations_over_wl !== undefined) {
          setFlowStationsOverWl(parseInt(summaryJson.flow_stations_over_wl));
        }
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const numberFormat = (num: number, decimals = 2) => {
    if (isNaN(num)) return "-";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };


  return (
    <Box sx={{ mx: "auto", mb: 2 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
         <CardHeader
            avatar={
              <Avatar
                src={`${Path_URL}/images/icons/flow_station_icon.png`}
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
                สถานีวัดน้ำท่า 
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
            <Grid container spacing={1} alignItems="center">
              <Grid size={{ xs: 6 }}>
                <Typography sx={textStyle}>สถานีวัดระดับน้ำทั้งหมด</Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="center">
                <Typography 
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                  {data.length}
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="right">
                <Typography sx={textStyle} color="gray">สถานี</Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography sx={textStyle}>ปริมาณน้ำล้นตลิ่ง</Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="center">
                <Typography 
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.3rem',
                      background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                  {flowStationsOverWl}
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="right">
                <Typography sx={textStyle} color="gray">สถานี</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Table */}
      
           <Card variant="outlined" sx={{ borderRadius: 2, overflow: "auto",  }}>
            <Table size="small">
              <TableHead>
                <TableRow
                    sx={{
                      background: `linear-gradient(90deg, ${primary}, #01579B)`,
                    }}
                  >
                  <TableCell align="center" sx={{ color: "white", ...textStyle, fontWeight: "bold" }}>
                    สถานี
                  </TableCell>
                  
                  <TableCell align="center" sx={{ color: "white", ...textStyle, fontWeight: "bold" }}>
                    ตำแหน่ง
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", ...textStyle, fontWeight: "bold" }}>
                    จังหวัด
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", ...textStyle, fontWeight: "bold",whiteSpace: "nowrap", }}>
                    ระดับน้ำ
                    <br />
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        fontFamily: "Prompt",
                      }}
                    >
                      (ม.รทก.)
                    </Typography>
                  </TableCell>
                    <TableCell align="center" sx={{ color: "white", ...textStyle, fontWeight: "bold",whiteSpace: "nowrap", }}>
                    อัตราการไหล
                    <br />
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        fontFamily: "Prompt",
                      }}
                    >
                      (ลบ.ม./วินาที)
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.map((flow, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ textAlign: "center", ...textStyle, lineHeight:{md:"1.94rem",xs:"1.2rem"} }}>{flow.sta_code}</TableCell>
                    <TableCell sx={{ textAlign: "center", ...textStyle, lineHeight:{md:"1.94rem",xs:"1.2rem"} ,whiteSpace: "normal",}}>{flow.sta_name}</TableCell>
                    <TableCell sx={{ textAlign: "center", ...textStyle, lineHeight:{md:"1.94rem",xs:"1.2rem"} ,whiteSpace: "normal",}}>{flow.province}</TableCell>
                    <TableCell sx={{ textAlign: "center", ...textStyle, lineHeight:{md:"1.94rem",xs:"1.2rem"} ,}}>
                      {numberFormat(flow.wl, 2)}
                    </TableCell>
                       <TableCell sx={{ textAlign: "center", ...textStyle, lineHeight:{md:"1.94rem",xs:"1.2rem"} ,}}>
                      {numberFormat(flow.discharge, 2)}
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

export default FlowCard;
