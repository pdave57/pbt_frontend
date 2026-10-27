import { useState } from 'react';
import { api, setApiBaseUrl } from '../api';
import { useAuth } from '../context/useAuth';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('pbt_api_base_url') || '');
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSaveApiUrl = (event) => {
    event.preventDefault();
    setApiBaseUrl(apiUrl);
    setTestStatus({ success: true, message: 'Backend URL saved.' });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const result = await api.checkHealth();
      setTestStatus({
        success: true,
        message: `Backend health check succeeded${result?.status ? ` (${result.status})` : ''}.`,
      });
    } catch (error) {
      setTestStatus({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page-stack settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Preferences and access</p>
          <h1>Settings</h1>
          <p>Manage your session and backend connection.</p>
        </div>
      </div>

      <section className="card settings-section">
        <div className="section-heading">
          <div>
            <h2>Account</h2>
            <p>Your current signed-in profile.</p>
          </div>
        </div>
        <div className="settings-user">
          <div className="user-avatar">{(user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase()}</div>
          <div>
            <strong>{user?.full_name || user?.name || 'Personal account'}</strong>
            <span>{user?.email || 'Signed in'}</span>
          </div>
        </div>
      </section>

      <section className="card settings-section">
        <div className="section-heading">
          <div>
            <h2>Backend connection</h2>
            <p>Uses the Personal Budget Tracker API and its OpenAPI-defined routes.</p>
          </div>
        </div>
        <div className="endpoint-list">
          <span>POST /api/v1/auth/register · POST /api/v1/auth/login</span>
          <span>GET/POST/PUT/DELETE /api/v1/categories</span>
          <span>GET/POST/PUT/DELETE /api/v1/transactions</span>
          <span>GET/POST/PUT/DELETE /api/v1/budgets</span>
          <span>GET /api/v1/reports/* · GET /api/v1/ml/*</span>
          <span>Wallets are stored locally in this browser.</span>
        </div>
        <form onSubmit={handleSaveApiUrl}>
          <div className="form-group">
            <label htmlFor="api-base-url">API base URL override</label>
            <input
              id="api-base-url"
              type="url"
              className="form-control"
              placeholder="Leave blank to use the Vite backend proxy"
              value={apiUrl}
              onChange={(event) => setApiUrl(event.target.value)}
            />
            <small className="field-note">
              The development proxy targets http://127.0.0.1:8000. Set an override only when your backend runs elsewhere.
            </small>
          </div>
          <div className="settings-actions">
            <button type="submit" className="btn-secondary">Save URL</button>
            <button type="button" className="btn-primary" onClick={handleTestConnection} disabled={testing}>
              {testing ? 'Checking…' : 'Test connection'}
            </button>
          </div>
          {testStatus && (
            <div className={`alert-box ${testStatus.success ? 'alert-success' : 'alert-error'}`} role="status">
              {testStatus.message}
            </div>
          )}
        </form>
      </section>

      <section className="card settings-section danger-zone">
        <div>
          <h2>Session</h2>
          <p>Sign out and remove the saved access token from this browser.</p>
        </div>
        <button type="button" onClick={logout} className="btn-danger">Sign out</button>
      </section>
    </div>
  );
}
