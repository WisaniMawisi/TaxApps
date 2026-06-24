// api.js - replace your current file with this

import axios from 'axios';

const rawBackend = import.meta.env.VITE_BACKEND_URL || '';
const BACKEND_URL = rawBackend.replace(/\/+$/, '');
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  // withCredentials no longer needed
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error?.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        const { data } = await axios.post(`${API}/auth/refresh`, { refresh_token: refresh });
        localStorage.setItem('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject({ message: 'Session expired', status: 401, data: null });
      }
    }

    const normalized = {
      message: error.message || 'Network Error',
      status: error?.response?.status ?? null,
      data: error?.response?.data ?? null,
    };
    return Promise.reject(normalized);
  }
);

export function formatApiError(detail) {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        if (!e) return '';
        if (typeof e === 'string') return e;
        if (typeof e.msg === 'string') return e.msg;
        if (typeof e.message === 'string') return e.message;
        return JSON.stringify(e);
      })
      .filter(Boolean)
      .join(' ');
  }
  if (typeof detail === 'object') {
    if (typeof detail.msg === 'string') return detail.msg;
    if (typeof detail.message === 'string') return detail.message;
    if (Array.isArray(detail.errors)) return formatApiError(detail.errors);
    if (detail.detail) return formatApiError(detail.detail);
    return JSON.stringify(detail);
  }
  return String(detail);
}

export default api;