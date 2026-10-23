'use client';

import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography, Grid, Paper } from '@mui/material';
import {
  Storage,
  BarChart,
  Info,
  HomeRepairService,
} from "@mui/icons-material"; // Import ไอคอน
import EditAboutUs from "@/components/Setting/AboutUs/EditAboutUs";
import ManualUpdateFlow from "@/components/Setting/Data/ManualUpdateFlow";
import ManualUpdateGate from "@/components/Setting/Data/ManualUpdateGate";
import ManualUpdateRain from "@/components/Setting/Data/ManualUpdateRain";
import ManualUpdateReservoir from "@/components/Setting/Data/ManualUpdateReservoir";
import UploadData from "@/components/Setting/Data/UpdateData";
import InfoFlowStation from "@/components/Setting/Info/FlowStation";
import InfoGateStation from "@/components/Setting/Info/GateStation";
import InfoRainStation from "@/components/Setting/Info/RainStation";
import InfoDamStation from "@/components/Setting/Info/ReservoirStation";
import InfoSeaStation from "@/components/Setting/Info/SeaStaion";
import { BoxStyle, fontTitle, titleStyle } from "@/theme/style";
import { useAuth } from "@/contexts/AuthContext";
import EquipmentPage from "@/app/equipment/page";
import ReportUploadForm from "@/components/Setting/Data/ReportUpload";
import InfoTeleStation from "@/components/Setting/Info/TeleStation";
import {
  RAIN_STATION_CONFIG,
  FLOW_STATION_CONFIG,
  GATE_STATION_CONFIG,
  TELE_STATION_CONFIG,
} from "@/components/Setting/Info/stationInfoConfig";



