import { useState } from 'react';
import { useBudget } from '../../context/useBudget';
import ModalShell from '../ModalShell';

export default function AddWalletModal({ isOpen, onClose }) {
  const { addWallet } = useBudget();
  const [name, setName] = useState('');
  const [type, setType] = useState('Checking');
  const [balance, setBalance] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await addWallet({
        name: name.trim(),
        type,
        balance: Number(balance),
        accountNumber: lastFour ? `•••• ${lastFour}` : '',
      });
      setName('');
      setBalance('');
      setLastFour('');
      onClose();
    } catch (submitError) {
      setError(submitError.message || 'The account could not be saved on this device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="Add a wallet"
      description="Wallets are saved only in this browser and are not synced to the backend."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="modal-body">
        <div className="form-group">
          <label htmlFor="wallet-name">Account name</label>
          <input
            id="wallet-name"
            className="form-control"
            type="text"
            autoFocus
            required
            maxLength={60}
            placeholder="e.g. Everyday account"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="wallet-type">Account type</label>
            <select id="wallet-type" className="form-control" value={type} onChange={(event) => setType(event.target.value)}>
              {['Checking', 'Savings', 'Investment', 'Credit Card', 'Crypto', 'Cash'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="wallet-balance">Balance</label>
            <input
              id="wallet-balance"
              className="form-control"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="wallet-last-four">Last four digits (optional)</label>
          <input
            id="wallet-last-four"
            className="form-control"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="1234"
            value={lastFour}
            onChange={(event) => setLastFour(event.target.value.replace(/\D/g, '').slice(0, 4))}
          />
          <small className="field-note">Do not enter a full account or card number.</small>
        </div>
        {error && <div className="alert-box alert-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save wallet'}</button>
        </div>
      </form>
    </ModalShell>
  );
}
