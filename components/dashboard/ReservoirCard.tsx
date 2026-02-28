import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";
import { API_URL, Path_URL } from '../../lib/utility';
import { textStyle } from '../../theme/style';
import { useTheme } from '@mui/material';

interface Reservoir {
  no: number;
  res_code: string;
  res_name: string;
  province: string;
  type: string | null;
  long: string;
  lat: string;
  date: string;
  volume: string;
  inflow: string;
  outflow: string;
  p: string;
}

interface Summary {
  sumVolume: number;
  sumInflow: number;
  sumOutflow: number;
  avgPercent: number;
}

const ReservoirDashboard: React.FC = () => {
  const [data, setData] = useState<Reservoir[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [_loading, setLoading] = useState<boolean>(true);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cardColor = isDark
    ? `linear-gradient(135deg, ${theme.palette.background.paper}88, ${theme.palette.background.paper}cc)` // โปร่งแสงเข้ม
    : "#E3F2FD"; // ใช้ gradient เดิมใน light

  useEffect(() => {
    fetch(`${API_URL}/api/daily/reservoir`)
      .then((res) => res.json())
      .then((res) => {
        const reservoirData = res.data || [];
        setData(reservoirData);

        // สรุปข้อมูลรวม
        const totalVolume = reservoirData.reduce(
          (sum: number, r: Reservoir) => sum + parseFloat(r.volume || "0"),
          0
        );
        const totalInflow = reservoirData.reduce(
          (sum: number, r: Reservoir) => sum + parseFloat(r.inflow || "0"),
          0
        );
        const totalOutflow = reservoirData.reduce(
          (sum: number, r: Reservoir) => sum + parseFloat(r.outflow || "0"),
          0
        );
        const avgPercent =
          totalVolume / 23970 * 100;

        setSummary({
          sumVolume: totalVolume,
          sumInflow: totalInflow,
          sumOutflow: totalOutflow,
          avgPercent,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const formatNumber = (num: number, decimals = 2) =>
    num.toLocaleString("th-TH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

//   if (loading) {
//     return (
//       <Box sx={{ textAlign: "center", py: 5 }}>
//         <CircularProgress />
//       </Box>
//     );
//   }

const titleStyle = {
  fontFamily: "Prompt",
  fontSize: { md: "1.2rem", xs: "1rem" },
};

  return (
    <Box className="responsive-text">
      <Card sx={{ mb: 2, borderRadius: 3 }} elevation={2}>
        <CardHeader
          avatar={
            <Avatar
              src={`${Path_URL}/images/icons/reservoir_icon.png`}
              alt="reservoir"
            />
          }
          title={
            <Typography
              sx={{ fontWeight: "bold", color: "#ef6c00", fontSize: { md: "1.4rem", xs: "1rem" },fontFamily:"Prompt" }}
            >
              อ่างเก็บน้ำ
            </Typography>
          }
        />
        <Divider />

        <CardContent sx={{textAlign:{md:"left", xs:"center"}}}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Card
                sx={{
                  bgcolor: cardColor,
                  border: "1px solid rgba(0, 0, 0, .05)",
                  borderRadius: 3,
                  p: 2,
                }}
                elevation={0}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={titleStyle}>อ่างเก็บน้ำขนาดใหญ่<span style={{color:"#ef6c00"}}> 1 </span><span style={{ color: "gray" }}>แห่ง</span></Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography sx={titleStyle}>อ่างเก็บน้ำขนาดกลาง<span style={{color:"#ef6c00"}}> 4 </span><span style={{ color: "gray" }}>แห่ง</span></Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 7 }}>
                    <Typography sx={titleStyle}>ความจุเก็บกักรวม</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <Typography sx={titleStyle}><span style={{color:"#ef6c00",fontWeight:"bold"}}> 23970 </span><span style={{ color: "gray" }}>ล้าน ลบ.ม.</span></Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 5 }}>
                     <Typography sx={titleStyle}>ปัจจุบัน <span style={{color:"#ef6c00",fontWeight:"bold"}}>  {formatNumber(summary?.sumVolume || 0, 2)}{" "} </span><span style={{ color: "gray" }}>ล้าน ลบ.ม.</span></Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                   <Typography sx={titleStyle}>คิดเป็น</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                   <Box
                        sx={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        >
                        <Box
                            sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            }}
                        >
                            <Typography fontWeight="bold" sx={{ ...titleStyle ,color:"#ef6c00"}}>
                            {formatNumber(summary?.avgPercent || 0)}%
                            </Typography>
                        </Box>
                    </Box>

                  </Grid>
                </Grid>
              </Card>
            </Grid>

            {/* สรุป inflow / outflow */}
            <Grid size={{ xs: 6 }}>
              <Card
                sx={{
                  bgcolor: cardColor,
                  border: "1px solid rgba(0, 0, 0, .05)",
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                }}
                elevation={0}
              >
                <Typography sx={textStyle}>ปริมาณน้ำไหลเข้าอ่างฯ วันนี้</Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "#ef6c00",fontFamily:"Prompt" }}
                >
                  {formatNumber(summary?.sumInflow || 0, 2)}
                </Typography>
                <Typography sx={textStyle} color="gray">ล้าน ลบ.ม.</Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Card
                sx={{
                  bgcolor: cardColor,
                  border: "1px solid rgba(0, 0, 0, .05)",
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                }}
                elevation={0}
              >
                <Typography sx={textStyle}>ปริมาณน้ำระบายจากอ่างฯ วันนี้</Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "#ef6c00" }}
                >
                  {formatNumber(summary?.sumOutflow || 0, 2)}
                </Typography>
                <Typography sx={textStyle} color="gray">ล้าน ลบ.ม.</Typography>
              </Card>
            </Grid>

            {/* ตารางข้อมูล */}
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 3 }}>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#ef6c00" }}>
                        <TableCell align="center" sx={{ fontWeight: "bold",color: "white",...textStyle ,p:1}}>
                          อ่างเก็บน้ำ
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold",color: "white",...textStyle }}>
                          ปริมาตร (ล้าน ลบ.ม.)
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold",color: "white",...textStyle  }}>
                          ร้อยละ
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold",color: "white",...textStyle  }}>
                          ไหลเข้า (ล้าน ลบ.ม.)
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: "bold",color: "white",...textStyle  }}>
                          ระบาย (ล้าน ลบ.ม.)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{fontSize:"0.9rem",fontFamily:"Prompt",whiteSpace: "nowrap",}}>{r.res_name}</TableCell>
                          <TableCell align="center" sx={{fontSize:"0.9rem",fontFamily:"Prompt",}}>
                            {formatNumber(parseFloat(r.volume || "0"), 2)}
                          </TableCell>
                          <TableCell align="center" sx={{fontSize:"0.9rem",fontFamily:"Prompt"}}>
                            {formatNumber(parseFloat(r.p || "0"), 2)}%
                          </TableCell>
                          <TableCell align="center" sx={{fontSize:"0.9rem",fontFamily:"Prompt",}}>
                            {formatNumber(parseFloat(r.inflow || "0"), 2)}
                          </TableCell>
                          <TableCell align="center" sx={{fontSize:"0.9rem",fontFamily:"Prompt"}}>
                            {formatNumber(parseFloat(r.outflow || "0"), 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReservoirDashboard;
