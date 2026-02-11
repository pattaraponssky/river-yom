"use client";

import React, { useEffect, useState } from "react";
import { Box, Tab, Tabs, CircularProgress, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People"; // เปลี่ยนชื่อให้ถูกต้อง (จาก Users → People)
import EditUser from "@/components/Users/EditUser";
import UserManagement from "@/components/Users/UserManagement";
import { BoxStyle, titleStyle } from "@/theme/style";
import { useAuth } from "@/contexts/AuthContext"; // ใช้จาก context ที่ปรับแล้ว

const UserPage: React.FC = () => {
  const [mainTab, setMainTab] = useState(0);
  const { currentUser, loading, requirePermission } = useAuth();
  const iduser_level = currentUser?.iduser_level ?? 0;

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };

  useEffect(() => {
    if (!loading) {
          requirePermission(1, '/dashboard');
        }
      }, [loading, requirePermission]);
    
    if (loading) {
      return <div>กำลังตรวจสอบสิทธิ์...</div>;
    }
    
    if (!currentUser || currentUser.iduser_level < 2) {
      return <div>ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;
    }

  const canManageUsers = iduser_level === 2 || iduser_level === 3;

  return (
    <Box sx={BoxStyle}>
      <Tabs
        value={mainTab}
        onChange={handleMainTabChange}
        aria-label="ผู้ใช้เมนู"
        sx={{
          mb: 3,
          overflowX: "auto",
          whiteSpace: "nowrap",
        }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          sx={titleStyle}
          icon={<PersonIcon />}
          iconPosition="start"
          label="แก้ไขข้อมูลผู้ใช้"
        />
        {canManageUsers && (
          <Tab
            sx={titleStyle}
            icon={<PeopleIcon />}
            iconPosition="start"
            label="จัดการข้อมูลผู้ใช้ในระบบ"
          />
        )}
      </Tabs>

      {mainTab === 0 && (
        <Box>
          <EditUser/>
        </Box>
      )}

      {canManageUsers && mainTab === 1 && (
        <Box>
          <UserManagement />
        </Box>
      )}
    </Box>
  );
};

export default UserPage;