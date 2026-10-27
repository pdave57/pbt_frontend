import { useState, useCallback } from 'react';
import { api } from '../api';
import { AuthContext } from './authContextDef';

function getSavedUser() {
  if (typeof window === 'undefined') return null;
  try {
    if (!localStorage.getItem('pbt_auth_token')) return null;
    return JSON.parse(localStorage.getItem('pbt_user') || 'null') || {
      email: '',
      full_name: 'Personal account',
    };
  } catch (cause) {
    console.warn('Saved account details could not be read.', cause);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    localStorage.removeItem('pbt_user');
    setError(null);
  }, []);

  const saveUser = (userData) => {
    setUser(userData);
    localStorage.setItem('pbt_user', JSON.stringify(userData));
  };

  const login = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.login(credentials);
      const email = credentials.email.trim();
      const userData = {
        email,
        full_name: email.split('@')[0],
        name: email.split('@')[0],
      };
      saveUser(userData);
      return { success: true, data: response };
    } catch (err) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError(null);
    setLoading(true);
    try {
      await api.register(userData);
      const response = await api.login({
        email: userData.email,
        password: userData.password,
      });
      const displayName = userData.full_name?.trim() || userData.email.split('@')[0];
      saveUser({
        email: userData.email.trim(),
        full_name: displayName,
        name: displayName,
      });
      return { success: true, data: response };
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
