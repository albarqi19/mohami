import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services';
import { apiClient } from '../utils/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (nationalId: string, pin: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (has valid token)
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      apiClient.setToken(savedToken);
      // Verify token by fetching user profile
      AuthService.getProfile()
        .then((userData) => {
          setUser(userData);
        })
        .catch((error) => {
          console.error('Token verification failed:', error);
          // Only clear token if it's specifically an authentication error (401/403)
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('authToken');
            apiClient.setToken(null);
          }
          // For network errors, keep the token and set user as null
          // but don't remove the token in case connection is restored
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (nationalId: string, pin: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const loginResponse = await AuthService.login({ nationalId, pin });
      setUser(loginResponse.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
