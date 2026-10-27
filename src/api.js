const API_PREFIX = '/api/v1';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('pbt_api_base_url');
    if (savedUrl) return savedUrl.replace(/\/+$/, '');
  }
  return (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url?.trim()) {
      localStorage.setItem('pbt_api_base_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('pbt_api_base_url');
    }
  }
};

const getStoredToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('pbt_auth_token') : null;

export const setStoredToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('pbt_auth_token', token);
    else localStorage.removeItem('pbt_auth_token');
  }
};

async function apiRequest(path, options = {}) {
  const { token, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);
  headers.set('Accept', 'application/json');

  const authToken = Object.hasOwn(options, 'token') ? token : getStoredToken();
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const bodyIsForm = typeof FormData !== 'undefined' && requestOptions.body instanceof FormData;
  const bodyIsParams = requestOptions.body instanceof URLSearchParams;
  if (requestOptions.body && !bodyIsForm && !bodyIsParams && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      ...requestOptions,
      headers,
    });
  } catch (cause) {
    const error = new Error(
      'Could not reach the backend. Check that it is running and that the API base URL is correct.',
      { cause },
    );
    error.isNetworkError = true;
    throw error;
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      data = text ? { detail: text } : null;
    }
  }

  if (!response.ok) {
    if (
      response.status === 401 &&
      authToken &&
      typeof window !== 'undefined' &&
      !path.includes('/auth/')
    ) {
      window.dispatchEvent(new Event('pbt:session-expired'));
    }

    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
      : typeof detail === 'string'
        ? detail
        : data?.message || data?.error || `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const queryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const result = search.toString();
  return result ? `?${result}` : '';
};

const requireResourceId = (data, resource) => {
  if (!data || data.id === null || data.id === undefined || !Number.isInteger(Number(data.id))) {
    throw new Error(`The backend response did not include a valid ${resource} ID.`);
  }
  return data;
};

const readLocalWallets = () => {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem('pbt_wallets') || '[]');
    return Array.isArray(value) ? value : [];
  } catch (cause) {
    console.warn('Saved wallet data could not be read.', cause);
    return [];
  }
};

export const api = {
  async checkHealth() {
    return apiRequest('/health', { token: null });
  },

  async register({ email, full_name, password }) {
    return apiRequest(`${API_PREFIX}/auth/register`, {
      method: 'POST',
      token: null,
      body: JSON.stringify({ email: email.trim(), full_name: full_name?.trim() || null, password }),
    });
  },

  async login({ email, password }) {
    const result = await apiRequest(`${API_PREFIX}/auth/login`, {
      method: 'POST',
      token: null,
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!result?.access_token) {
      throw new Error('The backend login response did not include an access token.');
    }
    setStoredToken(result.access_token);
    return {
      accessToken: result.access_token,
      tokenType: result.token_type || 'bearer',
    };
  },

  logout() {
    setStoredToken(null);
  },

  async getCategories(params = {}) {
    return apiRequest(`${API_PREFIX}/categories${queryString(params)}`);
  },

  async createCategory(category) {
    const response = await apiRequest(`${API_PREFIX}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name: category.name.trim(), type: category.type }),
    });
    return requireResourceId(response, 'category');
  },

  async updateCategory(id, category) {
    return apiRequest(`${API_PREFIX}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: category.name, type: category.type }),
    });
  },

  async deleteCategory(id) {
    return apiRequest(`${API_PREFIX}/categories/${id}`, { method: 'DELETE' });
  },

  async getTransactions(params = {}) {
    return apiRequest(`${API_PREFIX}/transactions${queryString(params)}`);
  },

  async createTransaction(transaction) {
    const payload = {
      category_id: Number(transaction.category_id),
      type: transaction.type,
      amount: Math.abs(Number(transaction.amount)),
      transaction_date: transaction.transaction_date || transaction.date,
      description: transaction.description || transaction.merchant || '',
    };
    const response = await apiRequest(`${API_PREFIX}/transactions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return requireResourceId(response, 'transaction');
  },

  async updateTransaction(id, transaction) {
    const payload = { ...transaction };
    if (payload.date && !payload.transaction_date) {
      payload.transaction_date = payload.date;
      delete payload.date;
    }
    return apiRequest(`${API_PREFIX}/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteTransaction(id) {
    return apiRequest(`${API_PREFIX}/transactions/${id}`, { method: 'DELETE' });
  },

  async getBudgets(params = {}) {
    const { month, year, ...query } = params;
    if (month && year) {
      return apiRequest(`${API_PREFIX}/budgets/month/${month}/year/${year}`);
    }
    return apiRequest(`${API_PREFIX}/budgets${queryString(query)}`);
  },

  async createBudget(budget) {
    const response = await apiRequest(`${API_PREFIX}/budgets`, {
      method: 'POST',
      body: JSON.stringify({
        category_id: Number(budget.category_id),
        amount: Number(budget.amount ?? budget.total),
        month: Number(budget.month),
        year: Number(budget.year),
      }),
    });
    return requireResourceId(response, 'budget');
  },

  async updateBudget(id, budget) {
    return apiRequest(`${API_PREFIX}/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ amount: Number(budget.amount ?? budget.total) }),
    });
  },

  async deleteBudget(id) {
    return apiRequest(`${API_PREFIX}/budgets/${id}`, { method: 'DELETE' });
  },

  async getBudgetStatus(month, year) {
    return apiRequest(`${API_PREFIX}/budgets/status/month/${month}/year/${year}`);
  },

  async getBudgetCategoryStatus(categoryId, month, year) {
    return apiRequest(
      `${API_PREFIX}/budgets/status/category/${categoryId}/month/${month}/year/${year}`,
    );
  },

  async getReportSummary(params = {}) {
    return apiRequest(`${API_PREFIX}/reports/summary${queryString(params)}`);
  },

  async getIncomeByCategory(params = {}) {
    return apiRequest(`${API_PREFIX}/reports/income-by-category${queryString(params)}`);
  },

  async getExpensesByCategory(params = {}) {
    return apiRequest(`${API_PREFIX}/reports/expenses-by-category${queryString(params)}`);
  },

  async getMonthlySummary(year = new Date().getFullYear()) {
    return apiRequest(`${API_PREFIX}/reports/monthly-summary/${year || new Date().getFullYear()}`);
  },

  async getTopSpendingCategories(params = {}) {
    return apiRequest(`${API_PREFIX}/reports/top-spending-categories${queryString(params)}`);
  },

  async getRecommendations() {
    return apiRequest(`${API_PREFIX}/ml/recommend`);
  },

  async getOverspendingAlerts(params = {}) {
    return apiRequest(`${API_PREFIX}/ml/alerts${queryString(params)}`);
  },

  async getWallets() {
    return readLocalWallets();
  },

  async createWallet(wallet) {
    const wallets = [...readLocalWallets(), wallet];
    if (typeof window !== 'undefined') {
      localStorage.setItem('pbt_wallets', JSON.stringify(wallets));
    }
    return wallet;
  },
};

export default api;
