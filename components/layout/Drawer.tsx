// src/components/layout/DrawerComponent.tsx
'use client';
import React, { useState } from "react";
import {
  Drawer, List, ListItem, ListItemText, Collapse,
  IconButton, Box, ListItemIcon, Typography,
  useMediaQuery, useTheme, Avatar, Button, CircularProgress, Tooltip, Chip,
  Menu,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
import InfoIcon from "@mui/icons-material/Info";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlaceIcon from "@mui/icons-material/Place";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import StorageIcon from "@mui/icons-material/Storage";
import OpacityIcon from "@mui/icons-material/Opacity";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AssessmentIcon from '@mui/icons-material/Assessment';
import WaterfallChartIcon from '@mui/icons-material/WaterfallChart';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import { Handyman } from "@mui/icons-material";
import LoginDialog from "../Users/LoginDialog";
import { Path_URL } from "../../lib/utility";
import { useAuth } from "@/contexts/AuthContext";

interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const publicMenuItems = [
  { icon: <AccountTreeIcon fontSize="small" />, text: "แผนผังลุ่มน้ำ", path: "/schematic" },
  { icon: <InfoIcon fontSize="small" />, text: "เกี่ยวกับเรา", path: "/aboutus" },
];

const advancedMenuItems = [
  { icon: <DataUsageIcon fontSize="small" />, text: "แบบจำลอง", path: "/model" },
  { icon: <Handyman fontSize="small" />, text: "รายการอุปกรณ์", path: "/equipment" },
];

const adminMenuItems = [
  { icon: <SettingsIcon fontSize="small" />, text: "ตั้งค่า", path: "/setting" },
  { icon: <GroupIcon fontSize="small" />, text: "ผู้ใช้งาน", path: "/users" },
];

const subDashboardItems = [
  { path: "/dashboard", icon: <WaterfallChartIcon fontSize="small" />, text: "สถานการณ์น้ำประจำวัน" },
  { path: "/forecast", icon: <ModelTrainingIcon fontSize="small" />, text: "ผลพยากรณ์น้ำโดยโมเดล" },
  { path: "/report", icon: <AssessmentIcon fontSize="small" />, text: "รายงานสถานการณ์น้ำ สชป.3" },
];

const subStationItems = [
  { path: "/rain", icon: <WaterDropIcon fontSize="small" />, text: "สถานีวัดน้ำฝน" },
  { path: "/flow", icon: <PlaceIcon fontSize="small" />, text: "สถานีน้ำท่า" },
  { path: "/gate", icon: <OpacityIcon fontSize="small" />, text: "ประตูระบายน้ำ" },
];

const SectionLabel = ({ label, open }: { label: string; open: boolean }) =>
  open ? (
    <Typography
      sx={{
        fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.07em',
        color: 'text.disabled', px: 1.5, pt: 1.5, pb: 0.5,
        textTransform: 'uppercase', fontFamily: 'Prompt',
      }}
    >
      {label}
    </Typography>
  ) : <Box sx={{ my: 0.5, mx: 1, borderTop: '0.5px solid', borderColor: 'divider' }} />;

const DrawerComponent: React.FC<DrawerProps> = ({ open, setOpen }) => {
  const [stationOpen, setStationOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, loading: authLoading, logout } = useAuth();
  const iduser_level = currentUser?.iduser_level ?? 0;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loginOpen, setLoginOpen] = useState(false);
  const [stationAnchorEl, setStationAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardAnchorEl, setDashboardAnchorEl] = useState<null | HTMLElement>(null);

  const drawerWidth = open ? 268 : 68;
  const isDark = theme.palette.mode === 'dark';

  const handleItemClick = () => {
    if (isMobile) setOpen(false);
  };

  if (authLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  const handleStationClick = (event: React.MouseEvent<HTMLElement>) => {
    if (open) {
      // โหมดเปิด → toggle collapse ปกติ
      setStationOpen(!stationOpen);
    } else {
      // โหมดย่อ → เปิด popup menu
      setStationAnchorEl(event.currentTarget);
    }
  };

  const handleDashboardClick = (event: React.MouseEvent<HTMLElement>) => {
    if (open) {
      // โหมดเปิด → toggle collapse ปกติ
      setDashboardOpen(!dashboardOpen);
    } else {
      // โหมดย่อ → เปิด popup menu
      setDashboardAnchorEl(event.currentTarget);
    }
  };

  const handleStationPopupClose = () => setStationAnchorEl(null);
  const handleDashboardPopupClose = () => setDashboardAnchorEl(null);

  const menuItemSx = (path: string) => ({
    borderRadius: '8px',
    mb: 0.25,
    px: open ? 1.5 : 0,
    py: 0.9,
    justifyContent: open ? 'flex-start' : 'center',
    color: pathname === path ? 'primary.main' : 'text.secondary',
    backgroundColor: pathname === path
      ? (isDark ? 'rgba(21,101,192,0.18)' : 'rgba(21,101,192,0.08)')
      : 'transparent',
    '&:hover': {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      color: 'text.primary',
    },
    transition: 'all 0.15s',
  });

  const iconSx = (path?: string) => ({
    minWidth: 0,
    mr: open ? 1.5 : 0,
    color: path && pathname === path ? 'primary.main' : 'text.secondary',
  });

  return (
    <>
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          zIndex: theme.zIndex.appBar + 1,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            overflowX: 'hidden',
            backgroundColor: isDark ? theme.palette.background.default : '#f8fafc',
            borderRight: `0.5px solid ${theme.palette.divider}`,
            boxShadow: isDark
              ? '4px 0 24px rgba(0,0,0,0.4)'
              : '4px 0 16px rgba(0,0,0,0.06)',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* ─── หัว: Logo + Toggle ─── */}
        <Box
          sx={{
            mt: "64px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            px: open ? 1.5 : 0,
            py: 1.2,
            borderBottom: `0.5px solid ${theme.palette.divider}`,
            background: isDark
              ? 'linear-gradient(to bottom, rgba(21,101,192,0.12), transparent)'
              : 'linear-gradient(to bottom, rgba(21,101,192,0.06), transparent)',
            minHeight: 64,
          }}
        >
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box
                sx={{
                  width: 38, height: 38, borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={`${Path_URL}images/logo_rid.png`}
                  alt="RID Logo"
                  style={{ height: isMobile ? 38 : 46, objectFit: 'contain' }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Prompt', lineHeight: 1.3, color: 'text.primary', whiteSpace: 'nowrap' }}>
                  ระบบบริหารจัดการน้ำ
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: 'Prompt' }}>
                  พื้นที่ฝั่งขวาแม่น้ำยม
                </Typography>
              </Box>
            </Box>
          )}

          <Tooltip title={open ? 'ย่อเมนู' : 'ขยายเมนู'} placement="right">
            <IconButton
              onClick={() => setOpen(!open)}
              size="small"
              sx={{
                width: 30, height: 30,
                borderRadius: '8px',
                border: `0.5px solid ${theme.palette.divider}`,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(21,101,192,0.08)',
                color: 'primary.main',
                '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(21,101,192,0.15)' },
              }}
            >
              {open ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* ─── เมนู ─── */}
        <List sx={{ px: 1, py: 1, flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <SectionLabel label="สรุปสถานการณ์น้ำ" open={open} />

          {/* ปุ่มข้อมูล (collapsible) */}
          <Tooltip title={!open ? 'สรุปสถานการณ์น้ำ' : ''} placement="right">
            <ListItem
              onClick={handleDashboardClick}
              sx={{
                ...menuItemSx(''),
                backgroundColor: dashboardOpen
                  ? (isDark ? 'rgba(21,101,192,0.1)' : 'rgba(21,101,192,0.06)')
                  : 'transparent',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : 0, color: dashboardOpen ? 'primary.main' : 'text.secondary' }}>
                <DashboardIcon fontSize="small" />
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText
                    primary="สรุปสถานการณ์น้ำ"
                    primaryTypographyProps={{
                      sx: { fontFamily: 'Prompt', fontSize: '1rem', fontWeight: 600, color: dashboardOpen ? 'primary.main' : 'text.secondary' },
                    }}
                  />
                  {dashboardOpen
                    ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  }
                </>
              )}
            </ListItem>
          </Tooltip>

          {/* โหมดเปิด → Collapse ปกติ */}
          <Collapse in={dashboardOpen && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 1 }}>
              {subDashboardItems.map((item) => (
                <ListItem
                  key={item.path}
                  component={Link}
                  href={item.path}
                  onClick={handleItemClick}
                  sx={{
                    ...menuItemSx(item.path),
                    pl: 3,
                    borderLeft: `2px solid ${pathname === item.path ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: '0 8px 8px 0',
                  }}
                >
                  <ListItemIcon sx={iconSx(item.path)}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ sx: { fontFamily: 'Prompt', fontSize: '0.825rem', fontWeight: pathname === item.path ? 600 : 600 } }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>


          {/* โหมดย่อ → Popup Menu */}
          <Menu
            anchorEl={dashboardAnchorEl}
            open={Boolean(dashboardAnchorEl)}
            onClose={handleDashboardPopupClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              elevation: 3,
              sx: {
                ml: 0.5,
                minWidth: 180,
                borderRadius: 2,
                border: `0.5px solid ${theme.palette.divider}`,
                '& .MuiMenuItem-root': {
                  fontFamily: 'Prompt',
                  fontSize: '1rem',
                  gap: 1.2,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  mx: 0.5,
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: 'text.primary' },
                },
              },
            }}
          >
            <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.65rem', fontWeight: 500, color: 'text.disabled', fontFamily: 'Prompt', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              สรุปสถานการณ์น้ำ
            </Typography>
            {subDashboardItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={handleDashboardPopupClose}
                selected={pathname === item.path}
                sx={{
                  color: pathname === item.path ? 'primary.main !important' : undefined,
                  fontWeight: pathname === item.path ? 600 : 600,
                  backgroundColor: pathname === item.path
                    ? `${isDark ? 'rgba(21,101,192,0.18)' : 'rgba(21,101,192,0.08)'} !important`
                    : undefined,
                }}  
              >
                <ListItemIcon sx={{ minWidth: 0, color: pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                {item.text}
              </MenuItem>
            ))}
          </Menu>

          {publicMenuItems.map((item) => (
            <Tooltip key={item.path} title={!open ? item.text : ''} placement="right">
              <ListItem component={Link} href={item.path} onClick={handleItemClick} sx={menuItemSx(item.path)}>
                <ListItemIcon sx={iconSx(item.path)}>{item.icon}</ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ sx: { fontFamily: 'Prompt', fontSize: '1rem', fontWeight: pathname === item.path ? 600 : 600 } }}
                  />
                )}
              </ListItem>
            </Tooltip>
          ))}

          <SectionLabel label="ข้อมูลสถานี" open={open} />

          {/* ปุ่มข้อมูล (collapsible) */}
          <Tooltip title={!open ? 'ข้อมูล' : ''} placement="right">
            <ListItem
              onClick={handleStationClick}
              sx={{
                ...menuItemSx(''),
                backgroundColor: stationOpen
                  ? (isDark ? 'rgba(21,101,192,0.1)' : 'rgba(21,101,192,0.06)')
                  : 'transparent',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 1.5 : 0, color: stationOpen ? 'primary.main' : 'text.secondary' }}>
                <StorageIcon fontSize="small" />
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText
                    primary="ข้อมูล"
                    primaryTypographyProps={{
                      sx: { fontFamily: 'Prompt', fontSize: '1rem', fontWeight: 600, color: stationOpen ? 'primary.main' : 'text.secondary' },
                    }}
                  />
                  {stationOpen
                    ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  }
                </>
              )}
            </ListItem>
          </Tooltip>

          {/* โหมดเปิด → Collapse ปกติ */}
          <Collapse in={stationOpen && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 1 }}>
              {subStationItems.map((item) => (
                <ListItem
                  key={item.path}
                  component={Link}
                  href={item.path}
                  onClick={handleItemClick}
                  sx={{
                    ...menuItemSx(item.path),
                    pl: 3,
                    borderLeft: `2px solid ${pathname === item.path ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: '0 8px 8px 0',
                  }}
                >
                  <ListItemIcon sx={iconSx(item.path)}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ sx: { fontFamily: 'Prompt', fontSize: '0.825rem', fontWeight: pathname === item.path ? 600 : 600 } }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>


          {/* โหมดย่อ → Popup Menu */}
          <Menu
            anchorEl={stationAnchorEl}
            open={Boolean(stationAnchorEl)}
            onClose={handleStationPopupClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              elevation: 3,
              sx: {
                ml: 0.5,
                minWidth: 180,
                borderRadius: 2,
                border: `0.5px solid ${theme.palette.divider}`,
                '& .MuiMenuItem-root': {
                  fontFamily: 'Prompt',
                  fontSize: '1rem',
                  gap: 1.2,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  mx: 0.5,
                  color: 'text.secondary',
                  '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: 'text.primary' },
                },
              },
            }}
          >
            <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.65rem', fontWeight: 500, color: 'text.disabled', fontFamily: 'Prompt', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              ข้อมูลสถานี
            </Typography>
            {subStationItems.map((item) => (
              <MenuItem
                key={item.path}
                component={Link}
                href={item.path}
                onClick={handleStationPopupClose}
                selected={pathname === item.path}
                sx={{
                  color: pathname === item.path ? 'primary.main !important' : undefined,
                  fontWeight: pathname === item.path ? 600 : 600,
                  backgroundColor: pathname === item.path
                    ? `${isDark ? 'rgba(21,101,192,0.18)' : 'rgba(21,101,192,0.08)'} !important`
                    : undefined,
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                {item.text}
              </MenuItem>
            ))}
          </Menu>

          {(iduser_level === 1 || iduser_level === 2) && (
            <>
              <SectionLabel label="ขั้นสูง" open={open} />
              {advancedMenuItems.map((item) => (
                <Tooltip key={item.path} title={!open ? item.text : ''} placement="right">
                  <ListItem component={Link} href={item.path} onClick={handleItemClick} sx={menuItemSx(item.path)}>
                    <ListItemIcon sx={iconSx(item.path)}>{item.icon}</ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ sx: { fontFamily: 'Prompt', fontSize: '1rem', fontWeight: pathname === item.path ? 600 : 600 } }}
                      />
                    )}
                  </ListItem>
                </Tooltip>
              ))}
            </>
          )}

          {iduser_level === 2 && (
            <>
              <SectionLabel label="ผู้ดูแลระบบ" open={open} />
              {adminMenuItems.map((item) => (
                <Tooltip key={item.path} title={!open ? item.text : ''} placement="right">
                  <ListItem component={Link} href={item.path} onClick={handleItemClick} sx={menuItemSx(item.path)}>
                    <ListItemIcon sx={iconSx(item.path)}>{item.icon}</ListItemIcon>
                    {open && (
                      <>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ sx: { fontFamily: 'Prompt', fontSize: '1rem', fontWeight: pathname === item.path ? 600 : 600 } }}
                        />
                        <Chip label="admin" size="small" sx={{ fontSize: '0.6rem', height: 18, fontFamily: 'Prompt', bgcolor: 'rgba(21,101,192,0.1)', color: 'primary.main' }} />
                      </>
                    )}
                  </ListItem>
                </Tooltip>
              ))}
            </>
          )}
        </List>

        {/* ─── ส่วนล่าง: User / Login ─── */}
        <Box
          sx={{
            px: open ? 1.5 : 2,
            py: 1.5,
            borderTop: `0.5px solid ${theme.palette.divider}`,
            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(248,250,252,0.9)',
          }}
        >
          {currentUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: open ? 1.2 : 0, justifyContent: open ? 'flex-start' : 'center' }}>
              <Tooltip title={!open ? currentUser.username : ''} placement="right">
                <Avatar
                  src={`${Path_URL}images/icons/user_icon.png`}
                  alt={currentUser.username}
                  sx={{
                    width: 34, height: 34, flexShrink: 0,
                    bgcolor: isDark ? 'rgba(21,101,192,0.25)' : 'rgba(21,101,192,0.1)',
                    color: 'primary.main',
                    border: `1.5px solid`,
                    borderColor: isDark ? 'rgba(21,101,192,0.4)' : 'rgba(21,101,192,0.25)',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  {currentUser.username?.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
              {open && (
                <>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Prompt', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.username}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: 'Prompt' }}>
                      {iduser_level === 2 ? 'ผู้ดูแลระบบ' : iduser_level === 1 ? 'ผู้ใช้งานขั้นสูง' : 'ผู้ใช้งานทั่วไป'}
                    </Typography>
                  </Box>
                  <Tooltip title="ออกจากระบบ">
                    <IconButton
                      onClick={logout}
                      size="small"
                      sx={{
                        width: 30, height: 30, borderRadius: '8px',
                        border: `0.5px solid ${theme.palette.divider}`,
                        color: 'text.secondary',
                        '&:hover': { bgcolor: 'error.lighter', color: 'error.main', borderColor: 'error.light' },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          ) : (
            open ? (
              <Button
                fullWidth
                startIcon={<LoginIcon fontSize="small" />}
                onClick={() => setLoginOpen(true)}
                variant="outlined"
                size="small"
                sx={{
                  fontFamily: 'Prompt', fontSize: '0.8rem', fontWeight: 500,
                  borderRadius: '8px', textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'rgba(21,101,192,0.05)' },
                }}
              >
                เข้าสู่ระบบ
              </Button>
            ) : (
              <Tooltip title="เข้าสู่ระบบ" placement="right">
                <IconButton onClick={() => setLoginOpen(true)} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                  <LoginIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          )}
        </Box>
      </Drawer>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={() => window.location.reload()}
      />
    </>
  );
};

export default DrawerComponent;