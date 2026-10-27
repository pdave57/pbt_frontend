import { useBudget } from '../context/useBudget';
import { formatCurrency } from '../utils/currency';

export default function WalletsPage({ onOpenAddWallet }) {
  const { wallets } = useBudget();

  const totalAssets = wallets.reduce((acc, w) => acc + Number(w.balance || 0), 0);

  return (
    <div className="page-stack">
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Wallets & Accounts</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Manage bank accounts, debit cards, investment portfolios, and digital wallets.
          </p>
        </div>
        <button className="btn-primary" onClick={onOpenAddWallet}>
          + Add Account
        </button>
      </div>

      {/* Total Assets Summary */}
      <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Combined Liquidity</div>
          <div style={{ fontSize: '28px', fontWeight: '800', marginTop: '4px', color: 'var(--text-primary)' }}>
            {formatCurrency(totalAssets)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Connected Accounts</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{wallets.length} Active</div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="wallets-grid">
        {wallets.map((w) => (
          <div
            key={w.id}
            className="wallet-card"
            style={{
              background: w.gradient || 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            }}
          >
            <div className="wallet-header">
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>{w.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {w.type}
                </div>
              </div>
              <div className="wallet-chip"></div>
            </div>

            <div style={{ margin: '20px 0' }}>
              <div className="wallet-balance-label">Current Balance</div>
              <div className="wallet-balance-value">{formatCurrency(w.balance)}</div>
            </div>

            <div className="wallet-footer">
              <span style={{ letterSpacing: '2px', fontFamily: 'monospace' }}>
                {w.accountNumber || '•••• •••• •••• 4029'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>ACTIVE</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
