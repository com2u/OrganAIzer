// File: /home/com2u/src/OrganAIzer/frontend/src/config/api.js
// Purpose: API configuration for frontend

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we have a custom backend URL from environment
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // In development, use the direct backend URL
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // In production, use relative URLs (proxy should work)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default {
  API_BASE_URL,
  buildApiUrl
};
