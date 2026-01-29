// src/contexts/ThemeContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from '@/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  // โหลดค่าจาก localStorage ตอนเริ่ม
  useEffect(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode | null;
    if (saved === 'light' || saved === 'dark') {
      setMode(saved);
    }
  }, []);

  // sync theme + html class
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const currentTheme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <ThemeProvider theme={currentTheme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode ต้องใช้ภายใต้ ThemeContextProvider');
  }
  return context;
};
