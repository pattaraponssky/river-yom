'use client';

import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography, Grid, CircularProgress, Paper } from '@mui/material';
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
      <Box sx={{ ...BoxStyle }}>
        {/* Main Tabs */}
        <Tabs
          value={mainTab}
          onChange={handleMainTabChange}
          aria-label="main category"
          variant="scrollable" // ใช้ scrollable tab
          scrollButtons="auto" // เพิ่มปุ่มเลื่อนอัตโนมัติ
          sx={{ marginBottom: "10px" ,width:{ xs:"85vw", sm:"85vw", md:"auto"}}}
        >
          {/* <Tab
            sx={{ ...fontTitle}}
            icon={<Settings />} // ไอคอนการตั้งค่าระบบ
            iconPosition="start"
            label="การตั้งค่าระบบ"
          /> */}
          <Tab
            sx={{ ...fontTitle}}
            icon={<Storage />} // ไอคอนข้อมูลสถานี
            iconPosition="start"
            label="ข้อมูลสถานี"
          />
          <Tab
            sx={{ ...fontTitle}}
            icon={<BarChart />} // ไอคอนการตั้งค่าแบบจำลอง
            iconPosition="start"
            label="อัปเดตข้อมูลย้อนหลัง"
          />
          <Tab
            sx={{ ...fontTitle}}
            icon={<Info />} // ไอคอนเกี่ยวกับเรา
            iconPosition="start"
            label="ข้อมูลเว็บไซต์"
            />
          <Tab
              sx={{ ...fontTitle}}
              icon={<HomeRepairService />} // ไอคอนลิงค์เพิ่มเติม
              iconPosition="start"
              label="อัปโหลดรายงานประจำวัน"
            />
        </Tabs>

        {/* Sub Tabs - Show only when 'ข้อมูลสถานี' is selected */}
        {mainTab === 0 && (
          <Tabs
            value={subTab}
            onChange={handleSubTabChange}
            aria-label="sub category"
            sx={{
              "& .MuiTab-root": { color: "#28378B" }, // ตัวอักษรสีเข้มขึ้น
            }}
          >
            {/* <Tab sx={titleStyle} label="ข้อมูลอ่างเก็บน้ำ/เขื่อน" /> */}
            <Tab sx={titleStyle} label="ข้อมูลสถานีวัดน้ำฝน" />
            <Tab sx={titleStyle} label="ข้อมูลสถานีวัดน้ำท่า" />
            <Tab sx={titleStyle} label="ข้อมูลประตูระบายน้ำ" />
            <Tab sx={titleStyle} label="ข้อมูลสถานีติดตั้งโครงการ" />
          </Tabs>
        )}

        {/* Content Display */}
        <Box sx={{ paddingTop: "20px" }}>
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
                       <Typography sx={{ fontSize: "1.25rem", fontWeight: 600, color: "#28378B", mb: 2.5 }}>
                        จัดการข้อมูลย้อนหลัง
                      </Typography>
                      <Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.disabled", letterSpacing: "0.06em", mb: 1.5, textTransform: "uppercase", fontFamily: "'Prompt', sans-serif" }}>
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
                            <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.975rem", color: "text.primary", lineHeight: 1.5 }}>{s.main}</Typography>
                            <Typography sx={{ fontFamily: "'Prompt', sans-serif", fontSize: "0.875rem", color: "text.secondary" }}>{s.sub}</Typography>
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
