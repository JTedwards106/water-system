// services/api.js
const API_BASE_URL = 'http://localhost:8085/api';

// Helper function to get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Helper function to make authenticated requests
const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/signin';
      throw new Error('Authentication required');
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Auth API functions
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  register: async (name, email, password, phone, deviceId) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, phone, deviceId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  },

  getCurrentUser: async () => {
    return authenticatedFetch('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },
};

// Water analytics API functions
export const waterAPI = {
  getLatestReadings: async (deviceId) => {
    return authenticatedFetch(`/v1/water/latest/${deviceId}`);
  },

  getHistory: async (deviceId, days = 7) => {
    return authenticatedFetch(`/v1/water/history/${deviceId}?days=${days}`);
  },

  sendCommand: async (deviceId, command, value) => {
    const response = await fetch(`${API_BASE_URL}/v1/water/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: new URLSearchParams({
        deviceId,
        command,
        value: value.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Command failed: ${response.statusText}`);
    }

    return response.text();
  },

  toggleValve: async (deviceId, open) => {
    const response = await fetch(`${API_BASE_URL}/v1/water/valve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: new URLSearchParams({
        deviceId,
        open: open.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Valve toggle failed: ${response.statusText}`);
    }

    return response.text();
  },
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Utility function to get user info from token (basic implementation)
export const getUserFromToken = () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    // Basic JWT decode (without verification - for client-side use only)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      email: payload.sub || payload.email,
      name: payload.name || 'User',
      exp: payload.exp,
    };
  } catch (e) {
    return null;
  }
};