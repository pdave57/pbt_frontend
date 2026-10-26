import { useState, useEffect, useCallback } from 'react';
import { api, setStoredToken } from '../api';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [, setToken] = useState(() => localStorage.getItem('pbt_auth_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('pbt_auth_token');
    localStorage.removeItem('pbt_user');
    setError(null);
  }, []);

  // Load user profile on mount if token exists
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('pbt_auth_token');
      const savedUser = localStorage.getItem('pbt_user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore corrupted json
        }
      }

      if (savedToken) {
        try {
          const profile = await api.getCurrentUser();
          if (profile) {
            setUser(profile);
            localStorage.setItem('pbt_user', JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('Could not fetch user profile from backend:', err.message);
          if (err.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    }

    loadUser();
  }, [logout]);

  const login = async (credentials) => {
    setError(null);
    setLoading(true);
    try {
      const response = await api.login(credentials);
      setToken(response.accessToken);
      const userData = response.user || {
        email: credentials.email || credentials.username,
        name: (credentials.email || credentials.username).split('@')[0],
      };
      setUser(userData);
      localStorage.setItem('pbt_user', JSON.stringify(userData));
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
      const response = await api.register(userData);
      if (response?.access_token || response?.token) {
        setToken(response.access_token || response.token);
        setStoredToken(response.access_token || response.token);
      }

      const createdUser = response?.user || {
        email: userData.email,
        name: userData.full_name || userData.email.split('@')[0],
      };
      setUser(createdUser);
      localStorage.setItem('pbt_user', JSON.stringify(createdUser));
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

