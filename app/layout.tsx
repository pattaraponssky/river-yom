// src/app/layout.tsx
import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';


import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeContextProvider } from '@/contexts/ThemeContext';
import CssBaseline from '@mui/material/CssBaseline';

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบสถานการณ์น้ำ',
  description: 'Dashboard แสดงผลข้อมูลน้ำแบบ real-time',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={prompt.className}>
        <AppRouterCacheProvider>
          <ThemeContextProvider>
            <CssBaseline />
            {children}
          </ThemeContextProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}