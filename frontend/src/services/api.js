// API service for StockSense authentication and master data communication

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
  // Auth
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
  },

  // ==========================================
  // PHASE 3: MASTER DATA APIS
  // ==========================================

  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`);
    return handleResponse(response);
  },

  async getProductById(id) {
    const response = await fetch(`${API_BASE}/products/${id}`);
    return handleResponse(response);
  },

  async createProduct(data) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateProduct(id, data) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Categories
  async getCategories() {
    const response = await fetch(`${API_BASE}/categories`);
    return handleResponse(response);
  },

  async createCategory(data) {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateCategory(id, data) {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteCategory(id) {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Warehouses (Settings -> Warehouse)
  async getWarehouses() {
    const response = await fetch(`${API_BASE}/warehouses`);
    return handleResponse(response);
  },

  async getWarehouseById(id) {
    const response = await fetch(`${API_BASE}/warehouses/${id}`);
    return handleResponse(response);
  },

  async createWarehouse(data) {
    const response = await fetch(`${API_BASE}/warehouses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateWarehouse(id, data) {
    const response = await fetch(`${API_BASE}/warehouses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteWarehouse(id) {
    const response = await fetch(`${API_BASE}/warehouses/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Stock Availability per Location & Reorder Alerts
  async getStockAvailability(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/stock${query ? `?${query}` : ''}`);
    return handleResponse(response);
  },

  async adjustStock(data) {
    const response = await fetch(`${API_BASE}/stock/adjust`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getReorderAlerts() {
    const response = await fetch(`${API_BASE}/stock/alerts`);
    return handleResponse(response);
  }
};
