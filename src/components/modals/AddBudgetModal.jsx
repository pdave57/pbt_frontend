import { useState } from 'react';
import { useBudget } from '../../context/useBudget';

export default function AddBudgetModal({ isOpen, onClose }) {
  const { addBudget } = useBudget();
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [total, setTotal] = useState('');
  const [spent, setSpent] = useState('0');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const iconOptions = ['🛒', '🎬', '🚗', '💡', '🍔', '✈️', '💻', '🏋️', '📚', '🎯'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !total) return;

    setLoading(true);
    await addBudget({
      category,
      icon,
      spent: parseFloat(spent) || 0,
      total: parseFloat(total),
    });
    setLoading(false);
    onClose();
    setCategory('');
    setTotal('');
    setSpent('0');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Monthly Budget</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Dining Out, Travel, Gym"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Select Category Icon</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {iconOptions.map((ico) => (
                <button
                  key={ico}
                  type="button"
                  onClick={() => setIcon(ico)}
                  style={{
                    background: icon === ico ? 'var(--accent-primary)' : 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                >
                  {ico}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Monthly Limit ($)</label>
              <input
                type="number"
                step="1"
                min="1"
                required
                className="form-control"
                placeholder="500"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Already Spent ($)</label>
              <input
                type="number"
                step="1"
                min="0"
                className="form-control"
                placeholder="0"
                value={spent}
                onChange={(e) => setSpent(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

