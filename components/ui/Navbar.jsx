"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession, subscribeSameRoleTabs } from '../../lib/auth';
import { getTheme, toggleTheme } from '../../lib/theme';
import { useAcDevice } from '../../hooks/useAcDevice';
import api from '../../lib/api';

function SunIcon() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export default function Navbar({ onToggleSidebar }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [theme, setThemeState] = useState('light');

  const { deviceId } = useAcDevice();
  const [isOnline, setIsOnline] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s?.user) setUser(s.user);
    setThemeState(getTheme());
  }, []);

  useEffect(() => {
    const refresh = () => {
      const s = getSession();
      setUser(s?.user ?? null);
    };
    window.addEventListener('focus', refresh);
    const unsub = user?.role
      ? subscribeSameRoleTabs(user.role, refresh)
      : () => { };
    return () => {
      window.removeEventListener('focus', refresh);
      unsub();
    };
  }, [user?.role]);

  useEffect(() => {
    if (!deviceId) {
      setIsOnline(false);
      return;
    }

    let cancelled = false;

    const checkStatus = async () => {
      setCheckingStatus(true);
      try {
        const { data } = await api.get(`/api/ac/${deviceId}/status`);
        if (!cancelled) setIsOnline(data.online);
      } catch {
        if (!cancelled) setIsOnline(false);
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deviceId]);

  const handleTheme = () => setThemeState(toggleTheme());

  const roleColor = user?.role === 'ADMIN'
    ? 'bg-[#E8F0FE] text-[#263445] dark:bg-blue-900/40 dark:text-blue-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';

  return (
    <nav className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f1929]/95 backdrop-blur-md border-b border-[var(--color-border)] dark:border-slate-800/80">
      <div className="px-3 sm:px-5">
        <div className="flex h-16 items-center justify-between gap-3">

          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-primary-text)] dark:text-slate-400 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 transition"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-primary-text)] dark:text-white truncate">AC Controller</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto min-w-0">

            {/* Online/Offline Indicator */}
            {deviceId && (
              <div className="flex items-center mr-1">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${isOnline
                    ? 'bg-[#E8F0FE] border-[#D0E0F0] text-[#263445] dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                    : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                    }`}
                  title={isOnline ? 'Device is Online' : 'Device is Offline'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#8BBFD5] animate-pulse' : 'bg-red-500'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            )}

            <button
              onClick={handleTheme}
              aria-label="Toggle theme"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[var(--color-primary-text)] dark:text-slate-300 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {user && <div className="hidden sm:block w-px h-8 bg-[var(--color-border)] dark:bg-slate-700 mx-1" />}

            {/* User Info → links to /profile */}
            {user && (
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 mr-1 rounded-lg px-2 py-1 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 transition"
                title="View profile"
              >
                <div className="text-right leading-tight min-w-0">
                  <div className="text-xs text-[var(--color-secondary-text)] dark:text-slate-400">Welcome back,</div>
                  <div className="text-sm font-semibold text-[#263445] dark:text-white truncate max-w-[160px]">
                    {user.fullName || user.username}
                  </div>
                </div>
                <span className={`badge text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${roleColor}`}>
                  {user.role}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}