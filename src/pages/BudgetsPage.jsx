import { useBudget } from '../context/useBudget';
import { formatCurrency } from '../utils/currency';

export default function BudgetsPage({ onOpenAddBudget }) {
  const { budgets } = useBudget();

  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.total || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Monthly Budgets</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Set spending caps and monitor category health in real-time.
          </p>
        </div>
        <button className="btn-primary" onClick={onOpenAddBudget}>
          + Create Budget
        </button>
      </div>

      {/* Overview Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall Monthly Budget Usage</div>
            <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
              {formatCurrency(totalSpent)} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {formatCurrency(totalBudgeted)}</span>
            </div>
          </div>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '14px',
              background: overallPercentage > 85 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              color: overallPercentage > 85 ? 'var(--color-danger)' : 'var(--color-success)',
            }}
          >
            {overallPercentage}% Utilized
          </div>
        </div>

        <div className="progress-bar" style={{ height: '10px' }}>
          <div
            className="progress-fill fill-purple"
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Budgets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {budgets.map((b) => {
          const percent = Math.min(Math.round((b.spent / b.total) * 100), 100);
          const remaining = b.total - b.spent;
          const isWarning = percent >= 85;

          return (
            <div key={b.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{b.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{b.category}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monthly target</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: isWarning ? 'var(--color-danger-bg)' : 'rgba(255, 255, 255, 0.05)',
                    color: isWarning ? 'var(--color-danger)' : 'var(--text-secondary)',
                  }}
                >
                  {percent}%
                </span>
              </div>

              <div className="progress-bar" style={{ height: '8px', marginBottom: '16px' }}>
                <div
                  className={`progress-fill ${isWarning ? 'fill-orange' : b.color || 'fill-purple'}`}
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Spent: </span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(b.spent)}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Remaining: </span>
                  <span style={{ fontWeight: '600', color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

