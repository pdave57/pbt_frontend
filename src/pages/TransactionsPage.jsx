import { useState } from 'react';
import { useBudget } from '../context/useBudget';
import { formatCurrency } from '../utils/currency';

export default function TransactionsPage({ onOpenAddTx, onEditTransaction }) {
  const { transactions, deleteTransaction, searchQuery, setSearchQuery } = useBudget();
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  const filtered = transactions.filter((t) => {
    if (typeFilter === 'EXPENSES' && Number(t.amount) >= 0) return false;
    if (typeFilter === 'INCOME' && Number(t.amount) < 0) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    return true;
  });

  const totalInflow = filtered
    .filter((t) => Number(t.amount) > 0)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOutflow = filtered
    .filter((t) => Number(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  const handleDelete = async (transaction) => {
    if (!window.confirm(`Delete the transaction “${transaction.merchant}”?`)) return;
    setActionError('');
    setDeletingId(transaction.id);
    try {
      await deleteTransaction(transaction.id);
    } catch (error) {
      setActionError(error.message || 'The transaction could not be deleted.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-stack">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Transactions History</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Track, filter, and audit every inflow and outflow.
          </p>
        </div>
        <button className="btn-primary" onClick={onOpenAddTx}>
          + Add Transaction
        </button>
      </div>

      {actionError && <div className="alert-box alert-error" role="alert">{actionError}</div>}

      {/* Summary Mini Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Filtered Inflow</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>
            +{formatCurrency(totalInflow)}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Filtered Outflow</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-danger)' }}>
            -{formatCurrency(totalOutflow)}
          </div>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Net Movement</div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: totalInflow - totalOutflow >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {formatCurrency(totalInflow - totalOutflow)}
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            <button
              className={`filter-pill ${typeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTypeFilter('ALL')}
            >
              All Types
            </button>
            <button
              className={`filter-pill ${typeFilter === 'EXPENSES' ? 'active' : ''}`}
              onClick={() => setTypeFilter('EXPENSES')}
            >
              Expenses Only
            </button>
            <button
              className={`filter-pill ${typeFilter === 'INCOME' ? 'active' : ''}`}
              onClick={() => setTypeFilter('INCOME')}
            >
              Income Only
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {searchQuery && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                Clear Search &quot;{searchQuery}&quot;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <p>No transactions matching the selected criteria.</p>
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
                  <th style={{ textAlign: 'right', width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
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
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="btn-secondary btn-sm"
                            title="Edit transaction"
                          >
                            Edit
                          </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx)}
                          className="btn-danger btn-sm"
                          title="Delete transaction"
                          disabled={deletingId === tx.id}
                        >
                          {deletingId === tx.id ? 'Deleting…' : 'Delete'}
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
