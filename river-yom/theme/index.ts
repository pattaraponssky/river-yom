// src/theme/index.ts
'use client';

import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#28378B', // สีน้ำเงินกรมชล
    },
    secondary: {
      main: '#28aa15', // เขียวสำหรับ success/alert
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#004080',
    },
  },
  typography: {
    fontFamily: '"Prompt", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6b8cff',
    },
    secondary: {
      main: '#4caf50',
    },
    // background: {
    //   default: '#0f1217',
    //   paper: '#1a1f2b',
    // },
    background: {
      default: '#141b2d', // เทาอมฟ้า ไม่ดำสนิท
      paper: '#1e2533',   // สว่างกว่า default นิดนึง
    },
    text: {
      primary: '#f7fafc',
      secondary: '#cbd5e0',
    },
  },
  typography: {
    fontFamily: '"Prompt", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        },
      },
    },
  },
});