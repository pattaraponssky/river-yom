// src/components/layout/Header.tsx
'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Path_URL } from '@/lib/utility';
import LoginDialog from '../Users/LoginDialog';
import { useAuth } from '../hooks/useAuth';
import ThemeSwitcher from '../ThemeSwitcher';

interface HeaderProps {
  title: string;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ title, open, setOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser, setCurrentUser, handleLogout } = useAuth();

  const [loginOpen, setLoginOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // สีตามธีม
  const isDark = theme.palette.mode === 'dark';
  const appBarBg = isDark
    ? 'linear-gradient(135deg, #1a237e 0%, #28378b 100%)'
    : 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)';

  const textColor = isDark ? theme.palette.text.primary : '#ffffff';
  const avatarBg = isDark ? theme.palette.primary.main : '#ffffff';
  const avatarText = isDark ? '#ffffff' : theme.palette.primary.main;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <AppBar
        position="fixed" // เปลี่ยนเป็น fixed เพื่อให้อยู่ด้านบนตลอด (หรือ sticky ก็ได้)
        elevation={3}
        sx={{
          background: appBarBg,
          transition: 'background 0.3s ease',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1.5, sm: 3 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* ซ้าย: Hamburger + Logo + ชื่อระบบ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setOpen(!open)}
              sx={{ mr: 1, display: { md: 'none' } }} // แสดงเฉพาะมือถือ
            >
              <MenuIcon />
            </IconButton>

            {/* Logo + ชื่อ */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img
                src={`${Path_URL}images/logo_rid.png`}
                alt="RID Logo"
                style={{
                  height: isMobile ? '40px' : '48px',
                  objectFit: 'contain',
                }}
              />
              {!isMobile && (
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    fontWeight: 700,
                    color: textColor,
                    fontFamily: 'Prompt, sans-serif',
                    fontSize: { md: '1.4rem', sm: '1.2rem' },
                    letterSpacing: 0.5,
                  }}
                >
                  {title || 'ระบบเฝ้าระวังน้ำ'}
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* ขวา: ชื่อผู้ใช้ / เข้าสู่ระบบ */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ThemeSwitcher/>
            {currentUser ? (
              <>
                <Button
                  onClick={handleMenuOpen}
                  sx={{
                    color: textColor,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontFamily: 'Noto Sans Thai',
                    fontSize: { md: '1rem', xs: '0.9rem' },
                    gap: 1,
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <Avatar
                    alt={currentUser.username}
                    src={`${Path_URL}images/icons/user_icon.png`}
                    sx={{
                      width: { md: 40, xs: 32 },
                      height: { md: 40, xs: 32 },
                      bgcolor: avatarBg,
                      color: avatarText,
                      fontSize: { md: '1.1rem', xs: '0.9rem' },
                      fontWeight: 'bold',
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
                    elevation: 4,
                    sx: {
                      mt: 1.5,
                      borderRadius: 2,
                      minWidth: 180,
                      backgroundColor: theme.palette.background.paper,
                    },
                  }}
                >
                  <MenuItem onClick={handleMenuClose} sx={{ fontFamily: 'Noto Sans Thai' }}>
                    แก้ไขข้อมูลผู้ใช้
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleLogout();
                      handleMenuClose();
                    }}
                    sx={{
                      color: 'error.main',
                      fontFamily: 'Noto Sans Thai',
                      fontWeight: 'bold',
                    }}
                  >
                    <LogoutIcon sx={{ mr: 1 }} />
                    ออกจากระบบ
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<LoginIcon />}
                onClick={() => setLoginOpen(true)}
                sx={{
                  fontFamily: 'Noto Sans Thai',
                  fontWeight: 600,
                  px: { md: 3, xs: 2 },
                  py: 1,
                  borderRadius: 50,
                  textTransform: 'none',
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
                {!isMobile ? 'เข้าสู่ระบบ' : ''}
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Login Dialog */}
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
    </>
  );
};

export default Header;