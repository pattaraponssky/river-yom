"use client";

import { Box, CircularProgress, Divider, Tab, Tabs, Typography,  } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import { BoxStyle, fontTitle } from "@/theme/style";
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import React,{ useState } from "react";
import RainInputTable from "@/components/Model/InputTable";
import RunAll from "@/components/Model/RunAll";
import RunHecHms from "@/components/Model/RunHecHms";
import RunHecRas from "@/components/Model/RunHecRas";
import { useAuth } from "@/contexts/AuthContext";

const HecRun: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);
   const {currentUser, loading: authLoading } = useAuth();
   const iduser_level = currentUser?.iduser_level ?? 0;
   const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
    };
    
      // ถ้ายังโหลด auth อยู่ → แสดง loading
      if (authLoading) {
        return (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        );
      }
    
      if (!currentUser) {
        return (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="error">
              กรุณาเข้าสู่ระบบก่อน
            </Typography>
          </Box>
        );
      }
  return (
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
          <Tab
            sx={{ ...fontTitle }}
            icon={<FolderIcon />} // ไอคอนการตั้งค่าระบบ
            iconPosition="start"
            label="เตรียมข้อมูลแบบจำลอง"
          />
          <Tab
            sx={{ ...fontTitle }}
            icon={<ModelTrainingIcon />} // ไอคอนข้อมูลสถานี
            iconPosition="start"
            label="รันแบบจำลอง"
          />
        </Tabs>

        {/* Content Display */}
        <Box sx={{ paddingTop: "20px" }}>
          {mainTab === 0 && (
              <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt",  }}>
                <RainInputTable/>
              </Typography>
          )}
          {mainTab === 1 && (
              <>
               <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Prompt", color: "red" }}>
                   ***กรุณาทำการเตรียมข้อมูลก่อนรันแบบจำลอง
                </Typography>
                <RunAll/>
                <Divider sx={{ my: 3 }} />
                <RunHecHms/>
                <RunHecRas />
                {/* <RunGate /> */}
              </>
            )}
          </Box>
        </Box>
  );
};

export default HecRun;
