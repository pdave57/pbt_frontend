import { useState } from 'react';
import { useAuth } from '../context/useAuth';

export default function AuthPage() {
  const { login, register, error, clearError, loading } = useAuth();
  const [mode, setMode] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleTabChange = (newMode) => {
    setMode(newMode);
    clearError();
    setValidationError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    if (!loginEmail || !loginPassword) {
      setValidationError('Please enter both email/username and password.');
      return;
    }

    await login({
      email: loginEmail,
      password: loginPassword,
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!regEmail || !regPassword) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    await register({
      full_name: regFullName,
      name: regFullName,
      email: regEmail,
      password: regPassword,
    });
  };

  const currentError = validationError || error;

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="logo">
            <div className="logo-icon">P</div>
            <span>Personal Budget Tracker</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {mode === 'login'
              ? 'Sign in to access your personal budget and analytics'
              : 'Start tracking your spending and growing your savings'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {currentError && (
          <div className="alert-box alert-error">
            <span>⚠️</span>
            <span>{currentError}</span>
          </div>
        )}

        {/* Login Form (POST /api/v1/auth/login) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                required
                autoComplete="username"
                className="form-control"
                placeholder="name@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="form-control"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>            

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '16px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register Form (POST /api/v1/auth/register) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Alex Johnson"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="form-control"
                placeholder="name@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="form-control"
                placeholder="At least 6 characters"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="form-control"
                placeholder="Re-enter password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
              />
            </div>            

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', marginBottom: '16px' }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        
      </div>
    </div>
  );
}
