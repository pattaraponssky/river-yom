// src/components/ThemeSwitcher.tsx
'use client';

import React from 'react';
import { IconButton, Tooltip, Box, Typography, Badge } from '@mui/material';
import { 
  DarkMode, 
  LightMode, 
  SettingsBrightness 
} from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.12)' 
    : 'rgba(0, 0, 0, 0.06)',
  borderRadius: '12px',
  padding: '10px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.18)' 
      : 'rgba(0, 0, 0, 0.10)',
    transform: 'scale(1.15)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 6px 24px rgba(0,0,0,0.5)'
      : '0 6px 24px rgba(0,0,0,0.18)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.6rem',
    transition: 'transform 0.4s ease',
  },
  '&:active .MuiSvgIcon-root': {
    transform: 'rotate(180deg) scale(1.2)',
  },
}));

export default function ThemeSwitcher() {
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();

  const getIcon = () => {
    switch (mode) {
      case 'light':
        return <LightMode sx={{ color: '#f57f17', width: '16px', height: '16px' }} />;
      case 'dark':
        return <DarkMode sx={{ color: '#90caf9', width: '16px', height: '16px' }} />;
      default: // system
        return <SettingsBrightness sx={{ color: '#ffb74d', width: '16px', height: '16px' }} />;
    }
  };

  const getTooltip = () => {
    switch (mode) {
      case 'light':
        return 'สว่าง (Light Mode) ☀️';
      case 'dark':
        return 'มืด (Dark Mode) 🌙';
      default:
        return 'ตามระบบ (System Default) ⚙️';
    }
  };

  const getStatusText = () => {
    switch (mode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      default:
        return 'System Mode';
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      py: 0.5,
      gap: { xs: 1, sm: 1.5 },
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255,255,255,0.05)' 
        : 'rgba(0,0,0,0.03)',
      borderRadius: '16px',
      padding: { xs: '4px 8px', sm: '4px 8px' },
    }}>
      {/* ข้อความแสดงธีมปัจจุบัน */}
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'Prompt, sans-serif',
          fontWeight: 600,
          color: theme.palette.text.secondary,
          fontSize: { xs: '0.8rem', sm: '0.95rem' },
          display: { xs: 'none', sm: 'block' }, // ซ่อนบนมือถือเพื่อประหยัดพื้นที่
          whiteSpace: 'nowrap',
        }}
      >
        {getStatusText()}
      </Typography>

      {/* ปุ่มสลับธีม */}
      <Tooltip 
        title={getTooltip()}
        arrow
        placement="bottom"
        componentsProps={{
          tooltip: {
            sx: {
              fontSize: '1.05rem',
              fontFamily: 'Prompt, sans-serif',
              fontWeight: 500,
              backgroundColor: mode === 'dark' ? '#333' : '#fff',
              color: mode === 'dark' ? '#fff' : '#333',
              border: mode === 'dark' ? '1px solid #444' : '1px solid #ddd',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            },
          },
        }}
      >
        <StyledIconButton 
          onClick={toggleTheme}
          aria-label="สลับธีม"
          size="medium"
        >
          <Badge
            color="primary"
            variant="dot"
            invisible={mode !== 'system'} // แสดงจุดเล็กเมื่อเป็น System Mode
            overlap="circular"
            sx={{
            width: '16px',
            height: '16px',
              '& .MuiBadge-dot': {
                width: 10,
                height: 10,
                borderRadius: '50%',
              },
            }}
          >
            {getIcon()}
          </Badge>
        </StyledIconButton>
      </Tooltip>
    </Box>
  );
}