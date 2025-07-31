// File: /home/com2u/src/OrganAIzer/frontend/src/services/authService.js
// Purpose: Authentication service for handling Entra ID login/logout

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async checkAuth() {
    try {
      const response = await fetch(`${this.baseURL}/auth/status`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.authenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  async getUser() {
    try {
      const response = await fetch(`${this.baseURL}/auth/user`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  }

  async login() {
    // Redirect to backend login endpoint
    window.location.href = `${this.baseURL}/auth/login`;
  }

  async logout() {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  async getAuthToken() {
    // This would be used for API calls that need authentication
    // For now, we'll use session-based auth
    return null;
  }
}

export const authService = new AuthService();
