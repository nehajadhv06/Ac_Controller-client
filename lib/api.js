import axios from 'axios';
import { getSession, clearSession } from '../lib/auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
  // Never send the shared browser cookie — auth is header-only.
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  // getSession() reads THIS tab's sessionStorage only.
  const session = getSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err.response?.status;

    // 401 = token missing/invalid/expired → log out THIS tab only.
    // 403 = authenticated but wrong role → do NOT clear session;
    //       ProtectedRoute / the page will handle the redirect.
    if (status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const isPublic =
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/forgot-password') ||
        path.startsWith('/reset-password');

      if (!isPublic) {
        clearSession();
        window.location.replace('/login');
      }
    }
    return Promise.reject(err);
  }
);

export default api;