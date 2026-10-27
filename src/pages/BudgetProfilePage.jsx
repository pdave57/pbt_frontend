import { useBudget } from '../context/useBudget';
import { formatCurrency } from '../utils/currency';

export default function BudgetProfilePage({ onOpenAddCategory, onOpenAddTx, onOpenAddBudget }) {
  const { trackedCategories, budgets, transactions, stats } = useBudget();

  // Calculate key metrics
  const expenseCategories = trackedCategories.filter((c) => (c.type || '').toLowerCase() === 'expense');
  const incomeCategories = trackedCategories.filter((c) => (c.type || '').toLowerCase() === 'income');
  
  const totalAllocatedExpense = expenseCategories.reduce((sum, c) => sum + Number(c.allocatedBudget || 0), 0);
  const totalActualExpense = expenseCategories.reduce((sum, c) => sum + Number(c.actualAmount || 0), 0);
  const totalAllocatedIncome = incomeCategories.reduce((sum, c) => sum + Number(c.allocatedBudget || 0), 0);
  const totalActualIncome = incomeCategories.reduce((sum, c) => sum + Number(c.actualAmount || 0), 0);
  
  const overBudgetCount = expenseCategories.filter((c) => c.status === 'Exceeded').length;
  const nearLimitCount = expenseCategories.filter((c) => c.status === 'Near Limit').length;
  const onTrackCount = expenseCategories.filter((c) => c.status === 'On Track').length;
  
  const totalBudgeted = budgets.reduce((acc, b) => acc + Number(b.total || 0), 0);
  const totalSpent = budgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);
  const overallBudgetPercent = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const txIncome = transactions
    .filter((t) => (t.type || '').toLowerCase() === 'income' || Number(t.amount) > 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const txExpense = transactions
    .filter((t) => (t.type || '').toLowerCase() === 'expense' || Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const displayMonthlyIncome = Number(stats.monthlyIncome) > 0
    ? Number(stats.monthlyIncome)
    : (totalActualIncome > 0
        ? totalActualIncome
        : (txIncome > 0
            ? txIncome
            : (totalAllocatedIncome > 0 ? totalAllocatedIncome : 0)));

  const displayMonthlyExpenses = Number(stats.monthlyExpenses) > 0
    ? Number(stats.monthlyExpenses)
    : (totalActualExpense > 0
        ? totalActualExpense
        : (txExpense > 0 ? txExpense : 0));

  const displayBalance = Number(stats.totalBalance) !== 0
    ? Number(stats.totalBalance)
    : (displayMonthlyIncome - displayMonthlyExpenses);

  const displaySavings = displayMonthlyIncome - displayMonthlyExpenses > 0
    ? displayMonthlyIncome - displayMonthlyExpenses
    : (Number(stats.totalSavings) || 0);

  const incomeRealizationPercent = totalAllocatedIncome > 0
    ? Math.round((totalActualIncome / totalAllocatedIncome) * 100)
    : (totalActualIncome > 0 ? 100 : 0);

  // Recent transactions
  const recentTransactions = [...transactions].slice(0, 5);

  // Top spending categories
  const topExpenseCategories = [...expenseCategories]
    .sort((a, b) => Number(b.actualAmount) - Number(a.actualAmount))
    .slice(0, 4);

  // Income categories sorted by received amount or target
  const sortedIncomeCategories = [...incomeCategories]
    .sort((a, b) => (Number(b.actualAmount) || Number(b.allocatedBudget)) - (Number(a.actualAmount) || Number(a.allocatedBudget)));

  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Budget Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Complete overview of your financial setup with quick actions to add categories, transactions, and budgets.
          </p>
        </div>
      </div>

      {/* Quick Action Cards - Main Feature */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Add Category Card */}
        <div className="card action-card" onClick={onOpenAddCategory} style={{ 
          cursor: 'pointer',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '2px dashed var(--border-subtle)',
          transition: 'all 0.2s ease',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                🏷️
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>Add Category</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Create a new tracking category</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Set up expense or income categories with monthly targets, icons, and color coding for easy tracking.
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '16px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {trackedCategories.length} categories configured
            </span>
            <span style={{ 
              background: 'var(--accent-primary)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: '600' 
            }}>
              + Add
            </span>
          </div>
        </div>

        {/* Add Transaction Card */}
        <div className="card action-card" onClick={onOpenAddTx} style={{ 
          cursor: 'pointer',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '2px dashed var(--border-subtle)',
          transition: 'all 0.2s ease',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #10B981, #34D399)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                💳
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>Log Transaction</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Record a new expense or income</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Quickly record spending or income with merchant, amount, category, and date.
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '16px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {transactions.length} transactions recorded
            </span>
            <span style={{ 
              background: 'var(--color-success)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: '600' 
            }}>
              + Log
            </span>
          </div>
        </div>

        {/* Add Budget Card */}
        <div className="card action-card" onClick={onOpenAddBudget} style={{ 
          cursor: 'pointer',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '2px dashed var(--border-subtle)',
          transition: 'all 0.2s ease',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '22px'
              }}>
                🎯
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>Create Budget</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Set a monthly spending limit</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Define budget caps for specific categories with monthly limits and track adherence.
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '16px'
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {budgets.length} active budgets
            </span>
            <span style={{ 
              background: 'var(--color-warning)', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '8px', 
              fontSize: '12px', 
              fontWeight: '600' 
            }}>
              + Create
            </span>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Balance</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {formatCurrency(displayBalance)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-success)', marginTop: '4px', fontWeight: '600' }}>
            {stats.balanceTrend || '+0.0%'} from last month
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Monthly Income</div>
            {totalAllocatedIncome > 0 && totalActualIncome > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-success)', background: 'var(--color-success-bg)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                {incomeRealizationPercent}% target
              </span>
            )}
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-success)' }}>
            +{formatCurrency(displayMonthlyIncome)}
          </div>
          <div style={{ fontSize: '12px', color: totalAllocatedIncome > 0 ? 'var(--text-secondary)' : 'var(--color-success)', marginTop: '4px', fontWeight: '500' }}>
            {totalAllocatedIncome > 0 ? `Target: ${formatCurrency(totalAllocatedIncome)} / mo` : `${stats.incomeTrend || '+0.0%'} vs last month`}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Monthly Expenses</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-danger)' }}>
            -{formatCurrency(displayMonthlyExpenses)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-danger)', marginTop: '4px', fontWeight: '600' }}>
            {stats.expenseTrend || '-0.0%'} vs last month
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Net Savings</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#8B5CF6' }}>
            {formatCurrency(displaySavings)}
          </div>
          <div style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px', fontWeight: '600' }}>
            {stats.savingsTrend || '+0.0%'} this period
          </div>
        </div>
      </div>

      {/* Category Health & Budget Adherence Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Category Health Summary */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Category Health</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {trackedCategories.length} categories tracked
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'On Track', count: onTrackCount, color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: '✓' },
              { label: 'Near Limit', count: nearLimitCount, color: 'var(--color-warning)', bg: 'rgba(245, 158, 11, 0.15)', icon: '⚡' },
              { label: 'Exceeded', count: overBudgetCount, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', icon: '⚠️' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: item.bg, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: item.color }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Overall category progress */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expense Allocation</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(totalActualExpense)} / {formatCurrency(totalAllocatedExpense)}</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-fill fill-purple" style={{ width: `${Math.min(totalAllocatedExpense > 0 ? Math.round((totalActualExpense / totalAllocatedExpense) * 100) : 0, 100)}%` }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                {totalAllocatedExpense > 0 ? Math.round((totalActualExpense / totalAllocatedExpense) * 100) : 0}% utilized
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Income Realization</span>
                <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                  {formatCurrency(totalActualIncome)} / {formatCurrency(totalAllocatedIncome > 0 ? totalAllocatedIncome : displayMonthlyIncome)}
                </span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div style={{ 
                  height: '100%', 
                  borderRadius: '4px',
                  background: 'var(--color-success)', 
                  width: `${Math.min(incomeRealizationPercent, 100)}%`,
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-success)', marginTop: '4px', textAlign: 'right', fontWeight: '500' }}>
                {incomeRealizationPercent}% received
              </div>
            </div>
          </div>
        </div>

        {/* Budget Adherence Summary */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Budget Adherence</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {budgets.length} active budgets
            </span>
          </div>

          {budgets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
              <p style={{ marginBottom: '16px' }}>No budgets created yet</p>
              <button className="btn-primary btn-sm" onClick={onOpenAddBudget}>
                Create First Budget
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall Usage</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {formatCurrency(totalSpent)} <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/ {formatCurrency(totalBudgeted)}</span>
                  </div>
                </div>
                <div style={{ 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontWeight: '700', 
                  fontSize: '14px',
                  background: overallBudgetPercent > 85 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                  color: overallBudgetPercent > 85 ? 'var(--color-danger)' : 'var(--color-success)',
                }}>
                  {overallBudgetPercent}% Utilized
                </div>
              </div>

              <div className="progress-bar" style={{ height: '10px', marginBottom: '20px' }}>
                <div className="progress-fill fill-purple" style={{ width: `${Math.min(overallBudgetPercent, 100)}%` }}></div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {budgets.slice(0, 4).map((b) => {
                  const percent = Math.min(Math.round((b.spent / b.total) * 100), 100);
                  const remaining = b.total - b.spent;
                  const isWarning = percent >= 85;
                  return (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ fontSize: '18px' }}>{b.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.category}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {formatCurrency(b.spent)} / {formatCurrency(b.total)}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', minWidth: '80px' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          color: isWarning ? 'var(--color-danger)' : 'var(--color-success)' 
                        }}>
                          {percent}%
                        </span>
                        <span style={{ fontSize: '11px', color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {formatCurrency(remaining)} left
                        </span>
                      </div>
                    </div>
                  );
                })}
                {budgets.length > 4 && (
                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      +{budgets.length - 4} more budget{budgets.length - 4 !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Categories & Income Sources Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Top Expense Categories */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Top Spending Categories</h3>
          {topExpenseCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
              <p>No expense data yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topExpenseCategories.map((cat, idx) => {
                const percent = cat.percent;
                return (
                  <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: 'var(--bg-card)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {cat.icon}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.name}
                          </span>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            background: cat.status === 'Exceeded' ? 'var(--color-danger-bg)' : 
                                      cat.status === 'Near Limit' ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-success-bg)',
                            color: cat.status === 'Exceeded' ? 'var(--color-danger)' : 
                                   cat.status === 'Near Limit' ? 'var(--color-warning)' : 'var(--color-success)'
                          }}>
                            #{idx + 1}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {cat.txCount} transaction{cat.txCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-danger)' }}>
                        -{formatCurrency(cat.actualAmount)}
                      </div>
                      <div className="progress-bar" style={{ height: '4px', width: '80px', marginTop: '4px' }}>
                        <div className="progress-fill" style={{ width: `${Math.min(percent, 100)}%`, background: 'var(--color-danger)' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Income Streams & Sources */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Income Streams</h3>
            <button
              className="btn-secondary btn-sm"
              onClick={() => onOpenAddCategory('income')}
              style={{ fontSize: '12px', padding: '4px 10px' }}
            >
              + Add Stream
            </button>
          </div>

          {sortedIncomeCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
              <p style={{ fontWeight: '500', marginBottom: '4px' }}>No income streams configured</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Add salary, investments, or freelance income to track against your budget.
              </p>
              <button className="btn-primary btn-sm" onClick={() => onOpenAddCategory('income')}>
                + Set Up Income Stream
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sortedIncomeCategories.map((cat) => {
                const streamPercent = cat.allocatedBudget > 0 ? Math.min(Math.round((cat.actualAmount / cat.allocatedBudget) * 100), 100) : 0;
                const isMet = cat.actualAmount >= cat.allocatedBudget && cat.actualAmount > 0;
                return (
                  <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0
                      }}>
                        {cat.icon || '💼'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cat.name}
                          </span>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            background: isMet ? 'var(--color-success-bg)' : 'rgba(99, 102, 241, 0.12)',
                            color: isMet ? 'var(--color-success)' : 'var(--accent-primary)'
                          }}>
                            {isMet ? 'Goal Met' : `${streamPercent}%`}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Target: {formatCurrency(cat.allocatedBudget)} · {cat.txCount} deposit{cat.txCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success)' }}>
                        +{formatCurrency(cat.actualAmount)}
                      </div>
                      <div className="progress-bar" style={{ height: '4px', width: '80px', marginTop: '4px' }}>
                        <div style={{ height: '100%', width: `${streamPercent}%`, background: 'var(--color-success)', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Quick Navigation Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Recent Transactions */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Recent Activity</h3>
          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📝</div>
              <p>No transactions recorded</p>
              <button className="btn-primary btn-sm" onClick={onOpenAddTx} style={{ marginTop: '12px' }}>
                Log First Transaction
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTransactions.map((tx) => {
                const isPositive = Number(tx.amount) > 0;
                return (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        background: isPositive ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0
                      }}>
                        {tx.icon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tx.merchant}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{tx.category}</span>
                          <span>·</span>
                          <span>{tx.date}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: isPositive ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {isPositive ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </div>
                      <div style={{ fontSize: '10px', 
                        color: tx.status === 'Completed' ? 'var(--color-success)' : 'var(--color-warning)',
                        textTransform: 'capitalize'
                      }}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Links Section */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Quick Navigation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <a href="#categories" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'categories' })); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                background: 'var(--bg-card)', 
                borderRadius: '10px', 
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '22px' }}>📂</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Category Tracker</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manage all categories</div>
              </div>
            </a>
            
            <a href="#transactions" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'transactions' })); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                background: 'var(--bg-card)', 
                borderRadius: '10px', 
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '22px' }}>📝</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Transactions</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View full history</div>
              </div>
            </a>
            
            <a href="#budgets" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'budgets' })); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                background: 'var(--bg-card)', 
                borderRadius: '10px', 
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '22px' }}>🎯</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Budgets</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Manage budget limits</div>
              </div>
            </a>
            
            <a href="#dashboard" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' })); }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '16px', 
                background: 'var(--bg-card)', 
                borderRadius: '10px', 
                border: '1px solid var(--border-subtle)',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '22px' }}>📊</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Dashboard</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overview & insights</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}