import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../services/api';

export type UserRole = 'WORKER' | 'EMPLOYER' | 'ASSESSOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  status: string;
  workerProfileId?: string;
  publicId?: string;
  selectedTradeId?: string | null;
  avatarUrl?: string;
  isPublic?: boolean;
  employerProfileId?: string;
  companyName?: string;
  assessorProfileId?: string;
  approvalStatus?: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  approvedTradeIds?: string[];
}

const LANG_STORAGE_KEY = 'kc_lang_v1';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  lang: 'en' | 'ur';
  setLang: (lang: 'en' | 'ur') => void;
  toggleLang: () => void;
  login: (email: string, password: string, allowedRoles?: UserRole[]) => Promise<AuthUser>;
  register: (payload: Record<string, unknown>) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getDashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'WORKER':
      return '/worker/dashboard';
    case 'EMPLOYER':
      return '/employer/dashboard';
    case 'ASSESSOR':
      return '/assessor/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<'en' | 'ur'>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'ur' ? 'ur' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLang = useCallback((next: 'en' | 'ur') => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'en' ? 'ur' : 'en';
      try {
        localStorage.setItem(LANG_STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.post('/auth/refresh');
      if (res.data?.success && res.data?.data?.accessToken) {
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
      } else {
        setAccessToken(null);
        setUser(null);
      }
    } catch {
      setAccessToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, allowedRoles?: UserRole[]): Promise<AuthUser> => {
    const res = await api.post('/auth/login', {
      email,
      password,
      ...(allowedRoles && allowedRoles.length > 0 ? { allowedRoles } : {}),
    });
    const { accessToken, user: loggedInUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload: Record<string, unknown>): Promise<AuthUser> => {
    const res = await api.post('/auth/register', payload);
    const { accessToken, user: newUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, lang, setLang, toggleLang, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
