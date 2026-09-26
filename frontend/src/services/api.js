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

export const getAuthHeaders = () => {
  const token = getStoredToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({ message: 'Server response parsing error' }));
  if (!response.ok) {
    if (response.status === 401) {
      console.warn('Unauthorized request to protected API. Session may be expired or missing.');
    }
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
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async getTeam() {
    const response = await fetch(`${API_BASE}/auth/team`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  async verifyResetCode(email, code, token) {
    const response = await fetch(`${API_BASE}/auth/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, token }),
    });
    return handleResponse(response);
  },

  async resetPassword(payload) {
    const response = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async getSmtpStatus() {
    const response = await fetch(`${API_BASE}/auth/smtp-status`);
    return handleResponse(response);
  },

  async checkHealth() {
    const response = await fetch(`${API_BASE}/health`);
    return handleResponse(response);
  },

  // ==========================================
  // PHASE 3 & 4: AUTH-GUARDED MASTER DATA APIS
  // ==========================================

  // Products (Auth-guarded)
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/products${query ? `?${query}` : ''}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async getProductById(id) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createProduct(data) {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateProduct(id, data) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  // Categories (Auth-guarded)
  async getCategories() {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createCategory(data) {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateCategory(id, data) {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteCategory(id) {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  // Warehouses (Settings -> Warehouse, Auth-guarded)
  async getWarehouses() {
    const response = await fetch(`${API_BASE}/warehouses`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async getWarehouseById(id) {
    const response = await fetch(`${API_BASE}/warehouses/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createWarehouse(data) {
    const response = await fetch(`${API_BASE}/warehouses`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateWarehouse(id, data) {
    const response = await fetch(`${API_BASE}/warehouses/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteWarehouse(id) {
    const response = await fetch(`${API_BASE}/warehouses/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  // Stock Availability per Location & Reorder Alerts (Auth-guarded)
  async getStockAvailability(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const response = await fetch(`${API_BASE}/stock${query ? `?${query}` : ''}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async adjustStock(data) {
    const response = await fetch(`${API_BASE}/stock/adjust`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getReorderAlerts() {
    const response = await fetch(`${API_BASE}/products/alerts`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  // ==========================================
  // INTERNAL TRANSFERS (Auth-guarded)
  // ==========================================

  async getTransfers(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const response = await fetch(`${API_BASE}/transfers${query ? `?${query}` : ''}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async getTransferById(id) {
    const response = await fetch(`${API_BASE}/transfers/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createTransfer(data) {
    const response = await fetch(`${API_BASE}/transfers`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async validateTransfer(id) {
    const response = await fetch(`${API_BASE}/transfers/${id}/validate`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  // ==========================================
  // DELIVERY ORDERS (Auth-guarded)
  // ==========================================

  async getDeliveries(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    const query = new URLSearchParams(cleanParams).toString();
    const response = await fetch(`${API_BASE}/deliveries${query ? `?${query}` : ''}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async getDeliveryById(id) {
    const response = await fetch(`${API_BASE}/deliveries/${id}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createDelivery(data) {
    const response = await fetch(`${API_BASE}/deliveries`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async validateDelivery(id) {
    const response = await fetch(`${API_BASE}/deliveries/${id}/validate`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },
};