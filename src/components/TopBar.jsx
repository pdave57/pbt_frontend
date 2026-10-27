import { useAuth } from '../context/useAuth';
import { useBudget } from '../context/useBudget';

export default function TopBar({ currentTab = 'dashboard', onOpenAddTx, onToggleMobileMenu }) {
  const { user } = useAuth();
  const { searchQuery, setSearchQuery } = useBudget();

  const firstName = (user?.name || user?.full_name || user?.email?.split('@')[0] || 'User').split(' ')[0];
  const pageTitles = {
    'budget-profile': ['Budget profile', 'Your financial setup at a glance.'],
    dashboard: [`Good to see you, ${firstName}`, "Here's what's happening with your finances."],
    transactions: ['Transactions', 'Search and review your activity.'],
    categories: ['Categories', 'Organize income and spending.'],
    budgets: ['Budgets', 'Track limits and keep spending on course.'],
    wallets: ['Wallets', 'Your locally saved accounts.'],
    reports: ['Reports', 'Explore your financial trends.'],
    insights: ['ML insights', 'Recommendations based on your activity.'],
    settings: ['Settings', 'Manage your account and backend connection.'],
  };
  const [title, subtitle] = pageTitles[currentTab] || pageTitles.dashboard;

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="hamburger-btn icon-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="page-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="top-actions">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          onClick={onOpenAddTx}
          title="Add New Transaction"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Transaction</span>
        </button>

        <button className="icon-btn" title="Notifications" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notification-dot"></span>
        </button>
      </div>
    </header>
  );
}
