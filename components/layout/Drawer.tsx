// src/components/layout/DrawerComponent.tsx
'use client';

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
} from "@mui/material";
import Link from "next/link"; // ใช้ของ Next.js
import { usePathname } from "next/navigation"; // ใช้แทน useLocation
import DashboardIcon from "@mui/icons-material/Dashboard";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import GroupIcon from "@mui/icons-material/Group";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TsunamiIcon from "@mui/icons-material/Tsunami";
import PlaceIcon from "@mui/icons-material/Place";
import WaterDamageIcon from "@mui/icons-material/WaterDamage";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import MenuIcon from "@mui/icons-material/Menu";
import LoginDialog from "../Users/LoginDialog";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import StorageIcon from "@mui/icons-material/Storage";
import OpacityIcon from "@mui/icons-material/Opacity";
import { Path_URL } from "../../lib/utility";
import { useAuth } from "../hooks/useAuth";

interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const menuItems = [
  {
    icon: <DashboardIcon sx={{ marginRight: "15px", color: "#1976d2" }} />,
    text: "สรุปสถานการณ์น้ำ",
    path: "/dashboard",
  },
  {
    icon: <ModelTrainingIcon sx={{ marginRight: "15px", color: "#1976d2" }} />,
    text: "ผลพยากรณ์",
    path: "/forecast",
  },
  {
    icon: <DataUsageIcon sx={{ marginRight: "15px", color: "#1976d2" }} />,
    text: "แบบจำลอง",
    path: "/model",
  },
  {
    icon: <SettingsIcon sx={{ marginRight: "15px", color: "#1976d2" }} />,
    text: "ตั้งค่า",
    path: "/setting",
  },
  {
    icon: <GroupIcon sx={{ marginRight: "15px", color: "#1976d2" }} />,
    text: "ผู้ใช้งาน",
    path: "/users",
  },
  {
    icon: <InfoIcon sx={{ marginRight: "15px", color: "#1976d2" }} />,
    text: "เกี่ยวกับเรา",
    path: "/aboutus",
  },
];

const DrawerComponent: React.FC<DrawerProps> = ({ open, setOpen }) => {
  const [stationOpen, setStationOpen] = useState(false);
  const pathname = usePathname(); // ← เปลี่ยนจาก useLocation เป็น usePathname
  const drawerWidth = open ? 290 : 72;
  const { currentUser, setCurrentUser, handleLogout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const storedUser = localStorage.getItem("user");
  const iduser_level = storedUser ? JSON.parse(storedUser).iduser_level : null;
  const [loginOpen, setLoginOpen] = useState(false);

  const handleItemClick = () => {
    if (isMobile || (open && !isMobile)) setOpen(false);
  };

  return (
    <Drawer
      variant={isMobile || open ? "temporary" : "persistent"}
      open={isMobile ? open : true}
      onClose={() => setOpen(false)}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: "nowrap",
        zIndex: (theme) => theme.zIndex.appBar + 1,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          overflowX: "hidden",
          backgroundColor: theme.palette.background.paper, // เปลี่ยนตามธีม
          color: theme.palette.text.primary,
          transition: "width 0.3s",
          boxShadow: "4px 0px 15px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      {/* ส่วนหัว Logo + ปุ่มปิด/เปิด */}
      <Box
        display="flex"
        justifyContent={open ? "flex-end" : "center"}
        alignItems="center"
        padding="10px"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {open && (
          <Box
            sx={{
              marginLeft: "auto",
              justifyContent: { md: "center", xs: "flex-start" },
              alignItems: "center",
              display: "flex",
              width: "267px",
            }}
          >
            <img
              src={`${Path_URL}images/logo_rid.png`}
              alt="Logo"
              style={{ height: "40px", paddingRight: "10px" }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontFamily: "Noto Sans Thai",
                color: theme.palette.primary.main,
                fontSize: { md: "1.2rem", xs: "1.1rem" },
                marginRight: { md: "10px", xs: "0" },
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
              backgroundColor: theme.palette.primary.dark,
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

      <List>
        {/* เมนูหลัก */}
        {menuItems.slice(0, 2).map((item, index) => (
          <ListItem
            key={index}
            component={Link}
            href={item.path} // เปลี่ยนจาก to เป็น href
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
                color: theme.palette.primary.main,
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
                    fontFamily: "Noto Sans Thai",
                  },
                }}
              />
            )}
          </ListItem>
        ))}

        {/* เมนูย่อย (ข้อมูลสถานี) */}
        <ListItem
          onClick={() => setStationOpen(!stationOpen)}
          sx={{
            padding: "8px 20px",
            justifyContent: open ? "initial" : "center",
            position: "relative",
            "&:hover": { backgroundColor: theme.palette.action.hover },
          }}
        >
          <StorageIcon sx={{ marginRight: open ? "15px" : "0", color: theme.palette.primary.main }} />
          {open && (
            <>
              <ListItemText
                primary="ข้อมูล"
                primaryTypographyProps={{
                  sx: {
                    fontSize: { md: "1.2rem", xs: "1rem" },
                    fontWeight: 600,
                    fontFamily: "Noto Sans Thai",
                    color: theme.palette.primary.main,
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
              { path: "/sealevel", icon: <TsunamiIcon />, text: "สถานีวัดระดับน้ำทะเล" },
            ].map((item) => (
              <ListItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={handleItemClick}
                sx={{
                  paddingLeft: open ? "40px" : "25px",
                  backgroundColor: pathname === item.path ? theme.palette.action.selected : "inherit",
                  "&:hover": { backgroundColor: theme.palette.action.hover },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    marginRight: open ? "15px" : "0",
                    color: theme.palette.primary.main,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: { fontFamily: "Noto Sans Thai", fontWeight: "bold" },
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* เมนูอื่น ๆ (เช่น แบบจำลอง, ตั้งค่า, ผู้ใช้งาน, เกี่ยวกับเรา) */}
        {menuItems.slice(2).map((item, index) => (
          <ListItem
            key={index}
            component={Link}
            href={item.path}
            onClick={handleItemClick}
            sx={{
              justifyContent: open ? "initial" : "center",
              backgroundColor: pathname === item.path ? theme.palette.action.selected : "inherit",
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                marginLeft: open ? "5px" : "15px",
                color: theme.palette.primary.main,
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
                    fontFamily: "Noto Sans Thai",
                  },
                }}
              />
            )}
          </ListItem>
        ))}
      </List>

      {/* ส่วนผู้ใช้ อยู่ด้านล่าง */}
      <Box
        sx={{
          marginTop: "auto",
          padding: "15px",
          borderTop: `1px solid ${theme.palette.divider}`,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {currentUser ? (
          <>
            {open && (
              <>
                <Avatar
                  alt={currentUser.username}
                  src={`${Path_URL}images/icons/user_icon.png`}
                  sx={{ width: 40, height: 40, bgcolor: "white", p: "7px", m: 1 }}
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
              </>
            )}

            <IconButton
              onClick={handleLogout}
              aria-label="logout"
              sx={{ color: "error.main", "&:hover": { color: "error.dark" } }}
            >
              <LogoutIcon />
            </IconButton>
          </>
        ) : (
          <>
            {open ? (
              <Button
                fullWidth
                color="inherit"
                onClick={() => setLoginOpen(true)}
                sx={{
                  fontFamily: "Noto Sans Thai",
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
        onLoginSuccess={(user) => {
          setCurrentUser({
            iduser_level: user.iduser_level || 0,
            username: user.username,
            email: user.email,
          });
        }}
      />
    </Drawer>
  );
};

export default DrawerComponent;