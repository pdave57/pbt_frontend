import { useState } from 'react';
import { AuthProvider, useAuth, BudgetProvider } from './context';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardPage from './pages/DashboardPage';
import BudgetProfilePage from './pages/BudgetProfilePage';
import TransactionsPage from './pages/TransactionsPage';
import CategoryTrackerPage from './pages/CategoryTrackerPage';
import BudgetsPage from './pages/BudgetsPage';
import WalletsPage from './pages/WalletsPage';
import AuthPage from './pages/AuthPage';
import ReportsPage from './pages/ReportsPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';

import AddTransactionModal from './components/modals/AddTransactionModal';
import AddBudgetModal from './components/modals/AddBudgetModal';
import AddWalletModal from './components/modals/AddWalletModal';
import AddCategoryModal from './components/modals/AddCategoryModal';
import BackendStatus from './components/BackendStatus';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [initialTxCategory, setInitialTxCategory] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [initialCategoryType, setInitialCategoryType] = useState('expense');

  const handleOpenAddTxWithCategory = (categoryName) => {
    setEditingTransaction(null);
    setInitialTxCategory(categoryName);
    setIsAddTxOpen(true);
  };

  const handleOpenTransactionEditor = (transaction) => {
    setInitialTxCategory(null);
    setEditingTransaction(transaction);
    setIsAddTxOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsAddCategoryOpen(true);
  };

  const handleOpenNewCategory = (type = 'expense') => {
    setEditingCategory(null);
    setInitialCategoryType(typeof type === 'string' && type === 'income' ? 'income' : 'expense');
    setIsAddCategoryOpen(true);
  };

  const handleOpenBudget = (budget = null) => {
    setEditingBudget(budget);
    setIsAddBudgetOpen(true);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-base)',
          color: 'var(--text-secondary)',
          fontSize: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon" style={{ width: '28px', height: '28px' }}>
            P
          </div>
          <span>Loading Personal Budget Tracker...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <BudgetProvider>
      <div className="app-container">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="main-content">
          <TopBar
            currentTab={currentTab}
            onOpenAddTx={() => {
              setEditingTransaction(null);
              setInitialTxCategory(null);
              setIsAddTxOpen(true);
            }}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Tab Pages */}
          <BackendStatus />

          {currentTab === 'budget-profile' && (
            <BudgetProfilePage
              onOpenAddCategory={handleOpenNewCategory}
              onOpenAddTx={() => {
                setEditingTransaction(null);
                setInitialTxCategory(null);
                setIsAddTxOpen(true);
              }}
              onOpenAddBudget={() => handleOpenBudget()}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenAddTx={() => {
                setEditingTransaction(null);
                setInitialTxCategory(null);
                setIsAddTxOpen(true);
              }}
              onOpenAddBudget={() => handleOpenBudget()}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenAddTx={() => {
                setEditingTransaction(null);
                setInitialTxCategory(null);
                setIsAddTxOpen(true);
              }}
              onEditTransaction={handleOpenTransactionEditor}
            />
          )}

          {currentTab === 'categories' && (
            <CategoryTrackerPage
              onOpenAddCategory={handleOpenNewCategory}
              onEditCategory={handleEditCategory}
              onOpenAddTxWithCategory={handleOpenAddTxWithCategory}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetsPage
              onOpenAddBudget={() => handleOpenBudget()}
              onEditBudget={(budget) => handleOpenBudget(budget)}
            />
          )}

          {currentTab === 'wallets' && (
            <WalletsPage onOpenAddWallet={() => setIsAddWalletOpen(true)} />
          )}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'insights' && <InsightsPage />}

          {currentTab === 'settings' && <SettingsPage />}
        </main>

        {/* Global Modals */}
        <AddTransactionModal
          key={`tx-modal-${isAddTxOpen}-${editingTransaction?.id || initialTxCategory || 'default'}`}
          isOpen={isAddTxOpen}
          initialCategory={initialTxCategory}
          editingTransaction={editingTransaction}
          onClose={() => {
            setIsAddTxOpen(false);
            setInitialTxCategory(null);
            setEditingTransaction(null);
          }}
        />
        <AddBudgetModal
          key={`budget-modal-${isAddBudgetOpen}-${editingBudget?.id || 'new'}`}
          isOpen={isAddBudgetOpen}
          editingBudget={editingBudget}
          onClose={() => {
            setIsAddBudgetOpen(false);
            setEditingBudget(null);
          }}
        />
        <AddWalletModal
          isOpen={isAddWalletOpen}
          onClose={() => setIsAddWalletOpen(false)}
        />
        <AddCategoryModal
          key={`cat-modal-${isAddCategoryOpen}-${editingCategory?.id || initialCategoryType}`}
          isOpen={isAddCategoryOpen}
          editingCategory={editingCategory}
          initialType={initialCategoryType}
          onClose={() => {
            setIsAddCategoryOpen(false);
            setEditingCategory(null);
          }}
        />
      </div>
    </BudgetProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
