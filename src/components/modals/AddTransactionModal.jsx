import { useMemo, useState } from 'react';
import { useBudget } from '../../context/useBudget';
import ModalShell from '../ModalShell';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  initialCategory = null,
  editingTransaction = null,
}) {
  const { addTransaction, updateTransaction, categories } = useBudget();
  const [type, setType] = useState(editingTransaction?.type || 'expense');
  const [typeChanged, setTypeChanged] = useState(false);
  const [categoryId, setCategoryId] = useState(String(editingTransaction?.category_id || ''));
  const [merchant, setMerchant] = useState(editingTransaction?.merchant || '');
  const [amount, setAmount] = useState(String(Math.abs(editingTransaction?.amount || 0) || ''));
  const [date, setDate] = useState(editingTransaction?.transactionDate?.slice(0, 10) || today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const matchingInitial = categories.find((category) => category.name === initialCategory);
  const effectiveType = matchingInitial && !typeChanged ? matchingInitial.type : type;
  const options = useMemo(
    () => categories.filter((category) => category.type === effectiveType),
    [categories, effectiveType],
  );
  const selectedCategoryId = options.some((category) => String(category.id) === categoryId)
    ? categoryId
    : String((matchingInitial?.type === effectiveType ? matchingInitial.id : options[0]?.id) || '');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        merchant: merchant.trim(),
        category_id: Number(selectedCategoryId),
        type: effectiveType,
        amount: Number(amount),
        transaction_date: date,
      };
      if (editingTransaction) await updateTransaction(editingTransaction.id, payload);
      else await addTransaction(payload);
      setMerchant('');
      setAmount('');
      setDate(today());
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'The transaction could not be saved.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title={editingTransaction ? 'Edit transaction' : 'Add transaction'}
      description={editingTransaction
        ? 'Update the transaction details in your account.'
        : 'Record an income or expense in your account.'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-group">
          <label>Transaction type</label>
          <div className="segmented-control">
            {['income', 'expense'].map((value) => (
              <button
                key={value}
                type="button"
                className={`filter-pill ${effectiveType === value ? 'active' : ''}`}
                onClick={() => {
                  setType(value);
                  setTypeChanged(true);
                  setCategoryId('');
                }}
              >
                {value === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-description">Description</label>
          <input
            id="transaction-description"
            className="form-control"
            type="text"
            autoFocus
            required
            maxLength={160}
            placeholder="e.g. Grocery shop, monthly salary"
            value={merchant}
            onChange={(event) => setMerchant(event.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="transaction-amount">Amount</label>
            <input
              id="transaction-amount"
              className="form-control"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="transaction-category">Category</label>
            <select
              id="transaction-category"
              className="form-control"
              required
              value={selectedCategoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              disabled={!options.length}
            >
              {!options.length && <option value="">Create a {effectiveType} category first</option>}
              {options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="transaction-date">Date</label>
          <input
            id="transaction-date"
            className="form-control"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        {error && <div className="alert-box alert-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !options.length}>
            {loading ? 'Saving…' : editingTransaction ? 'Save changes' : 'Save transaction'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
