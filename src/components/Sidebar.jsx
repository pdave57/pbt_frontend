import { useAuth } from '../context/useAuth';

export default function Sidebar({ currentTab, setCurrentTab, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'budget-profile',
      label: 'Budget Profile',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" strokeWidth="2" />
          <polyline points="8 10 12 14 16 10" strokeWidth="2" />
          <line x1="8" y1="18" x2="16" y2="18" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
          <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'categories',
      label: 'Category Tracker',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h7" strokeWidth="2" />
          <circle cx="18" cy="18" r="3" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: 'wallets',
      label: 'Wallets',
      icon: (
        <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" strokeWidth="2" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" strokeWidth="2" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  const displayName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AJ';

  return (
    <>
      {mobileOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 990 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="logo" style={{ cursor: 'pointer', gap: '10px' }} onClick={() => setCurrentTab('dashboard')}>
          <div className="logo-icon" style={{ minWidth: '32px' }}>P</div>
          <span style={{ fontSize: '15px', fontWeight: '700', lineHeight: '1.2' }}>Personal Budget Tracker</span>
        </div>

        <ul className="nav-menu">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Demo Mode Banner Removed */}

        <div className="sidebar-footer">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name" title={user?.email || displayName}>
              {displayName}
            </div>
            <div className="user-plan">Personal Account</div>
          </div>
          <button
            title="Logout"
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}