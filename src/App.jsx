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

import AddTransactionModal from './components/modals/AddTransactionModal';
import AddBudgetModal from './components/modals/AddBudgetModal';
import AddWalletModal from './components/modals/AddWalletModal';
import AddCategoryModal from './components/modals/AddCategoryModal';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal states
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [initialTxCategory, setInitialTxCategory] = useState(null);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [initialCategoryType, setInitialCategoryType] = useState('expense');

  const handleOpenAddTxWithCategory = (categoryName) => {
    setInitialTxCategory(categoryName);
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
            onOpenAddTx={() => {
              setInitialTxCategory(null);
              setIsAddTxOpen(true);
            }}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          {/* Tab Pages */}
          {currentTab === 'budget-profile' && (
            <BudgetProfilePage
              onOpenAddCategory={handleOpenNewCategory}
              onOpenAddTx={() => {
                setInitialTxCategory(null);
                setIsAddTxOpen(true);
              }}
              onOpenAddBudget={() => setIsAddBudgetOpen(true)}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentTab}
              onOpenAddTx={() => {
                setInitialTxCategory(null);
                setIsAddTxOpen(true);
              }}
              onOpenAddBudget={() => setIsAddBudgetOpen(true)}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenAddTx={() => {
                setInitialTxCategory(null);
                setIsAddTxOpen(true);
              }}
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
            <BudgetsPage onOpenAddBudget={() => setIsAddBudgetOpen(true)} />
          )}

          {currentTab === 'wallets' && (
            <WalletsPage onOpenAddWallet={() => setIsAddWalletOpen(true)} />
          )}
        </main>

        {/* Global Modals */}
        <AddTransactionModal
          key={`tx-modal-${isAddTxOpen}-${initialTxCategory || 'default'}`}
          isOpen={isAddTxOpen}
          initialCategory={initialTxCategory}
          onClose={() => {
            setIsAddTxOpen(false);
            setInitialTxCategory(null);
          }}
        />
        <AddBudgetModal
          isOpen={isAddBudgetOpen}
          onClose={() => setIsAddBudgetOpen(false)}
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
