// src/components/layout/DrawerComponent.tsx
"use client";

import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Box,
  ListItemIcon,
  Typography,
  useMediaQuery,
  useTheme,
  Avatar,
  Button,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
import InfoIcon from "@mui/icons-material/Info";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlaceIcon from "@mui/icons-material/Place";
import WaterDamageIcon from "@mui/icons-material/WaterDamage";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import LoginDialog from "../Users/LoginDialog";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import StorageIcon from "@mui/icons-material/Storage";
import OpacityIcon from "@mui/icons-material/Opacity";
import { Path_URL } from "../../lib/utility";
import { useAuth } from "@/contexts/AuthContext"; // ← ใช้จาก AuthContext (ไม่ใช่ hooks/useAuth)
import { Handyman } from "@mui/icons-material";
import AccountTreeIcon from '@mui/icons-material/AccountTree';

interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

// เมนูหลัก (ทุกคนเห็นได้)
const publicMenuItems = [
  {
    icon: <DashboardIcon sx={{ marginRight: "15px" }} />,
    text: "สรุปสถานการณ์น้ำ",
    path: "/dashboard",
  },
   {
    icon: <AccountTreeIcon sx={{ marginRight: "15px" }} />,
    text: "แผนผังลุ่มน้ำ",
    path: "/schematic",
  },
  {
    icon: <ModelTrainingIcon sx={{ marginRight: "15px" }} />,
    text: "ผลพยากรณ์",
    path: "/forecast",
  },
  {
    icon: <InfoIcon sx={{ marginRight: "15px" }} />,
    text: "เกี่ยวกับเรา",
    path: "/aboutus",
  },
];

// เมนูที่ต้องมีสิทธิ์ระดับ 1-2
const advancedMenuItems = [
  {
    icon: <DataUsageIcon sx={{ marginRight: "15px" }} />,
    text: "แบบจำลอง",
    path: "/model",
  },
  {
    icon: <Handyman sx={{ marginRight: "15px" }} />,
    text: "รายการอุปกรณ์",
    path: "/equipment",
  },
];

// เมนู admin เท่านั้น (ระดับ 2)
const adminMenuItems = [
  {
    icon: <SettingsIcon sx={{ marginRight: "15px" }} />,
    text: "ตั้งค่า",
    path: "/setting",
  },
  {
    icon: <GroupIcon sx={{ marginRight: "15px" }} />,
    text: "ผู้ใช้งาน",
    path: "/users",
  },
];

