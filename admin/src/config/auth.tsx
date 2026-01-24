"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'subAdmin';
  allowedTabs?: string[];
  phoneNumber?: string;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAccess: (tab: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, try to restore user from localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            console.log('🔄 Restored User from localStorage:', userData);
            console.log('🔄 Restored Role:', userData.role);
            console.log('🔄 Restored AllowedTabs:', userData.allowedTabs);
            setUser(userData);
          } catch (e) {
            console.error('Failed to parse saved user data:', e);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User) => {
    console.log('🔐 Login - User Data:', userData);
    console.log('🔐 Login - Role:', userData.role);
    console.log('🔐 Login - AllowedTabs:', userData.allowedTabs);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Clear the cookie by making a logout request
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(console.error);
  };

  const hasAccess = (tab: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'subAdmin' && user.allowedTabs) {
      const hasAccess = user.allowedTabs.includes(tab);
      console.log(`🔑 hasAccess("${tab}"):`, hasAccess, '| AllowedTabs:', user.allowedTabs);
      return hasAccess;
    }
    return false;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    hasAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
