import { useState } from 'react';
import { useBudget } from '../../context/useBudget';

export default function AddCategoryModal({ isOpen, onClose, editingCategory = null, initialType = 'expense' }) {
  const { addCategory, updateCategory } = useBudget();
  const [name, setName] = useState(() => editingCategory?.name || '');
  const [type, setType] = useState(() => editingCategory?.type || initialType || 'expense');
  const [allocatedBudget, setAllocatedBudget] = useState(() => String(editingCategory?.allocatedBudget || (initialType === 'income' ? '5000' : '300')));
  const [description, setDescription] = useState(() => editingCategory?.description || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const payload = {
      name: name.trim(),
      type,
      allocatedBudget: parseFloat(allocatedBudget) || 100,
      description: description.trim(),
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
    } else {
      await addCategory(payload);
    }

    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingCategory ? 'Edit Category' : 'Set Up New Category'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Category Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
               <button
                type="button"
                className={`filter-pill ${type === 'income' ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setType('income')}
              >
                💰 Income Category
              </button>
              <button
                type="button"
                className={`filter-pill ${type === 'expense' ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setType('expense')}
              >
                💸 Expense Category
              </button>             
            </div>
          </div>

          <div className="form-group">
            <label>Category Name</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Dining Out, Gym Membership, Crypto Staking"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Monthly Target / Allocated Budget ($)</label>
            <input
              type="number"
              min="1"
              step="1"
              required
              className="form-control"
              placeholder="350"
              value={allocatedBudget}
              onChange={(e) => setAllocatedBudget(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              {type === 'expense'
                ? 'Target maximum spending threshold for this category per month.'
                : 'Target expected inflow from this revenue source per month.'}
            </span>
          </div>

          <div className="form-group">
            <label>Description / Rules (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Only for groceries at Aldi and farmers market"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Save & Track Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}