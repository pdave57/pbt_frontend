import { useState } from 'react';
import { useBudget } from '../context/useBudget';

export default function DashboardPage({ onNavigate, onOpenAddTx, onOpenAddBudget }) {
  const { stats, budgets, transactions, deleteTransaction } = useBudget();
  const [chartPeriod, setChartPeriod] = useState('6M');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="M2 10h20"></path>
              </svg>
            </div>
            <span className="stat-trend trend-up">{stats.balanceTrend || '+12.5%'}</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.totalBalance)}</div>
          <div className="stat-label">Total Balance</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <span className="stat-trend trend-up">{stats.incomeTrend || '+8.2%'}</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.monthlyIncome)}</div>
          <div className="stat-label">Monthly Income</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon red">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
            </div>
            <span className="stat-trend trend-down">{stats.expenseTrend || '-4.1%'}</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.monthlyExpenses)}</div>
          <div className="stat-label">Monthly Expenses</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"></path>
                <path d="M2 9.5h.01"></path>
              </svg>
            </div>
            <span className="stat-trend trend-up">{stats.savingsTrend || '+15.3%'}</span>
          </div>
          <div className="stat-value">{formatCurrency(stats.totalSavings)}</div>
          <div className="stat-label">Total Savings</div>
        </div>
      </section>

      {/* Content Grid (Chart & Budgets) */}
      <section className="content-grid">
        {/* Chart Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Cashflow Overview</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Income vs Expenses trend</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['1M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  style={{
                    background: chartPeriod === period ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: chartPeriod === period ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    color: chartPeriod === period ? 'var(--accent-primary)' : 'var(--text-muted)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

              {/* Area */}
              <path
                d="M0,160 C80,160 120,80 200,100 C280,120 320,40 400,60 C480,80 520,130 600,110 L600,200 L0,200 Z"
                fill="url(#areaGradient)"
              />
              {/* Line */}
              <path
                d="M0,160 C80,160 120,80 200,100 C280,120 320,40 400,60 C480,80 520,130 600,110"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="200" cy="100" r="5" fill="#111827" stroke="#8B5CF6" strokeWidth="2.5" />
              <circle cx="400" cy="60" r="5" fill="#111827" stroke="#8B5CF6" strokeWidth="2.5" />
            </svg>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#8B5CF6' }}></span>
              Income vs Expenses
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#10B981' }}></span>
              Net Savings (+${stats.totalSavings?.toLocaleString()})
            </div>
          </div>
        </div>

        {/* Budgets Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Budgets</h2>
            <button
              onClick={onOpenAddBudget}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              + Add
            </button>
          </div>

          <div className="budget-list">
            {budgets.slice(0, 4).map((b) => {
              const percent = Math.min(Math.round((b.spent / b.total) * 100), 100);
              return (
                <div key={b.id} className="budget-item">
                  <div className="budget-item-header">
                    <span className="budget-category">
                      {b.icon} {b.category}
                    </span>
                    <span className="budget-amount">
                      <span>${b.spent}</span> / ${b.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${b.color || 'fill-purple'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => onNavigate('categories')}
              className="card-action"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              🏷️ Category Tracker & Setup →
            </button>
            <button
              onClick={() => onNavigate('budgets')}
              className="card-action"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}
            >
              View Budgets →
            </button>
          </div>
        </div>
      </section>

      {/* Recent Transactions Table */}
      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Transactions</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing latest {recentTransactions.length} items
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={onOpenAddTx}
              className="btn-secondary btn-sm"
            >
              + Add
            </button>
            <button
              onClick={() => onNavigate('transactions')}
              className="card-action"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions found. Click &quot;Add Transaction&quot; to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'center', width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => {
                  const isPositive = Number(tx.amount) > 0;
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div className="tx-merchant">
                          <div className="tx-icon">{tx.icon || (isPositive ? '💰' : '💳')}</div>
                          <div>
                            <div className="tx-name">{tx.merchant}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{tx.category}</td>
                      <td className="tx-date">{tx.date}</td>
                      <td>
                        <span
                          className={`tx-status ${
                            tx.status === 'Completed' ? 'status-completed' : 'status-pending'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className={`tx-amount ${
                          isPositive ? 'amount-positive' : 'amount-negative'
                        }`}
                      >
                        {isPositive ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(Math.abs(tx.amount))}`}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          title="Delete transaction"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

