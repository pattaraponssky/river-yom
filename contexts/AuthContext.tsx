// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/utility';

interface User {
  username: string;
  iduser_level: number;      // ต้องเป็น number เสมอ
  uid?: string;
  email?: string;
  exp?: number;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/user/checkAuth`, {
        method: 'GET',
        credentials: 'include', // ส่ง cookie ไปด้วย (สำคัญ!)
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();

        // ป้องกันกรณี data.user เป็น undefined หรือไม่มี field
        const userData = data.user || data; // ถ้า backend ส่ง user ตรง ๆ หรือห่อใน { user: ... }

        if (userData?.username) {
          // แปลง iduser_level เป็น number เสมอ
          const parsedUser: User = {
            username: userData.username,
            iduser_level: Number(userData.iduser_level) || 0, // ถ้าเป็น string ให้แปลง
            uid: userData.uid,
            email: userData.email,
            exp: userData.exp,
          };

          setCurrentUser(parsedUser);
          } else if (res.status === 401) {
            setCurrentUser(null);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
    //   console.error('Check auth failed:', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/user/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth ต้องใช้ภายใน AuthProvider');
  }
  return context;
};