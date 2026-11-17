"use client";
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import DashboardLayout from '../../../components/ui/DashboardLayout';
import api from '../../../lib/api';
import { getSession } from '../../../lib/auth';

function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function DevicesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M7 10h2M11 10h2M15 10h2" />
    </svg>
  );
}
function AssignIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
function ActiveIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function DashStatCard({ label, value, icon: Icon, color, note }) {
  const colors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', val: 'text-blue-700 dark:text-blue-300', bar: 'bg-[#8BBFD5]' },
    green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', val: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-500' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400', val: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="card p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${c.bar} rounded-l-xl`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] dark:text-slate-400 mb-1.5 truncate">
            {label}
          </p>
          <p className={`text-2xl sm:text-3xl font-bold ${c.val}`}>
            {value ?? <span className="inline-block w-8 h-7 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />}
          </p>
          {note && <p className="text-[10px] sm:text-xs text-[var(--color-secondary-text)] dark:text-slate-500 mt-1 truncate">{note}</p>}
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
          <div className={c.icon}><Icon /></div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, desc, color }) {
  const colors = {
    blue: 'from-[#8BBFD5] to-[#78AEC6] shadow-[#8BBFD5]/25',
    green: 'from-emerald-500 to-green-700 shadow-emerald-500/25',
    purple: 'from-purple-600 to-purple-800 shadow-purple-500/25',
  };
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl
                  bg-gradient-to-r ${colors[color] || colors.blue}
                  text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5
                  transition-all duration-200 min-h-[72px]`}
    >
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
        <Icon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-xs text-white/70 truncate">{desc}</div>
      </div>
      <ArrowRightIcon />
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = getSession();
    if (session?.user) setUser(session.user);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [usersRes, devicesRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/devices'),
      ]);
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const devices = Array.isArray(devicesRes.data) ? devicesRes.data : [];
      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.enabled).length,
        totalDevices: devices.length,
        assigned: devices.filter(d => d.assignedUserId).length,
      });
    } catch (_) { }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout title="Admin Overview">
        <div className="space-y-4 sm:space-y-6">

          <div className="card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-[#263445] dark:text-white">
                Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! 👋
              </h2>
              <p className="text-sm text-[var(--color-secondary-text)] dark:text-slate-400 mt-1">
                Here&apos;s a quick overview of your AC Controller system.
              </p>
            </div>
            <Link
              href="/admin/users"
              className="btn-primary shrink-0 self-start sm:self-auto"
            >
              Manage Users <ArrowRightIcon />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <DashStatCard label="Total Users" value={stats?.totalUsers} icon={UsersIcon} color="blue" note="Registered accounts" />
            <DashStatCard label="Active Users" value={stats?.activeUsers} icon={ActiveIcon} color="green" note="Currently enabled" />
            <DashStatCard label="Total Devices" value={stats?.totalDevices} icon={DevicesIcon} color="purple" note="In the system" />
            <DashStatCard label="Assigned" value={stats?.assigned} icon={AssignIcon} color="amber" note="Devices assigned" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#263445] dark:text-slate-300 mb-3">Quick Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickLink href="/admin/users" icon={UsersIcon} label="Users" desc="Manage all user accounts" color="blue" />
              <QuickLink href="/admin/devices" icon={DevicesIcon} label="Devices" desc="Add & manage AC devices" color="purple" />
              <QuickLink href="/admin/assignments" icon={AssignIcon} label="Assignments" desc="Assign devices to users" color="green" />
            </div>
          </div>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}