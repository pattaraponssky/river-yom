'use client';

import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';
import { styled, useTheme } from '@mui/material/styles';

const SwitchContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 64,
  height: 32,
  borderRadius: 32,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: 4,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(0,0,0,0.12)',
  transition: 'background-color 0.3s ease',
}));

const SwitchThumb = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'dark',
})<{ dark: boolean }>(({ theme, dark }) => ({
  position: 'absolute',
  top: 4,
  left: dark ? 32 : 4,
  width: 24,
  height: 24,
  borderRadius: '50%',
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.6)'
      : '0 2px 8px rgba(0,0,0,0.25)',
  transition: 'left 0.3s ease',
}));

export default function ThemeSwitcher() {
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();

  const isDark = mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      {/* ข้อความ */}
      {/* <Typography
        variant="body2"
        sx={{
          fontFamily: 'Prompt, sans-serif',
          fontWeight: 600,
          fontSize: { xs: '0.8rem', sm: '0.95rem' },
          color: theme.palette.text.secondary,
          display: { xs: 'none', sm: 'block' },
          whiteSpace: 'nowrap',
        }}
      >
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </Typography> */}

      {/* Switch */}
      <Tooltip
        title={isDark ? 'สว่าง (Light Mode) ☀️' : 'มืด (Dark Mode) 🌙'}
        arrow
      >
        <SwitchContainer onClick={toggleTheme}>
          <SwitchThumb dark={isDark}>
            {isDark ? (
              <DarkMode sx={{ fontSize: '1.1rem', color: '#90caf9' }} />
            ) : (
              <LightMode sx={{ fontSize: '1.1rem', color: '#f57f17' }} />
            )}
          </SwitchThumb>
        </SwitchContainer>
      </Tooltip>
    </Box>
  );
}
