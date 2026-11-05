import { useState } from 'react';
import { api, setApiBaseUrl } from '../api';
import { useAuth } from '../context/useAuth';

export default function SettingsPage() {
  const { user, logout, changePassword } = useAuth();
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('pbt_api_base_url') || '');
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

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

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ success: false, message: 'Please enter your current password.' });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changePassword({ currentPassword, newPassword });
      if (result.success) {
        setPasswordStatus({
          success: true,
          message: result.data?.message || 'Password changed successfully.',
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatus({
          success: false,
          message: result.error || 'Failed to change password.',
        });
      }
    } catch (err) {
      setPasswordStatus({
        success: false,
        message: err.message || 'An error occurred while changing your password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="page-stack settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Preferences and access</p>
          <h1>Settings</h1>
          <p>Manage your session, security credentials, and backend connection.</p>
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
          <div className="user-avatar">
            {(user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <strong>{user?.full_name || user?.name || 'Personal account'}</strong>
            <span>{user?.email || 'Signed in'}</span>
          </div>
        </div>
      </section>

      <section className="card settings-section">
        <div className="section-heading">
          <div>
            <h2>Change Password</h2>
            <p>Update your account password for enhanced security.</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              required
              autoComplete="current-password"
              className="form-control"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="form-control"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                id="confirm-new-password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating Password…' : 'Update Password'}
            </button>
          </div>

          {passwordStatus && (
            <div
              className={`alert-box ${passwordStatus.success ? 'alert-success' : 'alert-error'}`}
              role="status"
            >
              <span>{passwordStatus.success ? '✓' : '⚠️'}</span>
              <span>{passwordStatus.message}</span>
            </div>
          )}
        </form>
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
          <span>POST /api/v1/auth/forgot-password · POST /api/v1/auth/reset-password · POST /api/v1/auth/change-password</span>
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
              Leave blank to use the configured backend. Set an override only when your backend runs elsewhere.
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
