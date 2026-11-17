"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSession, clearSession, subscribeSameRoleTabs } from '../../lib/auth';
import Image from 'next/image';

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
function DashboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function LiveMonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
function FaultsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function SetpointsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function AnalyticsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  );
}
function UsersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function DevicesIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M7 10h2M11 10h2M15 10h2M7 13h2M11 13h2M15 13h2" />
    </svg>
  );
}
function AssignmentIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function ChevronRightIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
function CloseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
    </svg>
  );
}

/* ── Nav Link helpers ──────────────────────────────────────────────────── */
function NavLink({ href, icon: Icon, label, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative min-h-[44px]
        ${active
          ? 'bg-[#8BBFD5] text-white shadow-md shadow-[#8BBFD5]/30'
          : 'text-[var(--color-primary-text)] dark:text-slate-400 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 hover:text-[#263445] dark:hover:text-slate-100'
        }`}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/80 rounded-r-full -ml-px" />}
      <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:scale-110 ${active ? 'text-white' : ''}`} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SubNavLink({ href, icon: Icon, label, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 min-h-[40px]
        ${active
          ? 'bg-[#E8F0FE] dark:bg-blue-900/25 text-[#263445] dark:text-blue-300 font-semibold'
          : 'text-[var(--color-primary-text)] dark:text-slate-400 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 hover:text-[#263445] dark:hover:text-slate-100'
        }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#8BBFD5] dark:text-blue-400' : ''}`} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/* ── Main Component ────────────────────────────────────────────────────── */
export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [umOpen, setUmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s?.user) setUser(s.user);
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/logout`,
        { method: 'POST', credentials: 'omit' }
      );
    } catch (_) { }
    clearSession();
    router.push('/login');
  };

  useEffect(() => {
    if (
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/devices') ||
      pathname.startsWith('/admin/assignments')
    ) {
      setUmOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');
  const dashboardHref = '/dashboard';
  const isUmActive =
    isActive('/admin/users') ||
    isActive('/admin/devices') ||
    isActive('/admin/assignments');

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] max-w-[88vw]
          flex flex-col
          bg-white dark:bg-[#0f1929]
          border-r border-[var(--color-border)] dark:border-slate-800/80
          transform transition-transform duration-300 ease-in-out
          md:sticky md:top-0 md:translate-x-0 md:h-screen md:w-64 md:z-0
          ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
        aria-label="Sidebar navigation"
      >
        {/* ── Logo Header ─────────────────────────────────────────────── */}
        <div className="h-16 flex items-center justify-between gap-2 px-4 border-b border-[var(--color-border)] dark:border-slate-800/80 shrink-0">
          <Link href={dashboardHref} className="flex items-center gap-2.5 min-w-0 group" onClick={onClose}>
            <Image
              src="/images/logo.png"
              alt="AC Controller Logo"
              width={60}
              height={60}
              className="object-contain dark:invert dark:brightness-0"
              priority
            />
            <div className="min-w-0">
              <div className="text-[23px] font-bold text-[var(--color-primary-text)] dark:text-white truncate leading-tight">
                AC Controller
              </div>
              <div className="text-[12px] text-[var(--color-secondary-text)] dark:text-slate-500 leading-tight">
                Smart Monitor Control
              </div>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-secondary-text)] hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 transition shrink-0 active:scale-95"
            aria-label="Close menu"
          >
            <CloseIcon className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Main navigation">

          <div className="mb-1">
            <p className="section-title px-3 mb-1.5">Workspace</p>

            <NavLink href="/dashboard" icon={DashboardIcon} label="Dashboard" active={isActive('/dashboard')} onClick={onClose} />
            <NavLink href="/live-monitoring" icon={LiveMonIcon} label="Live Monitoring" active={isActive('/live-monitoring')} onClick={onClose} />
            <NavLink href="/faults" icon={FaultsIcon} label="Faults" active={isActive('/faults')} onClick={onClose} />
            <NavLink href="/setpoints" icon={SetpointsIcon} label="Setpoints" active={isActive('/setpoints')} onClick={onClose} />
            <NavLink href="/analytics" icon={AnalyticsIcon} label="Analytics" active={isActive('/analytics')} onClick={onClose} />
          </div>

          {/* Admin Only Section */}
          {user?.role === 'ADMIN' && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] dark:border-slate-800">
              <p className="section-title px-3 mb-1.5">Management</p>

              <button
                onClick={() => setUmOpen((o) => !o)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-[44px]
                  ${isUmActive || umOpen
                    ? 'text-[#263445] dark:text-slate-100 bg-[var(--color-light-blue-bg)] dark:bg-slate-800/60'
                    : 'text-[var(--color-primary-text)] dark:text-slate-400 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 hover:text-[#263445] dark:hover:text-slate-100'
                  }`}
                aria-expanded={umOpen}
              >
                <span className="flex items-center gap-3">
                  <UsersIcon className="w-[18px] h-[18px] shrink-0" />
                  <span>Admin Controls</span>
                </span>
                <ChevronRightIcon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${umOpen ? 'rotate-90' : ''}`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${umOpen ? 'max-h-52 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}
              >
                <div className="ml-4 pl-3 border-l-2 border-[#8BBFD5]/40 dark:border-blue-900/50 space-y-0.5 py-1">
                  <SubNavLink href="/admin/users" icon={UsersIcon} label="Users" active={isActive('/admin/users')} onClick={onClose} />
                  <SubNavLink href="/admin/devices" icon={DevicesIcon} label="Devices" active={isActive('/admin/devices')} onClick={onClose} />
                  <SubNavLink href="/admin/assignments" icon={AssignmentIcon} label="Assignments" active={isActive('/admin/assignments')} onClick={onClose} />
                </div>
              </div>
            </div>
          )}

          {/* My Devices */}
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] dark:border-slate-800">
            <p className="section-title px-3 mb-1.5">My Devices</p>
            <NavLink
              href="/user/devices"
              icon={DevicesIcon}
              label="My Devices"
              active={isActive('/user/devices')}
              onClick={onClose}
            />
          </div>

          {/* Account */}
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] dark:border-slate-800">
            <p className="section-title px-3 mb-1.5">Account</p>
            <NavLink
              href="/profile"
              icon={UserIcon}
              label="My Profile"
              active={isActive('/profile')}
              onClick={onClose}
            />
          </div>

        </nav>

        {/* ── User Footer ─────────────────────────────────────────────── */}
        {user && (
          <div className="shrink-0 border-t border-[var(--color-border)] dark:border-slate-800/80 p-3 space-y-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 transition"
            >
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8BBFD5] to-[#78AEC6] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm overflow-hidden">
  {typeof window !== 'undefined' && localStorage.getItem('profileImage') ? (
    <img src={localStorage.getItem('profileImage')} alt="User" className="w-full h-full object-cover" />
  ) : (
    (user.fullName || user.username || '?').charAt(0).toUpperCase()
  )}
</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#263445] dark:text-slate-200 truncate">
                  {user.fullName || user.username}
                </div>
                <div className="text-[10px] text-[var(--color-secondary-text)] dark:text-slate-500 truncate capitalize">
                  {user.role?.toLowerCase()}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                         bg-red-50 dark:bg-red-900/20
                         text-red-600 dark:text-red-400
                         border border-red-200 dark:border-red-800/50
                         hover:bg-red-100 dark:hover:bg-red-900/30
                         text-xs font-semibold transition disabled:opacity-60 min-h-[40px]
                         active:scale-[0.98]"
              aria-label="Logout"
            >
              <LogoutIcon />
              <span>{loggingOut ? 'Logging out…' : 'Sign Out'}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}