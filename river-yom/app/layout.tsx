// src/app/layout.tsx
import { Prompt } from 'next/font/google';
import { ThemeContextProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ClientLayout from '@/components/Layout/ClientLayout';
import type { Metadata } from 'next';


const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RID03 ระบบสนับสนุนการตัดสินใจ',
  description: 'ระบบสนับสนุนการตัดสินใจในการบริหารจัดการน้ำแม่ยมฝั่งขวา กรมชลประทาน',
  icons: {
    icon: 'logo_rid.png',          
    shortcut: 'logo_rid.png',
    apple: 'logo_rid.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={prompt.className}>
        <AuthProvider>
          <ThemeContextProvider>
            <ClientLayout> {children} </ClientLayout>
          </ThemeContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}