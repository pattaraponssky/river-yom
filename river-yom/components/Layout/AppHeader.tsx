// src/components/layout/Header.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Path_URL } from '@/lib/utility';
import LoginDialog from '../Users/LoginDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useThemeMode } from '@/contexts/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

interface HeaderProps {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title, open, setOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, logout, refreshAuth } = useAuth();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [userMenu, setUserMenu] = useState<null | HTMLElement>(null);
  const [settingsMenu, setSettingsMenu] = useState<null | HTMLElement>(null);
  const isDark = theme.palette.mode === 'dark';
  const primary = theme.palette.primary.main;
  const { mode, toggleTheme } = useThemeMode();

  // prefetch เส้นทางที่ใช้บ่อยเพื่อ routing ลื่นขึ้น
  useEffect(() => {
    router.prefetch('/setting');
    router.prefetch('/users');
  }, [router]);

  const appBarBg = isDark
    ? 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #303f9f 100%)'
    : 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)';

  const glassStyle = {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
  };

  const handleThemeChange = (_: React.MouseEvent<HTMLElement>, newMode: string | null) => {
    if (newMode && newMode !== mode) toggleTheme();
  };

  const goTo = (path: string) => {
    setSettingsMenu(null);
    setUserMenu(null);
    router.push(path);
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
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* ซ้าย: Hamburger + Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Tooltip title={open ? 'ซ่อนเมนู' : 'เปิดเมนู'} placement="bottom">
              <IconButton
                edge="start"
                onClick={() => setOpen(!open)}
                sx={{
                  display: { sm: 'flex', md: 'none' },
                  color: '#fff',
                  ...glassStyle,
                  width: 34,
                  height: 34,
                  '&:hover': { background: 'rgba(255,255,255,0.22)' },
                }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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

          {/* กลาง: ชื่อระบบ */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* ── ปุ่มตั้งค่า: ลดความเด่นลงเป็น ghost บนพื้นเข้ม ── */}
            <Tooltip title="ตั้งค่า">
              <IconButton
                onClick={(e) => setSettingsMenu(e.currentTarget)}
                sx={{
                  borderRadius: 2,
                  color: '#fff',
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { background: 'rgba(255,255,255,0.22)' },
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={settingsMenu}
              open={Boolean(settingsMenu)}
              onClose={() => setSettingsMenu(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 3,
                  minWidth: 220,
                  background: alpha(theme.palette.background.paper, isDark ? 0.95 : 1),
                  border: `1px solid ${alpha(primary, 0.15)}`,
                  boxShadow: `0 8px 24px ${alpha(primary, 0.12)}`,
                },
              }}
            >
              <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontFamily: 'Prompt',
                    fontWeight: 600,
                    color: 'text.disabled',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  ธีมการแสดงผล
                </Typography>
              </Box>

              <Box sx={{ px: 2, pb: 1.5 }}>
                <ToggleButtonGroup
                  value={mode}
                  exclusive
                  onChange={handleThemeChange}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      fontFamily: 'Prompt',
                      fontSize: '0.85rem',
                      borderRadius: '8px !important',
                      border: `1px solid ${alpha(primary, 0.2)} !important`,
                      gap: 0.5,
                      py: 0.8,
                      color: 'text.secondary',
                      '&.Mui-selected': {
                        background: alpha(primary, isDark ? 0.3 : 0.12),
                        color: 'primary.main',
                        fontWeight: 600,
                      },
                    },
                    gap: 1,
                  }}
                >
                  <ToggleButton value="light">
                    <LightModeIcon sx={{ fontSize: 16 }} />
                    สว่าง
                  </ToggleButton>
                  <ToggleButton value="dark">
                    <DarkModeIcon sx={{ fontSize: 16 }} />
                    มืด
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Divider sx={{ opacity: 0.4 }} />

              {/* เชื่อม route ให้ตรงกับเมนู User */}
              <MenuItem
                onClick={() => goTo('/setting')}
                sx={{ fontFamily: 'Prompt', fontSize: '0.95rem', py: 1.2 }}
              >
                <SettingsIcon sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary' }} />
                การตั้งค่าระบบ
              </MenuItem>
            </Menu>

            {/* ── ปุ่ม User ── */}
            {currentUser ? (
              <>
                <Button
                  onClick={(e) => setUserMenu(e.currentTarget)}
                  sx={{
                    borderRadius: '999px',
                    px: 1.5,
                    textTransform: 'none',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    gap: 1,
                    '&:hover': { background: 'rgba(255,255,255,0.22)' },
                  }}
                >
                  <Avatar
                    src={`${Path_URL}images/icons/user_icon.png`}
                    sx={{ width: 30, height: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                  />
                  {!isMobile && currentUser.username}
                </Button>

                <Menu
                  anchorEl={userMenu}
                  open={Boolean(userMenu)}
                  onClose={() => setUserMenu(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      borderRadius: 3,
                      background: alpha(theme.palette.background.paper, 0.9),
                      border: `1px solid ${alpha(primary, 0.2)}`,
                    },
                  }}
                >
                  <MenuItem onClick={() => goTo('/users')}>
                    <AccountCircleIcon sx={{ mr: 1 }} />
                    โปรไฟล์
                  </MenuItem>
                  <MenuItem onClick={() => goTo('/setting')}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    ตั้งค่า
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={async () => {
                      setUserMenu(null);
                      await logout();
                      router.push('/');
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <LogoutIcon sx={{ mr: 1 }} />
                    ออกจากระบบ
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                startIcon={<LoginIcon />}
                onClick={() => setLoginOpen(true)}
                sx={{
                  borderRadius: '999px',
                  px: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light ?? theme.palette.secondary.main})`,
                  color: '#fff',
                  boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.5)}`,
                  transition: 'all .2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 10px 22px ${alpha(theme.palette.secondary.main, 0.6)}`,
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