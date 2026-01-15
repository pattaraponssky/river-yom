// src/components/ThemeSwitcher.tsx
'use client';

import { IconButton, Tooltip } from '@mui/material';
import { Brightness4, Brightness7, BrightnessAuto } from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { mode, toggleTheme } = useThemeMode();

  const getIcon = () => {
    switch (mode) {
      case 'light': return <Brightness7 />;
      case 'dark': return <Brightness4 />;
      default: return <BrightnessAuto />;
    }
  };

  const getTooltip = () => {
    switch (mode) {
      case 'light': return 'ธีมสว่าง';
      case 'dark': return 'ธีมมืด';
      default: return 'ตามระบบ';
    }
  };

  return (
    <Tooltip title={getTooltip()}>
      <IconButton 
        onClick={toggleTheme} 
        color="inherit"
        size="large"
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
}