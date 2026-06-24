import axios from 'axios';

const rawBackend = import.meta.env.VITE_BACKEND_URL || '';
// remove trailing slash if present
const BACKEND_URL = rawBackend.replace(/\/+$/, '');
export const API = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s sensible default
});

// Response interceptor to normalize errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize axios error shape so callers can rely on a consistent format
    const normalized = {
      message: error.message || 'Network Error',
      status: error?.response?.status ?? null,
      data: error?.response?.data ?? null,
    };
    return Promise.reject(normalized);
  }
);

/**
 * formatApiError
 * - Accepts server error detail in multiple shapes and returns a readable string.
 * - Handles null, string, array of validation errors, and objects with msg or message.
 */
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
    // common nested shapes: { errors: [...] } or { detail: ... }
    if (Array.isArray(detail.errors)) return formatApiError(detail.errors);
    if (detail.detail) return formatApiError(detail.detail);
    return JSON.stringify(detail);
  }
  return String(detail);
}

export default api;