const Setting: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const { currentUser, loading, requirePermission } = useAuth();

  useEffect(() => {
    if (!loading) {
          requirePermission(2, '/dashboard');
        }
      }, [loading, requirePermission]);
    
    if (loading) {
      return <div>กำลังตรวจสอบสิทธิ์...</div>;
    }
    
    if (!currentUser || currentUser.iduser_level < 2) {
      return <div>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
    }

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
    setSubTab(0); // รีเซ็ตค่า subTab เมื่อเปลี่ยนหมวดหลัก
  };

  const handleSubTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSubTab(newValue);
  };

  return (
    <div>
      <Box
        sx={{
          ...BoxStyle,
          p: { xs: 1.5, md: 2.5 },
          "& .MuiTab-root": { fontSize: { xs: "0.78rem", md: "0.9rem" } },
          "& .MuiButton-root": { fontSize: { xs: "0.78rem", md: "0.85rem" } },
          "& .MuiInputBase-input": { fontSize: { xs: "0.82rem", md: "0.875rem" } },
          "& .MuiInputLabel-root": { fontSize: { xs: "0.8rem", md: "0.85rem" } },
          "& .MuiFormHelperText-root": { fontSize: "0.72rem" },
          "& .MuiMenuItem-root": { fontSize: "0.85rem" },
          "& .MuiChip-label": { fontSize: "0.72rem" },
          "& .MuiAlert-message": { fontSize: "0.8rem" },
          "& .MuiTableCell-root": { fontSize: { xs: "0.72rem", md: "0.8rem" } },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontFamily: "Prompt", fontWeight: 700, fontSize: { xs: "1rem", md: "1.2rem" }, color: "text.primary" }}>
            ตั้งค่าและจัดการข้อมูล
          </Typography>
          <Typography sx={{ fontFamily: "Prompt", fontSize: { xs: "0.75rem", md: "0.82rem" }, color: "text.secondary" }}>
            จัดการข้อมูลสถานี ข้อมูลย้อนหลัง ข้อมูลเว็บไซต์ และรายงานประจำวัน
          </Typography>
        </Box>

        {/* Main Tabs */}
        <Tabs
          value={mainTab}
          onChange={handleMainTabChange}
          aria-label="main category"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 2,
            minHeight: 50,
            p: 0.5,
            borderRadius: 2.5,
            bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(40,55,139,0.05)",
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTab-root": {
              minHeight: 44,
              borderRadius: 2,
              gap: 0.75,
              textTransform: "none",
              color: "text.secondary",
              transition: "all 0.18s ease",
            },
            "& .MuiTab-root.Mui-selected": {
              bgcolor: "background.paper",
              color: "primary.main",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.08)",
            },
          }}
        >
          <Tab
            sx={{ ...fontTitle, fontSize: { xs: "0.8rem", md: "0.95rem" } }}
            icon={<Storage />}
            iconPosition="start"
            label="ข้อมูลสถานี"
          />
          <Tab
            sx={{ ...fontTitle, fontSize: { xs: "0.8rem", md: "0.95rem" } }}
            icon={<BarChart />}
            iconPosition="start"
            label="อัปเดตข้อมูลย้อนหลัง"
          />
          <Tab
            sx={{ ...fontTitle, fontSize: { xs: "0.8rem", md: "0.95rem" } }}
            icon={<Info />}
            iconPosition="start"
            label="ข้อมูลเว็บไซต์"
          />
          <Tab
            sx={{ ...fontTitle, fontSize: { xs: "0.8rem", md: "0.95rem" } }}
            icon={<HomeRepairService />}
            iconPosition="start"
            label="อัปโหลดรายงานประจำวัน"
          />
        </Tabs>

        {/* Sub Tabs - Show only when 'ข้อมูลสถานี' is selected */}
        {mainTab === 0 && (
          <Box
            sx={{
              mb: 1,
              borderRadius: 2.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
              overflow: "hidden",
            }}
          >
            <Tabs
              value={subTab}
              onChange={handleSubTabChange}
              aria-label="sub category"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 46,
                "& .MuiTabs-indicator": { height: 3, borderRadius: 3 },
                "& .MuiTab-root": {
                  minHeight: 46,
                  textTransform: "none",
                  fontFamily: "Prompt",
                  fontWeight: 600,
                  gap: 0.75,
                  color: "text.secondary",
                },
                "& .MuiTab-root.Mui-selected": { color: "primary.main" },
              }}
            >
              <Tab sx={{ ...titleStyle, fontSize: { xs: "0.78rem", md: "0.88rem" } }} icon={RAIN_STATION_CONFIG.icon} iconPosition="start" label="สถานีวัดน้ำฝน" />
              <Tab sx={{ ...titleStyle, fontSize: { xs: "0.78rem", md: "0.88rem" } }} icon={FLOW_STATION_CONFIG.icon} iconPosition="start" label="สถานีวัดน้ำท่า" />
              <Tab sx={{ ...titleStyle, fontSize: { xs: "0.78rem", md: "0.88rem" } }} icon={GATE_STATION_CONFIG.icon} iconPosition="start" label="ประตูระบายน้ำ" />
              <Tab sx={{ ...titleStyle, fontSize: { xs: "0.78rem", md: "0.88rem" } }} icon={TELE_STATION_CONFIG.icon} iconPosition="start" label="สถานีติดตั้งโครงการ" />
            </Tabs>
          </Box>
        )}

        {/* Content Display */}
        <Box sx={{ paddingTop: { xs: 1, md: 2 } }}>
            {/* {mainTab === 0 && subTab === 0 && <InfoDamStation />} */}
            {mainTab === 0 && subTab === 0 && <InfoRainStation />}
            {mainTab === 0 && subTab === 1 && <InfoFlowStation />}
            {mainTab === 0 && subTab === 2 && <InfoGateStation />}
            {mainTab === 0 && subTab === 3 && <InfoTeleStation />}
          {mainTab === 1 && (
            <Box sx={{ p: 2 }}>
                <UploadData />
              <Grid container spacing={2}>
                {/* <Grid size={{ xs: 12, sm: 6 }}>
                    <ManualUpdateReservoir />
                </Grid> */}
              </Grid>
              <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mt:2}}>
                  {/* ── ขั้นตอนการใช้งาน ── */}
                    <Box sx={{ mb: 3 }}>
                       <Typography sx={{ fontSize: { xs: "1rem", md: "1.1rem" }, fontWeight: 600, color: "#28378B", mb: 2 }}>
                        จัดการข้อมูลย้อนหลัง
                      </Typography>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.disabled", letterSpacing: "0.06em", mb: 1.25, textTransform: "uppercase", fontFamily: "'Prompt', sans-serif" }}>
                        ขั้นตอนการใช้งาน
                      </Typography>
                      {[
                        { n: 1, main: "เลือกประเภทข้อมูลที่ต้องการ: flow (น้ำท่า) / rain (ฝน) / gate (ประตูระบายน้ำ)",                    sub: "ระบบจัดการข้อมูลย้อนหลังโดยดึงจากเว็บไซต์ต้นทางของประเภทข้อมูลนั้นๆ" },
                        { n: 2, main: "กำหนดเลือกช่วงเวลาที่ต้องการอัปเดตข้อมูล",        sub: "เลือกวันเริ่มต้นและวันสิ้นสุด" },
                        { n: 3, main: "เลือกช่วงวันที่เสร็จแล้ว คลิกที่ปุ่มอัปเดตข้อมูล",   sub: "และรอระบบทำการอัปเดตข้อมูล ยิ่งช่วงวันที่เลือกมาก ระบบจะประมวลผลนานขึ้น" },
                      ].map((s) => (
                        <Box key={s.n} sx={{ display: "flex", gap: 1.5, mb: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#28378B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 600, flexShrink: 0, mt: "2px" }}>
                            {s.n}
                          </Box>
                          <Box>
                            <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: { xs: "0.82rem", md: "0.875rem" }, color: "text.primary", lineHeight: 1.45 }}>{s.main}</Typography>
                            <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: { xs: "0.74rem", md: "0.8rem" }, color: "text.secondary" }}>{s.sub}</Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <ManualUpdateFlow />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <ManualUpdateRain />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <ManualUpdateGate />
                </Grid>
                
              </Grid>
              </Paper>
            </Box>
          )}
          {mainTab === 2 && (
            <EditAboutUs/>
          )}

           {mainTab === 3 && (
            <ReportUploadForm/>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default Setting;
