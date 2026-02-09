'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/utility';

interface User {
  name: string;
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
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshAuth = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/user/checkAuth`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        setCurrentUser(null);
        return;
      }

      const data = await res.json();

      if (data?.username && data?.iduser_level) {
        setCurrentUser({
          username: data.username,
          iduser_level: Number(data.iduser_level),
          uid: data.uid,
          exp: data.exp,
          email: data.email,
          name: data.name,
        });
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn('Auth refresh failed', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    await fetch(`${API_URL}/user/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    setCurrentUser(null);
    router.replace('/dashboard');
    router.refresh();
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
