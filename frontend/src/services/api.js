// API service for StockSense authentication and backend communication

const API_BASE = '/api';

export const getStoredToken = () => localStorage.getItem('stocksense_token');
export const getStoredUser = () => {
  const user = localStorage.getItem('stocksense_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  if (token) localStorage.setItem('stocksense_token', token);
  if (user) localStorage.setItem('stocksense_user', JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem('stocksense_token');
  localStorage.removeItem('stocksense_user');
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({ message: 'Server response parsing error' }));
  if (!response.ok) {
    throw new Error(data.message || 'An unexpected error occurred with the server.');
  }
  return data;
};

export const api = {
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const result = await handleResponse(response);
    if (result.token && result.user) {
      setAuthSession(result.token, result.user);
    }
    return result;
  },

  async register(userData) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const result = await handleResponse(response);
    if (result.token && result.user) {
      setAuthSession(result.token, result.user);
    }
    return result;
  },

  async getMe() {
    const token = getStoredToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  async getTeam() {
    const token = getStoredToken();
    const response = await fetch(`${API_BASE}/auth/team`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  async checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse(response);
  }
};
