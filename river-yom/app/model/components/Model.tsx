'use client';

import { Box, Divider, Tab, Tabs, Typography, Paper, Stack } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import { BoxStyle, fontTitle } from "@/theme/style";
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import React,{ useEffect, useState } from "react";
import RainInputTable from "@/components/Model/InputTable";
import RunAll from "@/components/Model/RunAll";
import RunHecHms from "@/components/Model/RunHecHms";
import RunHecRas from "@/components/Model/RunHecRas";
import { useAuth } from "@/contexts/AuthContext";

const HecRun: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);
  const { currentUser, loading, requirePermission } = useAuth();
   
  useEffect(() => {
    if (!loading) {
      requirePermission(1, '/dashboard');
    }
  }, [loading, requirePermission]);
      
  if (loading) {
    return <Typography sx={{ p: 2, fontFamily: 'Prompt' }}>กำลังตรวจสอบสิทธิ์...</Typography>;
  }
      
  if (!currentUser || currentUser.iduser_level < 1) {
    return <Typography sx={{ p: 2, fontFamily: 'Prompt' }}>ไม่มีสิทธิ์เข้าถึงหน้านี้</Typography>;
  }
      
  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };
    
  return (
    <Box sx={{ ...BoxStyle }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <ModelTrainingIcon color="primary" />
        <Typography sx={{ fontFamily: "Prompt", fontWeight: 700, fontSize: { xs: '1rem', md: '1.1rem' } }}>
          การจำลองแบบน้ำ
        </Typography>
      </Stack>

      <Tabs
        value={mainTab}
        onChange={handleMainTabChange}
        aria-label="main category"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider', minHeight: 42 }}
      >
        <Tab
          sx={{ ...fontTitle, minHeight: 42, py: 0 }}
          icon={<FolderIcon fontSize="small" />}
          iconPosition="start"
          label="เตรียมข้อมูลแบบจำลอง"
        />
        <Tab
          sx={{ ...fontTitle, minHeight: 42, py: 0 }}
          icon={<ModelTrainingIcon fontSize="small" />}
          iconPosition="start"
          label="รันแบบจำลอง"
        />
      </Tabs>

      <Box>
        {mainTab === 0 && (
          <Box>
            <RainInputTable/>
          </Box>
        )}
        {mainTab === 1 && (
          <Box sx={{ maxWidth: 1100, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper variant="outlined" sx={{ px: 2, py: 1.25, borderRadius: 2, display: 'flex', alignItems: 'flex-start', gap: 1, bgcolor: 'warning.light', borderColor: 'warning.main' }}>
              <InfoOutlinedIcon color="warning" sx={{ mt: 0.25 }} />
              <Typography sx={{ fontFamily: "Prompt", fontSize: '0.85rem' }}>
                กรุณาเตรียมข้อมูลน้ำฝน-น้ำท่าให้ครบถ้วนและกด &ldquo;ซิงค์และโหลดข้อมูลล่าสุด&rdquo; ก่อนเริ่มรันแบบจำลอง
              </Typography>
            </Paper>
            <RunAll/>
            <Divider />
            <RunHecHms/>
            <RunHecRas />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HecRun;
