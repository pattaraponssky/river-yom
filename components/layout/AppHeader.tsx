// src/components/layout/Header.tsx
'use client';

import React, { use, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Path_URL } from '@/lib/utility';
import LoginDialog from '../Users/LoginDialog';
import { useAuth } from '@/contexts/AuthContext'; // ← เปลี่ยน import ให้ตรง (จาก contexts ไม่ใช่ hooks)
import ThemeSwitcher from '../ThemeSwitcher';
import { useRouter } from 'next/navigation';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

interface HeaderProps {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title, open, setOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, logout, refreshAuth } = useAuth(); // ← ดึง logout และ refreshAuth จาก context
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const appBarBg = isDark
    ? 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #303f9f 100%)'
    : 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)';


  const textColor = isDark ? theme.palette.text.primary : '#ffffff';

  const glassStyle = {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onLogout = async () => {
    handleMenuClose();
    await logout(); // เรียก logout จาก context
    router.push('/'); // redirect ไปหน้าแรก
  };

  const goToProfile = () => {
    handleMenuClose();
    router.push('/users'); 
  };

  const goToSettings = () => {
    handleMenuClose();
    router.push('/setting');
  };

  return (
    <>
       <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: appBarBg,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(13,71,161,0.25)',
          zIndex: theme.zIndex.drawer + 2,
        }}
      >
      
        <Toolbar
          sx={{
            minHeight: { xs: 64, sm: 64 },
            px: { xs: 3, md: 0.5 },
            pr: { xs: 2, md: 2 },
            display: 'flex',
            justifyContent: 'space-between', // ยังคงใช้ space-between
            alignItems: 'center',
            position: 'relative', // สำคัญสำหรับ absolute positioning
          }}
        >
          {/* ซ้าย: Hamburger + Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, }}>
            <Tooltip title={open ? 'ซ่อนเมนู' : 'เปิดเมนู'} placement="bottom">
              <IconButton
                edge="start"
                onClick={() => setOpen(!open)}
                sx={{
                  display: { sm: 'flex', md:'none' },
                  color: '#fff',
                  ...glassStyle,
                  width: 34, height: 34,
                  '&:hover': { background: 'rgba(255,255,255,0.22)' },
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                width: 64, height: 64,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={`${Path_URL}images/logo_rid.png`}
                alt="RID Logo"
                style={{ height: isMobile ? 38 : 46, objectFit: 'contain' }}
              />
            </Box>
          </Box>

          {/* กลาง: ชื่อระบบ (absolute positioning ให้อยู่กึ่งกลางจริง ๆ) */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                color: '#fff',
                fontFamily: 'Prompt, sans-serif',
                fontSize: { sm: '0.95rem', md: '1.2rem' },
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
              }}
            >
              {title || 'ระบบติดตามสถานการณ์น้ำระยะไกลอัตโนมัติ'}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'Prompt, sans-serif',
                fontSize: '0.8rem',
                lineHeight: 1.4,
                display: { sm: 'none', md: 'block' },
              }}
            >
              พื้นที่ฝั่งขวาแม่น้ำยม · อำเภอบางระกำ จังหวัดพิษณุโลก
            </Typography>
          </Box>

          {/* ขวา: Theme + User / Login */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <ThemeSwitcher />

            {currentUser ? (
              <>
                <Button
                  onClick={handleMenuOpen}
                  sx={{
                    color: textColor,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontFamily: 'Prompt',
                    gap: 1.5,
                    borderRadius: '999px',
                    px: 2,
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)',
                    },
                  }}
                >
                  <Avatar
                    alt={currentUser.username}
                    src={`${Path_URL}images/icons/user_icon.png`}
                    sx={{
                      width: 40,
                      height: 40,
                      p: 0.7,
                      bgcolor: isDark ? theme.palette.primary.main : '#ffffff',
                      color: isDark ? '#ffffff' : theme.palette.primary.main,
                    }}
                  >
                    {currentUser.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  {!isMobile && currentUser.username}
                </Button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      borderRadius: 2,
                      backgroundColor: theme.palette.background.paper,
                    },
                  }}
                >
                  <MenuItem onClick={goToProfile}>
                    <AccountCircleIcon sx={{ mr: 1 }} /> โปรไฟล์
                  </MenuItem>
                  <MenuItem onClick={goToSettings}>
                    <SettingsIcon sx={{ mr: 1 }} /> ตั้งค่า
                  </MenuItem>
                  <MenuItem
                    onClick={onLogout}
                    sx={{ color: 'error.main', fontWeight: 'bold' }}
                  >
                    <LogoutIcon sx={{ mr: 1 }} />
                    ออกจากระบบ
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => setLoginOpen(true)}
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  px: 3,
                  background: isDark
                    ? 'linear-gradient(90deg, #6b8cff, #a3bffa)'
                    : 'linear-gradient(90deg, #28378b, #64b5f6)',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(90deg, #5c7aff, #8caeff)'
                      : 'linear-gradient(90deg, #1e2f7a, #4a9ae6)',
                  },
                }}
              >
                เข้าสู่ระบบ
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoginSuccess={async () => {
          await refreshAuth();
          router.refresh();
        }}
      />
    </>
  );
};

export default Header;