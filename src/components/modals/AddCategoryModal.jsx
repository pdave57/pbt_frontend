import { useState } from 'react';
import { useBudget } from '../../context/useBudget';
import ModalShell from '../ModalShell';

const icons = ['🏷️', '🛒', '🍽️', '🚗', '🏠', '💡', '🎬', '✈️', '💼', '💰', '🎓', '❤️'];

export default function AddCategoryModal({
  isOpen,
  onClose,
  editingCategory = null,
  initialType = 'expense',
}) {
  const { addCategory, updateCategory } = useBudget();
  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState(editingCategory?.type || initialType);
  const [allocatedBudget, setAllocatedBudget] = useState(
    String(editingCategory?.allocatedBudget || ''),
  );
  const [icon, setIcon] = useState(editingCategory?.icon || '🏷️');
  const [description, setDescription] = useState(editingCategory?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const category = {
      name: name.trim(),
      type,
      allocatedBudget: Number(allocatedBudget) || 0,
      icon,
      description: description.trim(),
    };
    try {
      if (editingCategory) await updateCategory(editingCategory.id, category);
      else await addCategory(category);
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'The category could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title={editingCategory ? 'Edit category' : 'Create a category'}
      description="Categories help organize transactions and keep reports meaningful."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-group">
          <label>Category type</label>
          <div className="segmented-control">
            {['expense', 'income'].map((value) => (
              <button
                type="button"
                key={value}
                className={`filter-pill ${type === value ? 'active' : ''}`}
                onClick={() => setType(value)}
              >
                {value === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="category-name">Name</label>
          <input
            id="category-name"
            className="form-control"
            type="text"
            autoFocus
            required
            maxLength={60}
            placeholder={type === 'expense' ? 'e.g. Groceries' : 'e.g. Salary'}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Icon</label>
          <div className="icon-picker" role="group" aria-label="Choose a category icon">
            {icons.map((option) => (
              <button
                type="button"
                key={option}
                className={`icon-picker-option ${icon === option ? 'selected' : ''}`}
                aria-pressed={icon === option}
                onClick={() => setIcon(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="category-target">Monthly target (optional)</label>
          <input
            id="category-target"
            className="form-control"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={allocatedBudget}
            onChange={(event) => setAllocatedBudget(event.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="category-description">Description (optional)</label>
          <input
            id="category-description"
            className="form-control"
            type="text"
            maxLength={160}
            placeholder="Add a note about this category"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        {error && <div className="alert-box alert-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving…' : editingCategory ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
