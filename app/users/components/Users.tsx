"use client";

import React, { useState } from "react";
import { Box, Tab, Tabs, CircularProgress, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People"; // เปลี่ยนชื่อให้ถูกต้อง (จาก Users → People)
import EditUser from "@/components/Users/EditUser";
import UserManagement from "@/components/Users/UserManagement";
import { BoxStyle, titleStyle } from "@/theme/style";
import { useAuth } from "@/contexts/AuthContext"; // ใช้จาก context ที่ปรับแล้ว

const UserPage: React.FC = () => {
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
          <EditUser token={localStorage.getItem("token") || ""} />
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