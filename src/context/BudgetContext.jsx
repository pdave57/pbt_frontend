import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './useAuth';
import { BudgetContext } from './budgetContextDef';
import { CATEGORY_BLUEPRINTS } from './categoryDefaults';

const EMPTY_STATS = {
  totalBalance: 0,
  balanceTrend: '—',
  monthlyIncome: 0,
  incomeTrend: '—',
  monthlyExpenses: 0,
  expenseTrend: '—',
  totalSavings: 0,
  savingsTrend: '—',
};
const INITIAL_DATE = new Date();
const INITIAL_PERIOD = {
  month: INITIAL_DATE.getMonth(),
  year: INITIAL_DATE.getFullYear(),
};

const toAmount = (value) => Number.parseFloat(value) || 0;
const todayIso = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const readableDate = (value) => {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function normalizeTransaction(transaction, categories) {
  const category = categories.find((item) => String(item.id) === String(transaction.category_id));
  const type = String(transaction.type || 'expense').toLowerCase();
  const amount = Math.abs(toAmount(transaction.amount));
  const transactionDate = transaction.transaction_date || transaction.date;
  return {
    id: transaction.id,
    type,
    category_id: transaction.category_id,
    category: category?.name || transaction.category?.name || transaction.category || 'Uncategorized',
    merchant: transaction.description || transaction.merchant || 'Transaction',
    amount: type === 'income' ? amount : -amount,
    icon: category?.icon || (type === 'income' ? '💰' : '💳'),
    date: readableDate(transactionDate),
    transactionDate,
    status: 'Completed',
  };
}

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export function BudgetProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(INITIAL_PERIOD);
  const [dataError, setDataError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mlRecommendations, setMlRecommendations] = useState(null);
  const [excessSpendingAlerts, setExcessSpendingAlerts] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setDataError('');
    const now = new Date();
    setPeriod({ month: now.getMonth(), year: now.getFullYear() });
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const [categoryResult, transactionResult, budgetResult, statusResult, walletResult] =
      await Promise.allSettled([
        api.getCategories({ limit: 500 }),
        api.getTransactions({ limit: 500 }),
        api.getBudgets({ month, year }),
        api.getBudgetStatus(month, year),
        api.getWallets(),
      ]);

    const failures = [];
    if (categoryResult.status === 'rejected') failures.push(`Categories: ${categoryResult.reason.message}`);
    const serverCategories = categoryResult.status === 'fulfilled'
      ? getArray(categoryResult.value, ['items', 'categories'])
      : [];
    const savedMeta = (() => {
      try {
        return JSON.parse(localStorage.getItem('pbt_category_meta') || '{}');
      } catch (cause) {
        console.warn('Saved category details could not be read.', cause);
        return {};
      }
    })();
    const loadedCategories = serverCategories.map((category) => {
      const meta = savedMeta[category.id] || savedMeta[category.name] || {};
      const type = String(category.type || 'expense').toLowerCase();
      return {
        id: category.id,
        name: category.name,
        type,
        icon: meta.icon || (type === 'income' ? '💼' : '🏷️'),
        allocatedBudget: toAmount(meta.allocatedBudget),
        color: meta.color || (type === 'income' ? '#10B981' : '#6366F1'),
        description: meta.description || '',
      };
    });
    setCategories(loadedCategories);
    localStorage.setItem('pbt_categories', JSON.stringify(loadedCategories));

    if (transactionResult.status === 'rejected') {
      failures.push(`Transactions: ${transactionResult.reason.message}`);
    }
    const loadedTransactions = transactionResult.status === 'fulfilled'
      ? getArray(transactionResult.value, ['items', 'transactions'])
          .map((transaction) => normalizeTransaction(transaction, loadedCategories))
      : [];
    setTransactions(loadedTransactions);

    if (budgetResult.status === 'rejected') failures.push(`Budgets: ${budgetResult.reason.message}`);
    const statusRows = statusResult.status === 'fulfilled'
      ? getArray(statusResult.value, ['budgets', 'categories', 'statuses', 'budget_status', 'items', 'data'])
      : [];
    if (statusResult.status === 'rejected') failures.push(`Budget status: ${statusResult.reason.message}`);
    const loadedBudgets = budgetResult.status === 'fulfilled'
      ? getArray(budgetResult.value, ['items', 'budgets'])
      : [];
    const normalizedBudgets = loadedBudgets.map((budget, index) => {
      const category = loadedCategories.find(
        (item) => String(item.id) === String(budget.category_id),
      );
      const status = statusRows.find((item) =>
        String(item.category_id) === String(budget.category_id) ||
        String(item.budget_id) === String(budget.id),
      );
      const transactionTotal = loadedTransactions
        .filter((transaction) =>
          String(transaction.category_id) === String(budget.category_id) &&
          transaction.type === 'expense' &&
          (!transaction.transactionDate ||
            (new Date(transaction.transactionDate).getMonth() + 1 === Number(budget.month) &&
              new Date(transaction.transactionDate).getFullYear() === Number(budget.year))),
        )
        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
      const statusTotal = status?.actual_spent ?? status?.spent_amount ?? status?.total_spent ?? status?.spent;
      return {
        id: budget.id,
        category_id: budget.category_id,
        category: category?.name || `Category #${budget.category_id}`,
        total: toAmount(budget.amount),
        spent: statusTotal === undefined ? transactionTotal : toAmount(statusTotal),
        icon: category?.icon || '🎯',
        color: ['fill-purple', 'fill-green', 'fill-blue', 'fill-orange'][index % 4],
        month: budget.month,
        year: budget.year,
      };
    });
    setBudgets(normalizedBudgets);

    if (walletResult.status === 'rejected') failures.push(`Wallets: ${walletResult.reason.message}`);
    setWallets(walletResult.status === 'fulfilled' ? walletResult.value : []);

    const currentMonthTransactions = loadedTransactions.filter((transaction) => {
      const date = transaction.transactionDate
        ? new Date(`${transaction.transactionDate.slice(0, 10)}T00:00:00`)
        : now;
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const income = currentMonthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const expenses = currentMonthTransactions
      .filter((transaction) => transaction.type !== 'income')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
    const walletBalance = (walletResult.status === 'fulfilled' ? walletResult.value : [])
      .reduce((sum, wallet) => sum + toAmount(wallet.balance), 0);
    setStats({
      totalBalance: walletBalance || income - expenses,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      totalSavings: income - expenses,
      balanceTrend: '—',
      incomeTrend: '—',
      expenseTrend: '—',
      savingsTrend: '—',
    });
    setDataError(failures.join(' '));
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (active) return refresh();
      return undefined;
    });
    return () => {
      active = false;
    };
  }, [refresh, isAuthenticated]);

  const fetchMlRecommendations = useCallback(async () => {
    if (!isAuthenticated) return;
    setMlLoading(true);
    setMlError('');
    const [recommendations, alerts] = await Promise.allSettled([
      api.getRecommendations(),
      api.getOverspendingAlerts({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      }),
    ]);

    const failures = [];
    if (recommendations.status === 'fulfilled') {
      setMlRecommendations(recommendations.value);
    } else {
      failures.push(recommendations.reason.message);
    }
    if (alerts.status === 'fulfilled') {
      setExcessSpendingAlerts(getArray(alerts.value, ['alerts']));
    } else {
      failures.push(alerts.reason.message);
    }
    setMlError(failures.join(' '));
    setMlLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (active) return fetchMlRecommendations();
      return undefined;
    });
    return () => {
      active = false;
    };
  }, [fetchMlRecommendations, isAuthenticated]);

  const trackedCategories = useMemo(() => {
    return categories.map((category) => {
      const currentBudget = budgets.find(
        (budget) => String(budget.category_id) === String(category.id),
      );
      const matchingTransactions = transactions.filter((transaction) => {
        if (String(transaction.category_id) !== String(category.id)) return false;
        const date = transaction.transactionDate ? new Date(`${transaction.transactionDate.slice(0, 10)}T00:00:00`) : null;
        return !date || (date.getMonth() === period.month && date.getFullYear() === period.year);
      });
      const transactionAmount = matchingTransactions.reduce(
        (sum, transaction) => sum + Math.abs(toAmount(transaction.amount)),
        0,
      );
      const actualAmount = currentBudget?.spent ?? transactionAmount;
      const allocated = toAmount(category.allocatedBudget) || toAmount(currentBudget?.total);
      const percent = allocated > 0 ? Math.min(Math.round(actualAmount / allocated * 100), 999) : 0;
      const isExpense = category.type === 'expense';
      return {
        ...category,
        actualAmount,
        remaining: allocated - actualAmount,
        percent,
        status: isExpense
          ? (allocated > 0 && actualAmount > allocated
            ? 'Exceeded'
            : allocated > 0 && percent >= 80
              ? 'Near Limit'
              : 'On Track')
          : (allocated > 0 && actualAmount >= allocated ? 'Goal Met' : 'In Progress'),
        txCount: matchingTransactions.length,
      };
    });
  }, [categories, transactions, budgets, period]);

  const addCategory = async (categoryInput) => {
    const type = categoryInput.type === 'income' ? 'income' : 'expense';
    const payload = {
      name: categoryInput.name.trim(),
      type,
      icon: categoryInput.icon || (type === 'income' ? '💼' : '🏷️'),
      allocatedBudget: toAmount(categoryInput.allocatedBudget),
      color: categoryInput.color || (type === 'income' ? '#10B981' : '#6366F1'),
      description: categoryInput.description || '',
    };
    const response = await api.createCategory(payload);
    const created = { ...payload, id: response.id };
    saveCategoryMeta(created);
    setCategories((previous) => [...previous, created]);
    return created;
  };

  const updateCategory = async (id, fields) => {
    const previous = categories.find((category) => String(category.id) === String(id));
    if (typeof id === 'number') await api.updateCategory(id, fields);
    const updated = { ...previous, ...fields };
    saveCategoryMeta(updated);
    setCategories((items) => items.map((category) => category.id === id ? updated : category));
    return updated;
  };

  const deleteCategory = async (id) => {
    if (typeof id === 'number') await api.deleteCategory(id);
    setCategories((items) => items.filter((category) => category.id !== id));
  };

  const saveCategoryMeta = (category) => {
    let metadata = {};
    try {
      metadata = JSON.parse(localStorage.getItem('pbt_category_meta') || '{}');
    } catch (cause) {
      console.warn('Saved category details could not be read.', cause);
    }
    metadata[category.id] = {
      icon: category.icon,
      color: category.color,
      allocatedBudget: category.allocatedBudget,
      description: category.description,
    };
    localStorage.setItem('pbt_category_meta', JSON.stringify(metadata));
  };

  const applyCategoryTemplate = async (templateKey) => {
    const template = CATEGORY_BLUEPRINTS[templateKey];
    if (!template) throw new Error('The selected category template is unavailable.');
    const created = [];
    const knownCategories = new Set(
      categories.map((category) => `${category.name.toLowerCase()}|${category.type}`),
    );
    for (const item of template.categories) {
      const key = `${item.name.toLowerCase()}|${item.type}`;
      if (knownCategories.has(key)) continue;
      created.push(await addCategory(item));
      knownCategories.add(key);
    }
    if (!created.length) throw new Error('All categories in this template already exist.');
    return created;
  };

  const addDefaultCategories = async () => {
    const firstTemplate = Object.keys(CATEGORY_BLUEPRINTS)[0];
    if (firstTemplate) await applyCategoryTemplate(firstTemplate);
  };

  const addTransaction = async (input) => {
    const category = categories.find(
      (item) => String(item.id) === String(input.category_id) ||
        item.name.toLowerCase() === String(input.category || '').toLowerCase(),
    );
    if (!category || typeof category.id !== 'number') {
      throw new Error('Choose a saved category before adding a transaction.');
    }
    const isIncome = input.type === 'income' || category.type === 'income';
    const amount = Math.abs(toAmount(input.amount));
    const response = await api.createTransaction({
      category_id: category.id,
      type: isIncome ? 'income' : 'expense',
      amount,
      description: input.merchant || input.description || '',
      transaction_date: input.transaction_date || input.date || todayIso(),
    });
    const created = normalizeTransaction(response, categories);
    setTransactions((items) => [created, ...items]);
    await refresh();
    return created;
  };

  const updateTransaction = async (id, input) => {
    const category = categories.find((item) => String(item.id) === String(input.category_id));
    if (!category || typeof id !== 'number') {
      throw new Error('Choose a saved category before updating this transaction.');
    }
    const type = input.type === 'income' ? 'income' : 'expense';
    const response = await api.updateTransaction(id, {
      category_id: category.id,
      type,
      amount: Math.abs(toAmount(input.amount)),
      description: input.merchant || input.description || '',
      transaction_date: input.transaction_date || input.date || todayIso(),
    });
    const updated = normalizeTransaction(response, categories);
    setTransactions((items) => items.map((transaction) => transaction.id === id ? updated : transaction));
    await refresh();
    return updated;
  };

  const deleteTransaction = async (id) => {
    if (typeof id === 'number') await api.deleteTransaction(id);
    setTransactions((items) => items.filter((transaction) => transaction.id !== id));
    await refresh();
  };

  const addBudget = async (input) => {
    const category = categories.find(
      (item) => String(item.id) === String(input.category_id) ||
        item.name === input.category,
    );
    if (!category || typeof category.id !== 'number') {
      throw new Error('Choose a saved category before creating a budget.');
    }
    const now = new Date();
    const month = Number(input.month) || now.getMonth() + 1;
    const year = Number(input.year) || now.getFullYear();
    const response = await api.createBudget({
      category_id: category.id,
      amount: Number(input.amount ?? input.total),
      month,
      year,
    });
    const budget = {
      id: response.id,
      category_id: category.id,
      category: category.name,
      icon: category.icon || input.icon || '🎯',
      total: toAmount(response.amount),
      spent: 0,
      month,
      year,
      color: 'fill-purple',
    };
    setBudgets((items) => [...items, budget]);
    return budget;
  };

  const updateBudget = async (id, fields) => {
    const updated = await api.updateBudget(id, fields);
    setBudgets((items) => items.map((item) => item.id === id
      ? { ...item, total: toAmount(updated?.amount ?? fields.amount ?? fields.total) }
      : item));
  };

  const deleteBudget = async (id) => {
    if (typeof id === 'number') await api.deleteBudget(id);
    setBudgets((items) => items.filter((item) => item.id !== id));
  };

  const addWallet = async (input) => {
    const gradients = [
      'linear-gradient(135deg, #6366F1, #8B5CF6)',
      'linear-gradient(135deg, #10B981, #059669)',
      'linear-gradient(135deg, #EC4899, #8B5CF6)',
      'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    ];
    const wallet = {
      id: `w-${Date.now()}`,
      name: input.name,
      type: input.type || 'Checking',
      accountNumber: input.accountNumber || '',
      balance: toAmount(input.balance),
      gradient: gradients[wallets.length % gradients.length],
    };
    await api.createWallet(wallet);
    setWallets((items) => [...items, wallet]);
    return wallet;
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter((transaction) =>
      [transaction.merchant, transaction.category, transaction.date]
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [transactions, searchQuery]);

  const value = {
    stats,
    budgets,
    categories,
    trackedCategories,
    transactions: filteredTransactions,
    rawTransactions: transactions,
    wallets,
    loading,
    dataError,
    refresh,
    searchQuery,
    setSearchQuery,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addWallet,
    addCategory,
    updateCategory,
    deleteCategory,
    applyCategoryTemplate,
    addDefaultCategories,
    mlRecommendations,
    excessSpendingAlerts,
    mlLoading,
    mlError,
    fetchMlRecommendations,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export default BudgetProvider;