const DrawerComponent: React.FC<DrawerProps> = ({ open, setOpen }) => {
  const [stationOpen, setStationOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, loading: authLoading, logout } = useAuth();
  const iduser_level = currentUser?.iduser_level ?? 0;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loginOpen, setLoginOpen] = useState(false);
  const drawerWidth = open ? 290 : 72;
  

  const handleItemClick = () => {
    if (isMobile || (open && !isMobile)) setOpen(false);
  };

  if (authLoading) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Drawer
        variant={isMobile || open ? "temporary" : "persistent"}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          zIndex: theme.zIndex.appBar + 1,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            overflowX: "hidden",
            backgroundColor:
              theme.palette.mode === "dark"
                ? theme.palette.background.default // หรือ "#0f172a" (slate-900)
                : "#f8fafc", // slate-50 สีเทาอ่อนสะอาดตา
            color: theme.palette.text.primary,
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            boxShadow:
              theme.palette.mode === "dark"
                ? "4px 0 20px rgba(0,0,0,0.5)"
                : "4px 0 15px rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* ส่วนหัว Logo + ปุ่มปิด/เปิด */}
        <Box
          display="flex"
          justifyContent={open ? "space-between" : "center"}
          alignItems="center"
          padding="12px 16px"
          sx={{
            // พื้นหลังส่วนหัวเด่นขึ้น
            background:
              theme.palette.mode === "dark"
                ? `linear-gradient(to bottom,
                  ${theme.palette.background.paper},
                  ${theme.palette.background.default}
                )`
                : `linear-gradient(to bottom,
                  ${theme.palette.primary.light}22,
                  ${theme.palette.background.paper}
                )`,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          {open && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <img src={`${Path_URL}images/logo_rid.png`} alt="Logo" style={{ height: "48px" }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontFamily: "Prompt",
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,

                  letterSpacing: "-0.5px",
                }}
              >
                ระบบบริหารจัดการน้ำ
              </Typography>
            </Box>
          )}
          <IconButton
            onClick={() => setOpen(!open)}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: "#fff",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? `linear-gradient(to bottom,
                    ${theme.palette.background.paper},
                    ${theme.palette.background.default}
                  )`
                    : `linear-gradient(to bottom,
                    ${theme.palette.primary.light}22,
                    ${theme.palette.background.paper}
                  )`,
              },
              borderRadius: "50%",
              boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.3)",
              width: 40,
              height: 40,
            }}
          >
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        <List sx={{ px: 1 }}>
          {/* เมนูหลัก */}
          {publicMenuItems.map((item, index) => (
            <ListItem
              key={index}
              component={Link}
              href={item.path}
              onClick={handleItemClick}
              sx={{
                padding: "8px 20px",
                justifyContent: open ? "initial" : "center",
                backgroundColor: pathname === item.path ? theme.palette.action.selected : "inherit",
                "&:hover": { backgroundColor: theme.palette.action.hover },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  marginLeft: open ? "0" : "15px",
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,
                }}
              >
                {item.icon}
              </ListItemIcon>

              {open && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: { md: "1.2rem", xs: "1rem" },
                      fontWeight: 600,
                      fontFamily: "Prompt",
                    },
                  }}
                />
              )}
            </ListItem>
          ))}

          {/* เมนูย่อย - ข้อมูลสถานี (ทุกคนเห็น) */}
          <ListItem
            onClick={() => setStationOpen(!stationOpen)}
            sx={{
              borderRadius: "8px",
              marginY: "4px",
              padding: "8px 20px",
              justifyContent: open ? "initial" : "center",
              backgroundColor: stationOpen ? theme.palette.primary.main + "11" : "transparent",
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <StorageIcon
              sx={{ marginRight: open ? "15px" : "0", color: theme.palette.primary.main }}
            />
            {open && (
              <>
                <ListItemText
                  primary="ข้อมูล"
                  primaryTypographyProps={{
                    sx: {
                      fontSize: { md: "1.2rem", xs: "1rem" },
                      fontWeight: 600,
                      fontFamily: "Prompt",
                      color:
                        theme.palette.mode === "dark"
                          ? theme.palette.primary.light
                          : theme.palette.primary.main,
                    },
                  }}
                />
                {stationOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </>
            )}
          </ListItem>

          <Collapse in={stationOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {[
                { path: "/reservoir", icon: <WaterDamageIcon />, text: "อ่างเก็บน้ำ" },
                { path: "/rain", icon: <WaterDropIcon />, text: "สถานีวัดน้ำฝน" },
                { path: "/flow", icon: <PlaceIcon />, text: "สถานีน้ำท่า" },
                { path: "/gate", icon: <OpacityIcon />, text: "ประตูระบายน้ำ" },
              ].map((item) => (
                <ListItem
                  key={item.path}
                  component={Link}
                  href={item.path}
                  onClick={handleItemClick}
                  sx={{
                    paddingLeft: open ? "30px" : "15px",
                    backgroundColor:
                      pathname === item.path ? theme.palette.action.selected : "inherit",
                    "&:hover": { backgroundColor: theme.palette.action.hover },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      marginRight: open ? "15px" : "0",
                      color:
                        theme.palette.mode === "dark"
                          ? theme.palette.primary.light
                          : theme.palette.primary.main,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        sx: { fontFamily: "Prompt", fontWeight: "bold" },
                      }}
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Collapse>

          {iduser_level === 1 || iduser_level === 2 ? (
            advancedMenuItems.map((item, index) => (
              <ListItem
                key={index}
                component={Link}
                href={item.path}
                onClick={handleItemClick}
                sx={{
                  justifyContent: open ? "initial" : "center",
                  backgroundColor: pathname === item.path ? theme.palette.action.selected : "inherit",
                  "&:hover": { backgroundColor: theme.palette.action.hover },
                  display: [1, 2].includes(iduser_level) ? "flex" : "none",
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    marginLeft: open ? "5px" : "15px",
                    color:
                      theme.palette.mode === "dark"
                        ? theme.palette.primary.light
                        : theme.palette.primary.main,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: { md: "1.2rem", xs: "1rem" },
                        fontWeight: 600,
                        fontFamily: "Prompt",
                      },
                    }}
                  />
                )}
              </ListItem>
            ))) : null}

          {iduser_level === 2 ? (
          adminMenuItems.map((item, index) => (
            <ListItem
              key={index}
              component={Link}
              href={item.path}
              onClick={handleItemClick}
              sx={{
                justifyContent: open ? "initial" : "center",
                backgroundColor: pathname === item.path ? theme.palette.action.selected : "inherit",
                "&:hover": { backgroundColor: theme.palette.action.hover },
                display: iduser_level === 2 ? "flex" : "none",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  marginLeft: open ? "5px" : "15px",
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,
                }}
              >
                {item.icon}
              </ListItemIcon>

              {open && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: { md: "1.2rem", xs: "1rem" },
                      fontWeight: 600,
                      fontFamily: "Prompt",
                    },
                  }}
                />
              )}
            </ListItem>
          ))) : null}
        </List>

        {/* ส่วนผู้ใช้ อยู่ด้านล่าง */}
        <Box
          sx={{
            marginTop: "auto",
            padding: "16px",
            borderTop: `1px solid ${theme.palette.divider}`,
            background:
              theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.6)" : "rgba(248, 250, 252, 0.8)",
          }}
        >
          {currentUser ? (
            <>
              {open && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                  <Avatar
                    alt={currentUser.username}
                    src={`${Path_URL}images/icons/user_icon.png`}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor:
                        theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
                      p: "7px",
                      m: 1,
                      border: `2px solid ${theme.palette.primary.main}`,
                    }}
                  />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: { md: "1rem", xs: "0.8rem" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: theme.palette.text.primary,
                      }}
                    >
                      {currentUser.username}
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={logout}
                    aria-label="logout"
                    sx={{ color: "error.main", "&:hover": { color: "error.dark" } }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </Box>
                )
              }
            </>
          ) : (
            <>
              {open ? (
                <Button
                  fullWidth
                  color="inherit"
                  onClick={() => setLoginOpen(true)}
                  sx={{
                    fontFamily: "Prompt",
                    fontSize: { md: "1rem", xs: "0.8rem" },
                    fontWeight: 600,
                    borderRadius: "999px",
                    background: "linear-gradient(to right, #43A047, #66BB6A)",
                    color: "#fff",
                    "&:hover": {
                      background: "linear-gradient(to right, #388E3C, #4CAF50)",
                    },
                  }}
                >
                  เข้าสู่ระบบ
                </Button>
              ) : (
                <IconButton
                  onClick={() => setLoginOpen(true)}
                  aria-label="login"
                  sx={{
                    color: theme.palette.success.main,
                    "&:hover": { color: theme.palette.success.dark },
                  }}
                >
                  <LoginIcon />
                </IconButton>
              )}
            </>
          )}
        </Box>

        <LoginDialog
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={() => {
            window.location.reload();
          }}
        />
      </Drawer>
    </>
  );
};

export default DrawerComponent;
