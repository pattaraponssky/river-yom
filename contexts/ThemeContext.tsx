// src/contexts/ThemeContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '@/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light'); // ค่า theme จริงที่ใช้

  useEffect(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode;
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      setMode(saved);
    }
  }, []);

  // จัดการ theme และบันทึกค่า
  useEffect(() => {
    localStorage.setItem('themeMode', mode);

    const updateTheme = () => {
      if (mode === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDark);
      } else {
        setResolvedTheme(mode);
        document.documentElement.classList.toggle('dark', mode === 'dark');
      }
    };

    updateTheme();
    // ฟังการเปลี่ยนแปลง system theme (เฉพาะโหมด system)
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  const currentTheme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode ต้องใช้ใน ThemeContextProvider');
  return context;
};