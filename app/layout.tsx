// src/app/layout.tsx
import { Prompt } from 'next/font/google';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContextProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ClientLayout from '@/components/Layout/ClientLayout';


const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

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
            <CssBaseline />
            <ClientLayout> {children} </ClientLayout>
          </ThemeContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}