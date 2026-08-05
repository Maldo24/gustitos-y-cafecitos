import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/* eslint-disable react-refresh/only-export-components */

export interface AuthUser {
  username: string;
  names: string;
  firstSurname: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loginContext: (userData: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  
  // 2. Solución al Error 1: Leemos el localStorage directamente en el useState
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      return JSON.parse(storedUser);
    }
    return null;
  });

  // (Ya eliminamos el useEffect por completo)

  const loginContext = (userData: AuthUser, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loginContext, logout }}>
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