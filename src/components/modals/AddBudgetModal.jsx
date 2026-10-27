import { useState } from 'react';
import { useBudget } from '../../context/useBudget';
import ModalShell from '../ModalShell';

export default function AddBudgetModal({ isOpen, onClose, editingBudget = null }) {
  const { addBudget, updateBudget, categories } = useBudget();
  const expenseCategories = categories.filter((category) => category.type === 'expense');
  const [categoryId, setCategoryId] = useState(String(editingBudget?.category_id || ''));
  const [amount, setAmount] = useState(String(editingBudget?.total || ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCategoryId = categoryId || String(expenseCategories[0]?.id || '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { amount: Number(amount) });
      } else {
        await addBudget({
          category_id: Number(selectedCategoryId),
          amount: Number(amount),
        });
      }
      setAmount('');
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'The budget could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title={editingBudget ? 'Update budget' : 'Create a budget'}
      description={editingBudget
        ? 'Adjust this category’s spending limit.'
        : 'Choose an expense category and set its spending limit.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-group">
          <label htmlFor="budget-category">Expense category</label>
          <select
            id="budget-category"
            className="form-control"
            required
            value={selectedCategoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={Boolean(editingBudget) || !expenseCategories.length}
          >
            {!expenseCategories.length && <option value="">Create an expense category first</option>}
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="budget-amount">Monthly limit</label>
          <input
            id="budget-amount"
            className="form-control"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="500.00"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        {error && <div className="alert-box alert-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading || (!editingBudget && !expenseCategories.length)}>
            {loading ? 'Saving…' : editingBudget ? 'Save changes' : 'Create budget'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
