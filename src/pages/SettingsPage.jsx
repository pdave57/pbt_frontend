import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { setApiBaseUrl } from '../api';

export default function SettingsPage() {
  const { user, isDemoMode, activateDemoMode, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('pbt_api_base_url') || 'http://localhost:8000');
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(apiUrl);
    setTestStatus({ success: true, message: 'API Base URL saved successfully.' });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/users`, {
        method: 'OPTIONS',
      }).catch(() => null);

      if (res && (res.ok || res.status === 405 || res.status === 401 || res.status === 422)) {
        setTestStatus({
          success: true,
          message: `Backend reachable at ${apiUrl} (Status: ${res.status})`,
        });
      } else {
        const ping = await fetch(apiUrl).catch(() => null);
        if (ping) {
          setTestStatus({
            success: true,
            message: `Server responded at ${apiUrl}`,
          });
        } else {
          setTestStatus({
            success: false,
            message: `Could not connect to ${apiUrl}. Ensure backend server is running and CORS is configured.`,
          });
        }
      }
    } catch (err) {
      setTestStatus({
        success: false,
        message: `Connection failed: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Account & API Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          Configure endpoints, view authenticated session, and manage backend connectivity.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="settings-section">
        <h3>User Profile</h3>
        <p>Your current session information and credentials.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email || 'user@example.com'}</div>
            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px' }}>
              {isDemoMode ? '⚡ Demo Mode Active' : '🟢 Authenticated Session'}
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration Card */}
      <div className="settings-section">
        <h3>Backend API Connection</h3>
        <p>Configure the target backend server for personal budget tracking endpoints.</p>

        <div style={{ background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Configured API Endpoints:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace' }}>
            <div><span style={{ color: '#10B981' }}>POST</span> /api/v1/users (User Registration)</div>
            <div><span style={{ color: '#6366F1' }}>POST</span> /api/v1/user/token (User Login & Token Generation)</div>
            <div><span style={{ color: '#3B82F6' }}>GET</span> /api/v1/users/me (Current User Profile)</div>
            <div><span style={{ color: '#EC4899' }}>GET/POST/PUT/DELETE</span> /api/v1/categories (Category Tracker & Setup)</div>
            <div><span style={{ color: '#A855F7' }}>GET/POST</span> /api/v1/transactions</div>
            <div><span style={{ color: '#F59E0B' }}>GET/POST</span> /api/v1/budgets</div>
            <div><span style={{ color: '#06B6D4' }}>GET/POST</span> /api/v1/wallets</div>
          </div>
        </div>

        <form onSubmit={handleSaveApiUrl}>
          <div className="form-group">
            <label>API Base URL</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="http://localhost:8000"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
              <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                Save URL
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Leave blank or use http://localhost:8000 during local backend development.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? 'Pinging Server...' : 'Test Backend Connection'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={activateDemoMode}
            >
              Switch to Demo Mode
            </button>
          </div>

          {testStatus && (
            <div
              className={`alert-box ${testStatus.success ? 'alert-success' : 'alert-error'}`}
              style={{ marginTop: '16px' }}
            >
              <span>{testStatus.success ? '✓' : '⚠️'}</span>
              <span>{testStatus.message}</span>
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone */}
      <div className="settings-section" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <h3 style={{ color: '#EF4444' }}>Session Management</h3>
        <p>Log out of this browser session or clear stored credentials.</p>
        <button onClick={logout} className="btn-danger">
          Log Out of Personal Budget Tracker
        </button>
      </div>
    </div>
  );
}

