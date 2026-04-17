import React, { useEffect, useState } from "react";
import {
  alpha,
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
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { API_URL, Path_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';
import { useTheme } from '@mui/material';

interface GateData {
  sta_name: string;
  sta_code: string;
  river: string;
  wl_upper: number;
  wl_lower: number;
  discharge: number;
}

const GateCard: React.FC = () => {
  const [data, setData] = useState<GateData[]>([]);
  const [totalDcToday, setTotalDcToday] = useState<number>(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const cardColor = isDark
    ? `linear-gradient(135deg, ${theme.palette.background.paper}88, ${theme.palette.background.paper}cc)` // โปร่งแสงเข้ม
    : "#E3F2FD"; // ใช้ gradient เดิมใน light

  // Fetch API
  useEffect(() => {
    fetch(`${API_URL}/api/daily/gate`)
      .then((res) => res.json())
      .then((json) => {
        const fetchedData = json.data.map((d: any) => ({
          sta_name: d.sta_name,
          sta_code: d.sta_code,
          wl_upper: parseFloat(d.wl_upper),
          wl_lower: parseFloat(d.wl_lower),
          discharge: parseFloat(d.discharge),
        }));
        setData(fetchedData);

        const total = fetchedData.reduce(
          (sum: number, d: GateData) => sum + (d.discharge || 0),
          0
        );
        setTotalDcToday(total);
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

const titleStyle = {
  fontFamily: "Prompt",
  fontSize: { md: "1.2rem", xs: "1rem" },
};

  return (
    <Box sx={{mx: "auto", mb: 2 }}>
      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <CardContent>
          {/* Header */}
          <Box display="flex" alignItems="center" mb={2}>
            <Avatar
              src={`${Path_URL}/images/icons/gate_icon.png`}
               sx={{
                    width: { xs: 35, md: 45 },
                    height: { xs: 35, md: 45 },
                    boxShadow: `0 4px 12px ${alpha(primary, 0.4)}`,
                    mr: 2,
                }}
            />
            <Typography 
               sx={{ fontWeight: "bold", fontSize: { md: "1.4rem", xs: "1rem" }, fontFamily:"Prompt" }}
            >
              ประตูระบายน้ำ
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Summary Card */}
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
                <Typography sx={textStyle}>ประตูระบายน้ำทั้งหมด</Typography>
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
                  {/* {data.length} */}
                  3
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="right">
                <Typography sx={{ color: "gray",...textStyle }}>ปตร.</Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography sx={textStyle}>ปริมาณน้ำท่ารายวันรวม</Typography>
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
                  {/* {numberFormat(totalDcToday, 2)} */}
                  131.20
                </Typography>
              </Grid>
              <Grid size={{ xs: 3 }} textAlign="right">
                <Typography sx={{ color: "gray",...textStyle }}>ล้าน ลบ.ม.</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Table */}
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Table size="small">
              <TableHead >
                 <TableRow
                    sx={{
                      background: `linear-gradient(90deg, ${primary}, #01579B)`,
                    }}
                  >
                  <TableCell align="center" sx={{ color: "white",...textStyle, fontWeight: "bold" }}>
                    ประตูระบายน้ำ
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white",...textStyle, fontWeight: "bold" }}>
                    รหัส
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white",...textStyle ,fontWeight: "bold",whiteSpace: "nowrap",}}>
                    ระดับน้ำเหนือประตู
                    <br />
                    <Typography sx={{ color: "white", fontSize:"0.8rem",fontWeight: "bold",fontFamily:"Prompt" }}>
                      (ม.รทก.)
                    </Typography>
                  </TableCell>
                   <TableCell align="center" sx={{ color: "white",...textStyle,fontWeight: "bold",whiteSpace: "nowrap", }}>
                    ระดับน้ำท้ายประตู
                    <br />
                    <Typography sx={{ color: "white", fontSize:"0.8rem",fontWeight: "bold",fontFamily:"Prompt" }}>
                      (ม.รทก.)
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white",...textStyle,fontWeight: "bold" ,}}>
                    ปริมาณน้ำ
                    <br />
                    <Typography sx={{ color: "white", fontSize:"0.8rem",fontWeight: "bold",fontFamily:"Prompt",whiteSpace: "nowrap", }}>
                      (ลบ.ม./วินาที)
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.map((gate, i) => {
                  return (
                    <TableRow key={i} hover>
                      <TableCell sx={{...textStyle,lineHeight:{md:"2.2rem",xs:"1.2rem",whiteSpace: "nowrap",}}}>{gate.sta_name}</TableCell>
                      <TableCell sx={{...textStyle,lineHeight:{md:"2.2rem",xs:"1.2rem"}}}>{gate.sta_code}</TableCell>
                      <TableCell sx={{...textStyle,lineHeight:{md:"2.2rem",xs:"1.2rem"}}} align="center">{numberFormat(gate.wl_upper, 2)}</TableCell>
                      <TableCell sx={{...textStyle,lineHeight:{md:"2.2rem",xs:"1.2rem"}}} align="center">{numberFormat(gate.wl_lower, 2)}</TableCell>
                      <TableCell sx={{...textStyle,lineHeight:{md:"2.2rem",xs:"1.2rem"}}} align="center">{numberFormat(gate.discharge, 2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GateCard;
