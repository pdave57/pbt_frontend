import { useState } from 'react';
import { useAuth } from '../context/useAuth';

export default function AuthPage() {
  const { login, register, forgotPassword, resetPassword, error, clearError, loading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password form state
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'reset' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  const [validationError, setValidationError] = useState('');

  const handleTabChange = (newMode) => {
    setMode(newMode);
    clearError();
    setValidationError('');
    setForgotInfo('');
    setForgotSuccessMsg('');
    if (newMode === 'forgot' && !forgotEmail && loginEmail) {
      setForgotEmail(loginEmail);
    }
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

  const handleForgotRequestSubmit = async (e) => {
    e?.preventDefault?.();
    setValidationError('');
    setForgotInfo('');

    if (!forgotEmail?.trim()) {
      setValidationError('Please enter your email address.');
      return;
    }

    const result = await forgotPassword(forgotEmail);
    if (result.success) {
      const previewNotice = result.data?.previewCode
        ? ` (Demo verification code: ${result.data.previewCode})`
        : '';
      setForgotInfo(
        (result.data?.message || 'Password reset instructions have been sent.') + previewNotice,
      );
      if (result.data?.previewCode) {
        setResetCode(result.data.previewCode);
      }
      setForgotStep('reset');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!resetCode.trim()) {
      setValidationError('Please enter the reset code sent to your email.');
      return;
    }

    if (!resetNewPassword) {
      setValidationError('Please enter a new password.');
      return;
    }

    if (resetNewPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const result = await resetPassword({
      email: forgotEmail,
      token: resetCode,
      newPassword: resetNewPassword,
    });

    if (result.success) {
      setForgotSuccessMsg(
        result.data?.message || 'Your password has been successfully reset. You can now sign in.',
      );
      setForgotStep('success');
      setLoginEmail(forgotEmail);
      setLoginPassword('');
    }
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
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'forgot' &&
              (forgotStep === 'success' ? 'Password Reset Complete' : 'Reset Password')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            {mode === 'login' && 'Sign in to access your personal budget and analytics'}
            {mode === 'register' && 'Start tracking your spending and growing your savings'}
            {mode === 'forgot' &&
              (forgotStep === 'request'
                ? 'Enter your account email to receive a password reset code'
                : forgotStep === 'reset'
                  ? 'Enter the verification code and choose a new password'
                  : 'You can now sign in to your account with your new password')}
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
          {mode === 'forgot' && (
            <button
              type="button"
              className="auth-tab active"
              onClick={() => handleTabChange('forgot')}
            >
              Reset Password
            </button>
          )}
        </div>

        {/* Error Alert */}
        {currentError && (
          <div className="alert-box alert-error">
            <span>⚠️</span>
            <span>{currentError}</span>
          </div>
        )}

        {/* Informational Alert for Forgot Flow */}
        {mode === 'forgot' && forgotInfo && (
          <div className="alert-box alert-info">
            <span>ℹ️</span>
            <span>{forgotInfo}</span>
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
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (loginEmail) setForgotEmail(loginEmail);
                  handleTabChange('forgot');
                  setForgotStep('request');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
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
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                marginBottom: '16px',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Forgot Password Flow */}
        {mode === 'forgot' && (
          <div>
            {forgotStep === 'request' && (
              <form onSubmit={handleForgotRequestSubmit}>
                <div className="form-group">
                  <label>Email address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  <small
                    style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '11px',
                      marginTop: '6px',
                    }}
                  >
                    Enter the email associated with your account to receive a reset code.
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? 'Sending Request...' : 'Send Reset Instructions'}
                </button>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    textAlign: 'center',
                    fontSize: '13px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      setValidationError('');
                      setForgotStep('reset');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Already have a reset code? Enter code
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPasswordSubmit}>
                <div
                  style={{
                    background: 'var(--bg-base)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Resetting: <strong style={{ color: 'var(--text-primary)' }}>{forgotEmail || 'Account'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    Change
                  </button>
                </div>

                <div className="form-group">
                  <label>Verification / Reset Code</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Enter reset code (e.g. 123456)"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className="form-control"
                    placeholder="Re-enter new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    marginBottom: '16px',
                  }}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    textAlign: 'center',
                    fontSize: '13px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleForgotRequestSubmit()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Didn&apos;t get the code? Resend
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'success' && (
              <div>
                <div
                  className="alert-box alert-success"
                  style={{ marginBottom: '20px', flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    <span>✓</span>
                    <span>Password Reset Successful</span>
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.9 }}>
                    {forgotSuccessMsg}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    handleTabChange('login');
                    setForgotStep('request');
                  }}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                  }}
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
