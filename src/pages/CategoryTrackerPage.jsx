import { useState } from 'react';
import { useBudget } from '../context/useBudget';
import { CATEGORY_BLUEPRINTS } from '../context/categoryDefaults';
import { formatCurrency } from '../utils/currency';

export default function CategoryTrackerPage({ onOpenAddCategory, onEditCategory, onOpenAddTxWithCategory }) {
  const {
    trackedCategories,
    deleteCategory,
    applyCategoryTemplate,
    resetCategoriesToDefault,
  } = useBudget();

  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'EXPENSE', 'INCOME', 'ALERTS'
  const [showBlueprints, setShowBlueprints] = useState(false);
  const [appliedNotification, setAppliedNotification] = useState('');

  const handleApplyBlueprint = (key) => {
    applyCategoryTemplate(key);
    const title = CATEGORY_BLUEPRINTS[key]?.title || 'Blueprint';
    setAppliedNotification(`Applied "${title}" successfully!`);
    setTimeout(() => setAppliedNotification(''), 4000);
  };

  // Filter categories
  const filtered = trackedCategories.filter((cat) => {
    const cType = (cat.type || '').toLowerCase();
    if (filterType === 'EXPENSE' && cType !== 'expense') return false;
    if (filterType === 'INCOME' && cType !== 'income') return false;
    if (filterType === 'ALERTS' && cat.status !== 'Exceeded' && cat.status !== 'Near Limit') return false;
    return true;
  });

  // Global metrics
  const expenseCategories = trackedCategories.filter((c) => (c.type || '').toLowerCase() === 'expense');
  const incomeCategories = trackedCategories.filter((c) => (c.type || '').toLowerCase() === 'income');
  const totalAllocatedExpense = expenseCategories.reduce((sum, c) => sum + Number(c.allocatedBudget || 0), 0);
  const totalActualExpense = expenseCategories.reduce((sum, c) => sum + Number(c.actualAmount || 0), 0);
  const totalAllocatedIncome = incomeCategories.reduce((sum, c) => sum + Number(c.allocatedBudget || 0), 0);
  const totalActualIncome = incomeCategories.reduce((sum, c) => sum + Number(c.actualAmount || 0), 0);
  const overBudgetCategories = expenseCategories.filter((c) => c.status === 'Exceeded').length;
  const nearLimitCategories = expenseCategories.filter((c) => c.status === 'Near Limit').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Category Tracker & Setup</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Set up custom categories, track monthly spending thresholds, and automate expense classification.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowBlueprints(!showBlueprints)}
          >
            {showBlueprints ? '✕ Close Setup Blueprints' : '⚡ Setup Blueprints'}
          </button>
          <button className="btn-primary" onClick={onOpenAddCategory}>
            + Add Category
          </button>
        </div>
      </div>

      {/* Applied Notification Banner */}
      {appliedNotification && (
        <div className="alert-box alert-success" style={{ margin: 0 }}>
          <span>✓</span>
          <span>{appliedNotification}</span>
        </div>
      )}

      {/* Blueprint / Setup Onboarding Drawer */}
      {showBlueprints && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                🚀 Quick Setup: Choose a Category Blueprint
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                Select a pre-configured financial architecture to jump-start your category tracking.
              </p>
            </div>
            <button
              onClick={resetCategoriesToDefault}
              className="btn-secondary btn-sm"
              title="Reset to default categories"
            >
              Reset to Defaults
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.entries(CATEGORY_BLUEPRINTS).map(([key, bp]) => (
              <div
                key={key}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{bp.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
                    {bp.description}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {bp.categories.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {c.icon} {c.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  className="btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleApplyBlueprint(key)}
                >
                  Apply This Blueprint
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configured Categories</div>
          <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
            {trackedCategories.length} <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tracked</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Outflow</div>
          <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px', color: 'var(--text-primary)' }}>
            {formatCurrency(totalAllocatedExpense)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Month Spending</div>
          <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px', color: '#8B5CF6' }}>
            {formatCurrency(totalActualExpense)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target Income Inflow</div>
          <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px', color: 'var(--color-success)' }}>
            +{formatCurrency(totalAllocatedIncome > 0 ? totalAllocatedIncome : totalActualIncome)}
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Category Health</div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {overBudgetCategories > 0 ? (
              <span style={{ color: 'var(--color-danger)', fontSize: '14px' }}>
                ⚠️ {overBudgetCategories} Exceeded
              </span>
            ) : nearLimitCategories > 0 ? (
              <span style={{ color: 'var(--color-warning)', fontSize: '14px' }}>
                ⚡ {nearLimitCategories} Near Limit
              </span>
            ) : (
              <span style={{ color: 'var(--color-success)', fontSize: '14px' }}>
                ✓ All within caps
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <button
            className={`filter-pill ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            All Categories ({trackedCategories.length})
          </button>
          <button
            className={`filter-pill ${filterType === 'EXPENSE' ? 'active' : ''}`}
            onClick={() => setFilterType('EXPENSE')}
          >
            💸 Expenses ({expenseCategories.length})
          </button>
          <button
            className={`filter-pill ${filterType === 'INCOME' ? 'active' : ''}`}
            onClick={() => setFilterType('INCOME')}
          >
            💰 Income ({incomeCategories.length})
          </button>
          <button
            className={`filter-pill ${filterType === 'ALERTS' ? 'active' : ''}`}
            onClick={() => setFilterType('ALERTS')}
          >
            ⚠️ Alerts ({overBudgetCategories + nearLimitCategories})
          </button>
        </div>

        <button
          className="btn-secondary btn-sm"
          onClick={onOpenAddCategory}
        >
          + Quick New Category
        </button>
      </div>

      {/* Categories Cards Grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
          <p>No categories match this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filtered.map((cat) => {
            const isExpense = cat.type === 'expense';
            const percent = cat.percent;
            const remaining = cat.remaining;

            let badgeBg = 'var(--color-success-bg)';
            let badgeColor = 'var(--color-success)';
            let fillGradient = 'linear-gradient(90deg, #10B981, #34D399)';

            if (isExpense) {
              if (cat.status === 'Exceeded') {
                badgeBg = 'var(--color-danger-bg)';
                badgeColor = 'var(--color-danger)';
                fillGradient = 'linear-gradient(90deg, #EF4444, #F87171)';
              } else if (cat.status === 'Near Limit') {
                badgeBg = 'rgba(245, 158, 11, 0.15)';
                badgeColor = 'var(--color-warning)';
                fillGradient = 'linear-gradient(90deg, #F59E0B, #FBBF24)';
              } else {
                badgeBg = 'rgba(99, 102, 241, 0.15)';
                badgeColor = '#A5B4FC';
                fillGradient = `linear-gradient(90deg, ${cat.color || '#6366F1'}, #8B5CF6)`;
              }
            }

            return (
              <div
                key={cat.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '22px',
                  borderLeft: `4px solid ${cat.color || '#6366F1'}`,
                }}
              >
                {/* Top Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '24px',
                          background: 'var(--bg-card-hover)',
                          width: '44px',
                          height: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '10px',
                        }}
                      >
                        {cat.icon}
                      </span>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{cat.name}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {cat.type}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      {cat.status}
                    </span>
                  </div>

                  {cat.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                      {cat.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {isExpense ? 'Spent' : 'Received'}: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(cat.actualAmount)}</strong>
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Cap: <strong>{formatCurrency(cat.allocatedBudget)}</strong> ({percent}%)
                    </span>
                  </div>

                  <div className="progress-bar" style={{ height: '8px', marginBottom: '12px' }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(percent, 100)}%`,
                        background: fillGradient,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {cat.txCount} transaction{cat.txCount !== 1 ? 's' : ''} logged
                    </span>
                    <span style={{ fontWeight: '600', color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                    </span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => onOpenAddTxWithCategory(cat.name)}
                    title={`Log a transaction in ${cat.name}`}
                  >
                    + Log Spend
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => onEditCategory(cat)}
                      title="Edit Category Details"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => deleteCategory(cat.id)}
                      title="Delete Category"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
