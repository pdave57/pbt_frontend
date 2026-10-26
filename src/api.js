/**
 * Personal Budget Tracker - API Client
 * Configured for endpoints from OpenAPI spec (Personal Budget Tracker v2.0.0)
 * - Auth: POST /api/v1/users, POST /api/v1/users/token, GET /api/v1/users/me
 * - Categories: GET/POST /api/v1/categories
 * - Transactions: GET/POST /api/v1/transactions, PUT/DELETE /api/v1/transactions/:id, GET /api/v1/transactions/summary/overview
 * - Budgets: GET/POST /api/v1/budgets, GET/PUT/DELETE /api/v1/budgets/:id, GET /api/v1/budgets/tracking/adherence
 * - Recommendations: GET /api/v1/recommendations/*
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('pbt_api_base_url');
    if (savedUrl) return savedUrl;
  }
  // Use relative URL to leverage Vite proxy (configured in vite.config.js)
  // Falls back to empty string for same-origin requests
  return import.meta.env.VITE_API_URL || '';
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url) {
      localStorage.setItem('pbt_api_base_url', url);
    } else {
      localStorage.removeItem('pbt_api_base_url');
    }
  }
};

const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pbt_auth_token') || null;
  }
  return null;
};

export const setStoredToken = (token) => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('pbt_auth_token', token);
    } else {
      localStorage.removeItem('pbt_auth_token');
    }
  }
};

/**
 * Universal fetch wrapper with token injection, timeout, and robust error parsing
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const token = options.token || getStoredToken();

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set Content-Type only if body is not FormData or URLSearchParams
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse JSON or text
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => null);
      data = text ? { detail: text } : null;
    }

    if (!response.ok) {
      // Extract error message
      let errorMsg = 'An error occurred';
      if (data) {
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        }
      } else {
        errorMsg = `Request failed with status ${response.status} (${response.statusText})`;
      }

      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If it's a network failure or fetch error
    if (!error.status) {
      error.isNetworkError = true;
    }
    throw error;
  }
}

export const api = {
  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  /**
   * 1. Create user (register)
   * Endpoint: POST /api/v1/users/
   * @param {Object} userData - { username, email, password }
   */
  async register(userData) {
    const payload = {
      username: userData.username || userData.email.split('@')[0],
      email: userData.email.trim(),
      password: userData.password,
    };

    return await apiRequest('/api/v1/users/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * 2. Login user
   * Endpoint: POST /api/v1/users/token
   * OAuth2 form-urlencoded (x-www-form-urlencoded)
   * @param {Object} credentials - { email/username, password }
   * Tries multiple identifier formats: username, email, or email prefix
   */
  async login({ email, username, password }) {
    const providedIdentifier = (email || username || '').trim();
    
    // Generate possible username variants to try
    const identifiersToTry = [
      providedIdentifier,  // As provided (could be username or email)
    ];
    
    // If it looks like an email, also try the prefix (part before @)
    if (providedIdentifier.includes('@')) {
      const emailPrefix = providedIdentifier.split('@')[0];
      if (emailPrefix && emailPrefix !== providedIdentifier) {
        identifiersToTry.push(emailPrefix);
      }
    }

    let lastError = null;

    for (const identifier of identifiersToTry) {
      // OAuth2 standard form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', identifier);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      try {
        const result = await apiRequest('/api/v1/users/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData,
        });
        return this._normalizeTokenResponse(result, identifier);
      } catch (err) {
        lastError = err;
        // If it's a 401 (invalid credentials), try next identifier
        // If it's 422/415/400 (format issue), try JSON fallback
        if (err.status === 401) {
          continue; // Try next identifier
        }
        if (err.status === 422 || err.status === 415 || err.status === 400) {
          try {
            const jsonResult = await apiRequest('/api/v1/users/token', {
              method: 'POST',
              body: JSON.stringify({
                username: identifier,
                password,
              }),
            });
            return this._normalizeTokenResponse(jsonResult, identifier);
          } catch {
            // Continue to next identifier
          }
        }
        // For other errors (network, 500, etc.), don't retry with other identifiers
        if (err.status !== 401) {
          // Provide helpful error message for network errors
          if (err.isNetworkError) {
            throw new Error('Cannot connect to backend server. Is it running on http://localhost:8000? Or click "Try Demo Mode" to use the app without a backend.');
          }
          throw err;
        }
      }
    }

    // All identifiers failed
    throw lastError || new Error('Invalid credentials');
  },

  _normalizeTokenResponse(data, defaultUsername) {
    const token = data?.access_token || data?.token || data?.jwt || null;
    const tokenType = data?.token_type || 'bearer';
    const user = data?.user || {
      email: defaultUsername,
      name: defaultUsername.split('@')[0] || 'User',
    };

    if (token) {
      setStoredToken(token);
    }

    return {
      accessToken: token,
      tokenType,
      user,
      raw: data,
    };
  },

  /**
   * Fetch current user profile
   * Endpoint: GET /api/v1/users/me
   */
  async getCurrentUser() {
    return await apiRequest('/api/v1/users/me', {
      method: 'GET',
    });
  },

  /**
   * Logout helper (clears stored token)
   */
  logout() {
    setStoredToken(null);
  },

  // ==========================================
  // CATEGORY ENDPOINTS
  // ==========================================

  /**
   * Fetch all categories
   * Endpoint: GET /api/v1/categories/
   */
  async getCategories() {
    return await apiRequest('/api/v1/categories/', {
      method: 'GET',
    });
  },

  /**
   * Create category
   * Endpoint: POST /api/v1/categories/
   * @param {Object} categoryData - { name, type: 'income' | 'expense' }
   */
  async createCategory(categoryData) {
    const payload = {
      name: (categoryData.name || '').trim(),
      type: categoryData.type === 'income' ? 'income' : 'expense',
    };
    return await apiRequest('/api/v1/categories/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ==========================================
  // TRANSACTION ENDPOINTS
  // ==========================================

  /**
   * Fetch transactions
   * Endpoint: GET /api/v1/transactions/
   * @param {Object} params - { skip?, limit?, tx_type?: 'income' | 'expense' }
   */
  async getTransactions(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/transactions/${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Create transaction
   * Endpoint: POST /api/v1/transactions/
   * @param {Object} transactionData - { type: 'income'|'expense', amount, category_id?, description? }
   */
  async createTransaction(transactionData) {
    const isIncome = transactionData.type === 'income' || Number(transactionData.amount) > 0;
    const payload = {
      type: isIncome ? 'income' : 'expense',
      amount: Math.abs(parseFloat(transactionData.amount)),
      description: transactionData.merchant || transactionData.description || 'Transaction',
    };

    if (transactionData.category_id && !isNaN(parseInt(transactionData.category_id, 10))) {
      payload.category_id = parseInt(transactionData.category_id, 10);
    }

    return await apiRequest('/api/v1/transactions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update transaction
   * Endpoint: PUT /api/v1/transactions/:tx_id
   * @param {number} tx_id - Transaction ID
   * @param {Object} transactionData - { amount?, category_id?, description? }
   */
  async updateTransaction(tx_id, transactionData) {
    return await apiRequest(`/api/v1/transactions/${tx_id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  },

  /**
   * Delete transaction
   * Endpoint: DELETE /api/v1/transactions/:tx_id
   */
  async deleteTransaction(tx_id) {
    return await apiRequest(`/api/v1/transactions/${tx_id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get budget summary (dashboard overview)
   * Endpoint: GET /api/v1/transactions/summary/overview
   * Returns: { total_income, total_expense, current_balance, income_by_category[], expense_by_category[] }
   */
  async getBudgetSummary() {
    return await apiRequest('/api/v1/transactions/summary/overview', {
      method: 'GET',
    });
  },

  /**
   * Get dashboard summary - normalized for the UI
   */
  async getDashboard() {
    try {
      const summary = await this.getBudgetSummary();
      const monthlyIncome = parseFloat(summary.total_income) || 0;
      const monthlyExpenses = parseFloat(summary.total_expense) || 0;
      const totalBalance = parseFloat(summary.current_balance) || 0;
      const totalSavings = Math.max(0, monthlyIncome - monthlyExpenses);

      return {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        totalSavings,
        balanceTrend: '+0.0%',
        incomeTrend: '+0.0%',
        expenseTrend: '-0.0%',
        savingsTrend: '+0.0%',
        raw: summary,
      };
    } catch {
      return null;
    }
  },

  /**
   * Wallets helper
   */
  async getWallets() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pbt_wallets');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [];
  },

  async createWallet(walletData) {
    if (typeof window !== 'undefined') {
      const current = await this.getWallets();
      const updated = [...current, walletData];
      localStorage.setItem('pbt_wallets', JSON.stringify(updated));
    }
    return walletData;
  },

  // ==========================================
  // BUDGET ENDPOINTS
  // ==========================================

  /**
   * List budgets with optional month/year filters
   * Endpoint: GET /api/v1/budgets/
   * @param {Object} params - { month?: number, year?: number }
   */
  async getBudgets(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/budgets/${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },

  /**
   * Create budget
   * Endpoint: POST /api/v1/budgets/
   * @param {Object} budgetData - { category_id, amount, month, year }
   */
  async createBudget(budgetData) {
    const now = new Date();
    const payload = {
      category_id: parseInt(budgetData.category_id, 10),
      amount: Math.abs(parseFloat(budgetData.amount || budgetData.total)),
      month: budgetData.month || (now.getMonth() + 1),
      year: budgetData.year || now.getFullYear(),
    };
    return await apiRequest('/api/v1/budgets/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get specific budget by ID
   * Endpoint: GET /api/v1/budgets/:budget_id
   */
  async getBudget(budget_id) {
    return await apiRequest(`/api/v1/budgets/${budget_id}`, {
      method: 'GET',
    });
  },

  /**
   * Update budget
   * Endpoint: PUT /api/v1/budgets/:budget_id
   * @param {number} budget_id - Budget ID
   * @param {Object} budgetData - { amount?, month?, year?, category_id? }
   */
  async updateBudget(budget_id, budgetData) {
    return await apiRequest(`/api/v1/budgets/${budget_id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  },

  /**
   * Delete budget
   * Endpoint: DELETE /api/v1/budgets/:budget_id
   */
  async deleteBudget(budget_id) {
    return await apiRequest(`/api/v1/budgets/${budget_id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get budget adherence report (spending vs budget)
   * Endpoint: GET /api/v1/budgets/tracking/adherence
   * @param {Object} params - { month?, year? } (defaults to current month/year)
   * Returns: { month, year, total_budgeted, total_spent, total_remaining, overall_percentage_used, is_overall_exceeded, categories[], exceeded_categories_count }
   */
  async getBudgetAdherence(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/budgets/tracking/adherence${query ? `?${query}` : ''}`;
    return await apiRequest(endpoint, {
      method: 'GET',
    });
  },

  // ==========================================
  // ML RECOMMENDATION ENDPOINTS
  // ==========================================

  /**
   * Get full ML spending recommendations report
   * Endpoint: GET /api/v1/recommendations/
   * Returns: SpendingRecommendationReport with category_recommendations, excess_spending_alerts, anomalies_detected, key_recommendations
   */
  async getSpendingRecommendations() {
    return await apiRequest('/api/v1/recommendations/', {
      method: 'GET',
    });
  },

  /**
   * Get excess spending alerts
   * Endpoint: GET /api/v1/recommendations/excess-spending
   * Returns: ExcessSpendingAlert[]
   */
  async getExcessSpendingAlerts() {
    return await apiRequest('/api/v1/recommendations/excess-spending', {
      method: 'GET',
    });
  },

  /**
   * Get spending anomalies (statistical outliers)
   * Endpoint: GET /api/v1/recommendations/anomalies
   * Returns: SpendingAnomaly[]
   */
  async getSpendingAnomalies() {
    return await apiRequest('/api/v1/recommendations/anomalies', {
      method: 'GET',
    });
  },

  /**
   * Get category budget recommendations
   * Endpoint: GET /api/v1/recommendations/category-targets
   * Returns: CategoryRecommendation[]
   */
  async getCategoryRecommendations() {
    return await apiRequest('/api/v1/recommendations/category-targets', {
      method: 'GET',
    });
  },
};

export default api;