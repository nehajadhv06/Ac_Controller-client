"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { setSession } from '../../lib/auth';
import AuthLayout from '../../components/auth/AuthLayout';

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 0 1 2.145-3.668M6.33 6.33A9.97 9.97 0 0 1 12 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 0 1-4.412 5.166M10 14a2 2 0 1 0 4 0 2 2 0 0 0-4 0M3 3l18 18" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ usernameOrEmail: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', formData);
      setSession(data);
      router.push(data.user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#8BBFD5] dark:text-[#8BBFD5] tracking-tight">
          Login
        </h1>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 p-3.5 rounded-lg mb-5 text-sm">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">
            Username
          </label>
          <input
            type="text"
            name="usernameOrEmail"
            value={formData.usernameOrEmail}
            onChange={handleChange}
            required
            placeholder="Enter your username"
            className="input-field"
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="input-field pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] dark:hover:text-slate-200 transition"
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
          <div className="flex justify-end mt-2">
            <Link href="/forgot-password" className="text-xs text-[#8BBFD5] dark:text-[#8BBFD5] hover:underline font-medium">
              forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base mt-2"
        >
          {loading ? (
            <><span className="spinner w-4 h-4" /> Signing in…</>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--color-secondary-text)] dark:text-slate-400">
        Don&apos;t have any account?{' '}
        <Link href="/register" className="text-[#8BBFD5] dark:text-[#8BBFD5] font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}