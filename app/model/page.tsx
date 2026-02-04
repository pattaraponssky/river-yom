import React, { useState } from "react";
import { Box, Divider, Tab, Tabs, Typography,  } from "@mui/material";
import RunHecHms from "../../components/Model/RunHecHms";
import RunHecRas from "../../components/Model/RunHecRas";

import FolderIcon from '@mui/icons-material/Folder';
import RainInputTable from "../../components/Model/InputTable";
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import RunAll from "../../components/Model/RunAll";

const BoxStyle = {
  margin: "auto",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: 3,
  marginBottom: "20px",
  padding: "20px",
};

const FontStyle = {
  fontFamily: "Noto Sans Thai",
  fontSize: {md:"1.4rem", xs:"1.1rem"},
  fontWeight: 600,
};

const HecRun: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);
    const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
    };
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
            sx={{ ...FontStyle }}
            icon={<FolderIcon />} // ไอคอนการตั้งค่าระบบ
            iconPosition="start"
            label="เตรียมข้อมูลแบบจำลอง"
          />
          <Tab
            sx={{ ...FontStyle }}
            icon={<ModelTrainingIcon />} // ไอคอนข้อมูลสถานี
            iconPosition="start"
            label="รันแบบจำลอง"
          />
        </Tabs>

        {/* Content Display */}
        <Box sx={{ paddingTop: "20px" }}>
          {mainTab === 0 && (
              <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Noto Sans Thai",  }}>
                <RainInputTable/>
              </Typography>
          )}
          {mainTab === 1 && (
              <>
               <Typography variant="h5" sx={{ marginBottom: "1rem", fontWeight: 600, fontFamily: "Noto Sans Thai", color: "red" }}>
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
