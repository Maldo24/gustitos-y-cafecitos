import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getMe } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';

/* eslint-disable react-refresh/only-export-components */

export interface AuthUser {
  id?: string;
  username: string;
  names: string;
  firstSurname: string;
  email: string;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginContext: (userData: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => !!localStorage.getItem('token'));
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    getMe()
      .then((data) => {
        setUser({
          id: data.user.id,
          username: data.user.username,
          names: data.user.names,
          firstSurname: data.user.firstSurname,
          email: data.user.email,
          role: data.user.role,
        });
      })
      .catch(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      navigate('/login');
    };
    setUnauthorizedHandler(handleUnauthorized);
  }, [logout, navigate]);

  const loginContext = (userData: AuthUser, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginContext, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
