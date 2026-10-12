import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { authService, LoginCredentials } from '@/services/api/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (userId: string) => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('paypulse_token');
        const storedUser = await authService.getCurrentUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          // In development mock mode, default to Tanvir Ahmed (System Administrator) if first time
          const users = (await import('@/mocks/mockData')).INITIAL_USERS;
          const defaultAdmin = users[0];
          localStorage.setItem('paypulse_token', 'mock-jwt-init');
          localStorage.setItem('paypulse_user', JSON.stringify(defaultAdmin));
          setToken('mock-jwt-init');
          setUser(defaultAdmin);
        }
      } catch {
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('paypulse_auth_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('paypulse_auth_unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const session = await authService.login(credentials);
      setUser(session.user);
      setToken(session.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (userId: string) => {
    setIsLoading(true);
    try {
      const newUser = await authService.switchRole(userId);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = useCallback(
    (allowedRoles: UserRole[]): boolean => {
      if (!user) return false;
      return allowedRoles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        switchRole,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
