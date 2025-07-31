// File: /home/com2u/src/OrganAIzer/frontend/src/contexts/AuthContext.js
// Purpose: Authentication context for managing user state and auth operations

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const isAuthenticated = await authService.checkAuth();
      if (isAuthenticated) {
        const userData = await authService.getUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setError(null);
      await authService.login();
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error.message);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
