import { useState } from 'react';
import { useBudget } from '../../context';

const getInitialDate = () => new Date().toISOString().split('T')[0];

export default function AddTransactionModal({ isOpen, onClose, initialCategory = null }) {
  const { addTransaction, categories } = useBudget();
  const [formData, setFormData] = useState(() => {
    const defaultCategory = initialCategory || (categories?.[0]?.name ?? 'Groceries');
    const matchingCat = categories?.find((c) => c.name === defaultCategory);
    return {
      merchant: '',
      category: defaultCategory,
      type: matchingCat?.type || 'expense',
      amount: '',
      date: getInitialDate(),
      status: 'Completed',
    };
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Derive categories list from Context or fallback
  const categoryOptions = categories && categories.length > 0
    ? categories.map((c) => ({ label: c.name, icon: c.icon, type: c.type }))
    : [
        { label: 'Groceries', icon: '🛒', type: 'expense' },
        { label: 'Subscriptions', icon: '🎧', type: 'expense' },
        { label: 'Income', icon: '💼', type: 'income' },
        { label: 'Transport', icon: '🚗', type: 'expense' },
        { label: 'Food & Drink', icon: '☕', type: 'expense' },
        { label: 'Utilities', icon: '💡', type: 'expense' },
        { label: 'Entertainment', icon: '🎬', type: 'expense' },
      ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.merchant || !formData.amount) return;

    setLoading(true);
    const selectedCategory = categoryOptions.find((c) => c.label === formData.category);
    const numericAmount = Math.abs(parseFloat(formData.amount));
    const finalAmount = formData.type === 'expense' ? -numericAmount : numericAmount;

    const parsedDate = new Date(formData.date);
    const formattedDate = parsedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    await addTransaction({
      merchant: formData.merchant,
      category: formData.category,
      icon: selectedCategory ? selectedCategory.icon : '💳',
      amount: finalAmount,
      date: formattedDate,
      status: formData.status,
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Transaction</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Transaction Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`filter-pill ${formData.type === 'expense' ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
              >
                💸 Expense
              </button>
              <button
                type="button"
                className={`filter-pill ${formData.type === 'income' ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: 'income',
                    category: 'Income',
                  })
                }
              >
                💰 Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Merchant / Description</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Starbucks, Acme Salary, Netflix"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="form-control"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  const found = categoryOptions.find((c) => c.label === val);
                  setFormData({
                    ...formData,
                    category: val,
                    type: found?.type || formData.type,
                  });
                }}
              >
                {categoryOptions.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.icon} {c.label} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                required
                className="form-control"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
