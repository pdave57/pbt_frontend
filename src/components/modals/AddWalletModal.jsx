import { useState } from 'react';
import { useBudget } from '../../context/useBudget';

export default function AddWalletModal({ isOpen, onClose }) {
  const { addWallet } = useBudget();
  const [name, setName] = useState('');
  const [type, setType] = useState('Checking');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !balance) return;

    setLoading(true);
    await addWallet({
      name,
      type,
      balance: parseFloat(balance),
      accountNumber: accountNumber ? `**** ${accountNumber.slice(-4)}` : undefined,
    });
    setLoading(false);
    onClose();
    setName('');
    setBalance('');
    setAccountNumber('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Wallet / Bank Account</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Account Name</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Wells Fargo Savings, Coinbase ETH"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Account Type</label>
              <select
                className="form-control"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Checking">Checking</option>
                <option value="Savings">Savings</option>
                <option value="Investment">Investment</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Crypto">Crypto Wallet</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="form-group">
              <label>Current Balance ($)</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-control"
                placeholder="1000.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Last 4 Digits of Account / Card (Optional)</label>
            <input
              type="text"
              maxLength={4}
              className="form-control"
              placeholder="e.g. 5821"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

