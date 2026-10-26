import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './useAuth';
import { BudgetContext } from './budgetContextDef';
import { CATEGORY_BLUEPRINTS } from './categoryDefaults';

const EMPTY_STATS = {
  totalBalance: 0,
  balanceTrend: '0%',
  monthlyIncome: 0,
  incomeTrend: '0%',
  monthlyExpenses: 0,
  expenseTrend: '0%',
  totalSavings: 0,
  savingsTrend: '0%',
};

export function BudgetProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pbt_categories');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return [];
  });
  const [, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ML Recommendations state
  const [mlRecommendations, setMlRecommendations] = useState(null);
  const [excessSpendingAlerts, setExcessSpendingAlerts] = useState([]);
  const [spendingAnomalies, setSpendingAnomalies] = useState([]);
  const [categoryRecommendations, setCategoryRecommendations] = useState([]);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);

  // Recalculate summary from local transactions and wallets
  const recalculateSummary = useCallback((txs, wls = wallets, cats = categories) => {
    const totalBal = wls.reduce((acc, curr) => acc + Number(curr.balance || 0), 0);
    const income = txs
      .filter((t) => (t.type || '').toLowerCase() === 'income' || Number(t.amount) > 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);
    const expenses = txs
      .filter((t) => (t.type || '').toLowerCase() === 'expense' || Number(t.amount) < 0)
      .reduce((acc, t) => acc + Math.abs(Number(t.amount)), 0);

    const allocatedInc = cats
      .filter((c) => (c.type || '').toLowerCase() === 'income')
      .reduce((acc, c) => acc + Number(c.allocatedBudget || 0), 0);

    const effectiveIncome = income > 0 ? income : (allocatedInc > 0 ? allocatedInc : 0);

    setStats((prev) => ({
      ...prev,
      totalBalance: totalBal || (income - expenses) || (effectiveIncome - expenses) || prev.totalBalance,
      monthlyIncome: effectiveIncome,
      monthlyExpenses: expenses,
      totalSavings: effectiveIncome - expenses > 0 ? effectiveIncome - expenses : 0,
    }));
  }, [wallets, categories]);

  // Load from backend if available
  useEffect(() => {
    let isCancelled = false;

    async function loadBackendData() {
      if (!isAuthenticated) return;

      setLoading(true);
      try {
        const [summaryRes, txRes, budgetRes, adhRes, catRes, walletsRes] = await Promise.allSettled([
          api.getBudgetSummary(),
          api.getTransactions(),
          api.getBudgets(),
          api.getBudgetAdherence(),
          api.getCategories(),
          api.getWallets(),
        ]);

        if (isCancelled) return;

        // 1. Process Categories
        let currentCategories = categories;
        const savedMeta = JSON.parse(localStorage.getItem('pbt_category_meta') || '{}');

        if (catRes.status === 'fulfilled' && Array.isArray(catRes.value) && catRes.value.length > 0) {
          currentCategories = catRes.value.map((cat) => {
            const meta = savedMeta[cat.name] || savedMeta[cat.id] || {};
            const normalizedType = (cat.type || 'expense').toLowerCase();
            return {
              id: cat.id,
              name: cat.name,
              type: normalizedType,
              icon: meta.icon || (normalizedType === 'income' ? '💼' : '🏷️'),
              allocatedBudget: Number(meta.allocatedBudget || (normalizedType === 'income' ? 5000 : 500)),
              color: meta.color || (normalizedType === 'income' ? '#10B981' : '#6366F1'),
              description: meta.description || '',
            };
          });
          setCategories(currentCategories);
          localStorage.setItem('pbt_categories', JSON.stringify(currentCategories));
        }

        // 2. Process Wallets
        let currentWallets = wallets;
        if (walletsRes.status === 'fulfilled' && Array.isArray(walletsRes.value)) {
          currentWallets = walletsRes.value;
          setWallets(currentWallets);
        }

        // 3. Process Transactions
        let currentTxs = transactions;
        if (txRes.status === 'fulfilled' && Array.isArray(txRes.value)) {
          currentTxs = txRes.value.map((t) => {
            const cat = currentCategories.find(
              (c) => c.id === t.category_id || (t.category && c.name.toLowerCase() === t.category.toLowerCase())
            );
            const isIncome = (t.type || '').toLowerCase() === 'income';
            const numAmount = Math.abs(parseFloat(t.amount || 0));
            return {
              id: t.id,
              type: isIncome ? 'income' : 'expense',
              category_id: t.category_id,
              category: cat ? cat.name : (isIncome ? 'Income' : 'General'),
              merchant: t.description || t.merchant || 'Transaction',
              amount: isIncome ? numAmount : -numAmount,
              icon: cat?.icon || (isIncome ? '💰' : '💳'),
              date: t.date
                ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Today',
              status: 'Completed',
            };
          });
          setTransactions(currentTxs);
        }

        // 4. Process Budgets
        if (budgetRes.status === 'fulfilled' && Array.isArray(budgetRes.value)) {
          const adherenceList = adhRes.status === 'fulfilled' && adhRes.value?.categories ? adhRes.value.categories : [];
          const normalizedBudgets = budgetRes.value.map((b) => {
            const cat = currentCategories.find((c) => c.id === b.category_id);
            const adh = adherenceList.find((a) => a.category_id === b.category_id || a.budget_id === b.id);
            return {
              id: b.id,
              category_id: b.category_id,
              category: cat ? cat.name : (adh?.category_name || `Category #${b.category_id}`),
              total: parseFloat(b.amount || adh?.budget_limit || 0),
              spent: parseFloat(adh?.actual_spent || 0),
              icon: cat?.icon || '🎯',
              color: 'fill-purple',
              month: b.month,
              year: b.year,
            };
          });
          setBudgets(normalizedBudgets);
        }

        // 5. Process Summary & Stats
        const incomeFromTxs = currentTxs
          .filter((t) => (t.type || '').toLowerCase() === 'income' || Number(t.amount) > 0)
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        const expenseFromTxs = currentTxs
          .filter((t) => (t.type || '').toLowerCase() === 'expense' || Number(t.amount) < 0)
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        const allocatedInc = currentCategories
          .filter((c) => (c.type || '').toLowerCase() === 'income')
          .reduce((sum, c) => sum + Number(c.allocatedBudget || 0), 0);

        const summary = summaryRes.status === 'fulfilled' && summaryRes.value ? summaryRes.value : null;
        const summaryIncome = summary?.total_income != null ? parseFloat(summary.total_income) : 0;
        const summaryExpense = summary?.total_expense != null ? parseFloat(summary.total_expense) : 0;
        const summaryBalance = summary?.current_balance != null ? parseFloat(summary.current_balance) : 0;

        const monthlyIncome = summaryIncome > 0
          ? summaryIncome
          : (incomeFromTxs > 0 ? incomeFromTxs : allocatedInc);

        const monthlyExpenses = summaryExpense > 0
          ? summaryExpense
          : expenseFromTxs;

        const totalBalance = summaryBalance !== 0
          ? summaryBalance
          : (monthlyIncome - monthlyExpenses);

        const totalSavings = Math.max(0, monthlyIncome - monthlyExpenses);

        setStats({
          totalBalance,
          monthlyIncome,
          monthlyExpenses,
          totalSavings,
          balanceTrend: '+0.0%',
          incomeTrend: '+0.0%',
          expenseTrend: '-0.0%',
          savingsTrend: '+0.0%',
        });
      } catch (err) {
        console.warn('Backend data sync error:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadBackendData();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  // ML Recommendations fetch functions
  const fetchMlRecommendations = useCallback(async () => {
    if (!isAuthenticated) return;
    setMlLoading(true);
    setMlError(null);
    try {
      const [fullRes, excessRes, anomaliesRes, categoryRes] = await Promise.allSettled([
        api.getSpendingRecommendations(),
        api.getExcessSpendingAlerts(),
        api.getSpendingAnomalies(),
        api.getCategoryRecommendations(),
      ]);

      let hasData = false;
      
      if (fullRes.status === 'fulfilled' && fullRes.value) {
        setMlRecommendations(fullRes.value);
        hasData = true;
      }
      if (excessRes.status === 'fulfilled' && Array.isArray(excessRes.value) && excessRes.value.length > 0) {
        setExcessSpendingAlerts(excessRes.value);
        hasData = true;
      }
      if (anomaliesRes.status === 'fulfilled' && Array.isArray(anomaliesRes.value) && anomaliesRes.value.length > 0) {
        setSpendingAnomalies(anomaliesRes.value);
        hasData = true;
      }
      if (categoryRes.status === 'fulfilled' && Array.isArray(categoryRes.value) && categoryRes.value.length > 0) {
        setCategoryRecommendations(categoryRes.value);
        hasData = true;
      }

      // If no data from backend, clear ML state (will show empty state in UI)
      if (!hasData) {
        setMlRecommendations(null);
        setExcessSpendingAlerts([]);
        setSpendingAnomalies([]);
        setCategoryRecommendations([]);
      }
    } catch (err) {
      console.warn('ML recommendations fetch error:', err);
      setMlError(err.message);
    } finally {
      setMlLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch ML recommendations when authenticated
  useEffect(() => {
    fetchMlRecommendations();
  }, [fetchMlRecommendations]);

  // Compute live tracking numbers for each category
  const trackedCategories = useMemo(() => {
    return categories.map((cat) => {
      const matchingTxs = transactions.filter(
        (t) =>
          (t.category_id != null && cat.id != null && t.category_id === cat.id) ||
          (t.category && t.category.toLowerCase().trim() === cat.name.toLowerCase().trim())
      );

      const isExpense = cat.type === 'expense';
      const actualAmount = matchingTxs.reduce((sum, t) => {
        const val = Number(t.amount) || 0;
        return sum + Math.abs(val);
      }, 0);

      const allocated = Number(cat.allocatedBudget) || 1;
      const percent = Math.min(Math.round((actualAmount / allocated) * 100), 999);
      const remaining = allocated - actualAmount;

      let status = 'On Track';
      if (isExpense) {
        if (actualAmount > allocated) {
          status = 'Exceeded';
        } else if (percent >= 80) {
          status = 'Near Limit';
        } else {
          status = 'On Track';
        }
      } else {
        if (actualAmount >= allocated) {
          status = 'Goal Met';
        } else {
          status = 'In Progress';
        }
      }

      return {
        ...cat,
        actualAmount,
        allocatedBudget: allocated,
        remaining,
        percent,
        status,
        txCount: matchingTxs.length,
      };
    });
  }, [categories, transactions]);

  // CATEGORY OPERATIONS
  const addCategory = async (newCat) => {
    const normalizedType = (newCat.type || 'expense').toLowerCase();
    const formattedCat = {
      id: `cat-${Date.now()}`,
      name: newCat.name.trim(),
      type: normalizedType,
      icon: newCat.icon || (normalizedType === 'income' ? '💼' : '🏷️'),
      allocatedBudget: Number(newCat.allocatedBudget || (normalizedType === 'income' ? 5000 : 100)),
      color: newCat.color || (normalizedType === 'income' ? '#10B981' : '#6366F1'),
      description: newCat.description || '',
    };

    if (!isDemoMode && isAuthenticated) {
      try {
        const res = await api.createCategory({
          name: formattedCat.name,
          type: formattedCat.type,
        });
        if (res && res.id) {
          formattedCat.id = res.id;
        }
      } catch (err) {
        console.warn('API category sync failed, saving locally:', err.message);
      }
    }

    // Save meta locally
    const savedMeta = JSON.parse(localStorage.getItem('pbt_category_meta') || '{}');
    savedMeta[formattedCat.name] = {
      icon: formattedCat.icon,
      color: formattedCat.color,
      allocatedBudget: formattedCat.allocatedBudget,
      description: formattedCat.description,
    };
    localStorage.setItem('pbt_category_meta', JSON.stringify(savedMeta));

    const updated = [...categories, formattedCat];
    setCategories(updated);
    localStorage.setItem('pbt_categories', JSON.stringify(updated));
    recalculateSummary(transactions, wallets, updated);
    return formattedCat;
  };

  const updateCategory = async (id, updatedFields) => {
    if (isAuthenticated && typeof id === 'number') {
      try {
        await api.updateCategory(id, updatedFields);
      } catch (err) {
        console.warn('API category update failed, saving locally:', err.message);
      }
    }

    const updated = categories.map((c) => (c.id === id ? { ...c, ...updatedFields } : c));
    setCategories(updated);
    localStorage.setItem('pbt_categories', JSON.stringify(updated));
    recalculateSummary(transactions, wallets, updated);
  };

  const deleteCategory = async (id) => {
    if (isAuthenticated && typeof id === 'number') {
      try {
        await api.deleteCategory(id);
      } catch (err) {
        console.warn('API category delete failed, removing locally:', err.message);
      }
    }

    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    localStorage.setItem('pbt_categories', JSON.stringify(updated));
    recalculateSummary(transactions, wallets, updated);
  };

  const applyCategoryTemplate = (templateKey) => {
    const template = CATEGORY_BLUEPRINTS[templateKey];
    if (!template) return;

    const formattedList = template.categories.map((c, idx) => ({
      ...c,
      id: `cat-template-${Date.now()}-${idx}`,
    }));

    setCategories(formattedList);
    localStorage.setItem('pbt_categories', JSON.stringify(formattedList));
  };

  // TRANSACTION OPERATIONS
  const addTransaction = async (newTx) => {
    const matchingCat = categories.find(
      (c) => c.name.toLowerCase() === (newTx.category || '').toLowerCase()
    );
    const isIncome = newTx.type === 'income' || (matchingCat && matchingCat.type === 'income') || Number(newTx.amount) > 0;
    const absAmount = Math.abs(Number(newTx.amount));

    const formattedTx = {
      id: `tx-${Date.now()}`,
      type: isIncome ? 'income' : 'expense',
      category_id: matchingCat ? matchingCat.id : undefined,
      merchant: newTx.merchant || newTx.description || 'Transaction',
      category: newTx.category || (isIncome ? 'Income' : 'General'),
      icon: newTx.icon || matchingCat?.icon || (isIncome ? '💰' : '💳'),
      date:
        newTx.date ||
        new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      status: newTx.status || 'Completed',
      amount: isIncome ? absAmount : -absAmount,
    };

    if (isAuthenticated) {
      try {
        const res = await api.createTransaction({
          type: isIncome ? 'income' : 'expense',
          amount: absAmount,
          category_id: typeof matchingCat?.id === 'number' ? matchingCat.id : undefined,
          description: formattedTx.merchant,
        });
        if (res && res.id) {
          formattedTx.id = res.id;
          formattedTx.category_id = res.category_id;
        }
      } catch (err) {
        console.warn('API transaction sync failed, saving locally:', err.message);
      }
    }

    const updated = [formattedTx, ...transactions];
    setTransactions(updated);
    recalculateSummary(updated, wallets);
    return formattedTx;
  };

  const deleteTransaction = async (id) => {
    if (isAuthenticated && typeof id === 'number') {
      try {
        await api.deleteTransaction(id);
      } catch (err) {
        console.warn('API transaction delete failed, removing locally:', err.message);
      }
    }
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    recalculateSummary(updated, wallets);
  };

  const addBudget = async (newBudget) => {
    const matchingCat = categories.find((c) => c.name === newBudget.category);
    const colorOptions = ['fill-purple', 'fill-green', 'fill-blue', 'fill-orange'];
    const formattedBudget = {
      id: `b-${Date.now()}`,
      category_id: matchingCat?.id,
      category: newBudget.category,
      icon: newBudget.icon || matchingCat?.icon || '🎯',
      spent: Number(newBudget.spent || 0),
      total: Number(newBudget.total),
      color: newBudget.color || colorOptions[budgets.length % colorOptions.length],
    };

    if (isAuthenticated && typeof matchingCat?.id === 'number') {
      try {
        const now = new Date();
        const res = await api.createBudget({
          category_id: matchingCat.id,
          amount: Number(newBudget.total),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        if (res && res.id) {
          formattedBudget.id = res.id;
        }
      } catch (err) {
        console.warn('API budget sync failed, saving locally:', err.message);
      }
    }

    setBudgets((prev) => [...prev, formattedBudget]);
    return formattedBudget;
  };

  const addWallet = async (newWallet) => {
    const gradients = [
      'linear-gradient(135deg, #6366F1, #8B5CF6)',
      'linear-gradient(135deg, #10B981, #059669)',
      'linear-gradient(135deg, #EC4899, #8B5CF6)',
      'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    ];

    const formattedWallet = {
      id: `w-${Date.now()}`,
      name: newWallet.name,
      type: newWallet.type || 'Checking',
      accountNumber: newWallet.accountNumber || `**** ${Math.floor(1000 + Math.random() * 9000)}`,
      balance: Number(newWallet.balance || 0),
      gradient: gradients[wallets.length % gradients.length],
    };

    if (isAuthenticated) {
      try {
        await api.createWallet(formattedWallet);
      } catch (err) {
        console.warn('API wallet sync failed, saving locally:', err.message);
      }
    }

    const updated = [...wallets, formattedWallet];
    setWallets(updated);
    recalculateSummary(transactions, updated);
    return formattedWallet;
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (tx.merchant && tx.merchant.toLowerCase().includes(query)) ||
      (tx.category && tx.category.toLowerCase().includes(query)) ||
      (tx.date && tx.date.toLowerCase().includes(query))
    );
  });

  const value = {
    stats,
    budgets,
    categories,
    trackedCategories,
    transactions: filteredTransactions,
    rawTransactions: transactions,
    wallets,
    searchQuery,
    setSearchQuery,
    addTransaction,
    deleteTransaction,
    addBudget,
    addWallet,
    addCategory,
    updateCategory,
    deleteCategory,
    applyCategoryTemplate,
    recalculateSummary,
    // ML Recommendations
    mlRecommendations,
    excessSpendingAlerts,
    spendingAnomalies,
    categoryRecommendations,
    mlLoading,
    mlError,
    fetchMlRecommendations,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export default BudgetProvider;
