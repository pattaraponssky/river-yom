// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/utility';

interface User {
  username: string;
  iduser_level: number;
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
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const userData = data.user || data;

        if (userData?.username) {
          setCurrentUser({
            username: userData.username,
            iduser_level: Number(userData.iduser_level) || 0,
            uid: userData.uid,
            email: userData.email,
            exp: userData.exp,
          });
          // ถ้ามี localStorage เก็บ user ไว้ด้วย (optional)
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('user');
      }
    } catch (err) {
      console.warn('Auth check failed:', err);
      setCurrentUser(null);
      localStorage.removeItem('user');
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
      localStorage.removeItem('user');
      router.push('/login');           // เปลี่ยนเป็น /login ดีกว่า /
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
      router.push('/login');
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}