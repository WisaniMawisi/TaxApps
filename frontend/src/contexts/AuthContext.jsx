import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { formatApiError } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anon, object = logged in
  const [error, setError] = useState('');

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);  // ← was: setUser(data)
      return true;
    } catch (e) {
      setError(formatApiError(e?.data?.detail) || e?.message || 'Login failed');
      return false;
    }
  };

  const register = async (payload) => {
    setError('');
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setUser(data.user);  // ← was: setUser(data)
      return true;
    } catch (e) {
      setError(formatApiError(e?.data?.detail) || e?.message || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, error, setError, login, register, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);