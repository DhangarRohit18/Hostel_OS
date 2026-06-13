import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiRequest } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'PARENT' | 'WARDEN' | 'GUARD' | 'STAFF' | 'ADMIN';
  phone?: string;
  studentProfile?: any;
  parentProfile?: any;
  wardenProfile?: any;
  staffProfile?: any;
  guardProfile?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (formData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to restore auth session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      await refreshUser();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (formData: any) => {
    await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
