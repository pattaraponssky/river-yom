'use client';

import React, { useEffect, useState } from "react";
import { Box, Tabs, Tab, Typography, Grid, CircularProgress } from '@mui/material';
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
            icon={<HomeRepairService />} // ไอคอนลิงค์เพิ่มเติม
            iconPosition="start"
            label="ประวัติการทำงาน"
          />
          <Tab
            sx={{ ...fontTitle}}
            icon={<Info />} // ไอคอนเกี่ยวกับเรา
            iconPosition="start"
            label="ข้อมูลเว็บไซต์"
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
            {/* <Tab sx={titleStyle} label="ข้อมูลสถานีวัดระดับน้ำทะเล" /> */}
          </Tabs>
        )}

        {/* Content Display */}
        <Box sx={{ paddingTop: "20px" }}>

          {/* {mainTab === 0 && (
            <Typography sx={{ marginBottom: "1rem", fontWeight: 600, ...titleStyle, color: "#28378B" }}>
              ⚙️ หน้าการตั้งค่าระบบ 
            </Typography>
          )}
           */}
            {/* {mainTab === 0 && subTab === 0 && <InfoDamStation />} */}
            {mainTab === 0 && subTab === 0 && <InfoRainStation />}
            {mainTab === 0 && subTab === 1 && <InfoFlowStation />}
            {mainTab === 0 && subTab === 2 && <InfoGateStation />}
            {/* {mainTab === 0 && subTab === 3 && <InfoSeaStation />} */}
          {mainTab === 1 && (
            <Box sx={{ p: 2 }}>
                <UploadData />
              <Grid container spacing={2}>
                {/* <Grid size={{ xs: 12, sm: 6 }}>
                    <ManualUpdateReservoir />
                </Grid> */}
              </Grid>
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
            </Box>
          )}

          {mainTab === 2 && (
            <Typography sx={{ marginBottom: "1rem", fontWeight: 600, ...titleStyle, color: "#28378B" }}>
            </Typography>
          )}

          {mainTab === 3 && (
            <Typography sx={{ marginBottom: "1rem", fontWeight: 600, ...titleStyle, color: "#28378B" }}>
              <EditAboutUs/>
            </Typography>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default Setting;
