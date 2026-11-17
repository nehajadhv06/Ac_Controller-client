"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import DashboardLayout from '../../../components/ui/DashboardLayout';
import api from '../../../lib/api';
import { Pill } from '../users/page';

export default function AdminAssignmentsPage() {
  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout title="Assignments">
        <AssignmentsTab />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AssignmentsTab() {
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, dRes] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/admin/devices'),
      ]);
      const uList = Array.isArray(uRes.data) ? uRes.data : [];
      setUsers(uList);
      setDevices(Array.isArray(dRes.data) ? dRes.data : []);
      if (!selectedUserId && uList.length > 0) setSelectedUserId(uList[0].id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  );

  const userDevices = useMemo(
    () => devices.filter((d) => d.assignedUserId === selectedUserId),
    [devices, selectedUserId]
  );

  const unassignedDevices = useMemo(
    () => devices.filter((d) => !d.assignedUserId),
    [devices]
  );

  const assign = async (deviceId) => {
    if (!selectedUserId) return;
    setBusy(true);
    try {
      await api.post(`/api/admin/devices/${deviceId}/assign`, { userId: selectedUserId });
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Assign failed.');
    } finally {
      setBusy(false);
    }
  };

  const unassign = async (deviceId) => {
    setBusy(true);
    try {
      await api.delete(`/api/admin/devices/${deviceId}/unassign`);
      await fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Unassign failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-[var(--color-secondary-text)] dark:text-slate-400">Loading…</div>;
  if (error) return <div className="p-10 text-center text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-text)] dark:text-slate-400 mb-3">
          Users
        </h2>
        <div className="space-y-1 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto -mx-1 px-1">
          {users.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary-text)] dark:text-slate-400">No users.</p>
          ) : (
            users.map((u) => {
              const active = selectedUserId === u.id;
              const count = devices.filter((d) => d.assignedUserId === u.id).length;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${active
                    ? 'bg-[#E8F0FE] text-[#263445] dark:text-[#8bc1da] font-semibold'
                    : 'hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#8BBFD5] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${active ? 'text-[#263445]' : 'text-[#263445] dark:text-white'}`}>
                      {u.fullName || u.username}
                    </div>
                   <div className={`text-xs truncate ${active ? 'text-slate-600 dark:text-slate-300' : 'text-[var(--color-secondary-text)]'}`}>@{u.username}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-light-blue-bg)]
                         dark:bg-slate-800 text-[var(--color-secondary-text)]">
                    {count}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        {!selectedUser ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-10 text-center text-[var(--color-secondary-text)]">
            Select a user from the left.
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-text)] truncate">
                  Assigned to @{selectedUser.username}
                </h2>
                <Pill tone="blue">{userDevices.length} devices</Pill>
              </div>
              {userDevices.length === 0 ? (
                <p className="text-sm text-[var(--color-secondary-text)] py-4">
                  This user has no devices assigned.
                </p>
              ) : (
                <div className="space-y-2">
                  {userDevices.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 bg-[var(--color-light-blue-bg)]/50 dark:bg-slate-800/60 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold text-[#263445] dark:text-white truncate">
                          {d.deviceId}
                        </div>
                        <div className="text-xs text-[var(--color-secondary-text)] truncate">
                          {d.uniqueId} • {d.deviceType}
                        </div>
                      </div>
                      <button
                        onClick={() => unassign(d.id)}
                        disabled={busy}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                      >
                        Unassign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-text)]">
                  Available Devices
                </h2>
                <Pill tone="amber">{unassignedDevices.length} unassigned</Pill>
              </div>
              {unassignedDevices.length === 0 ? (
                <p className="text-sm text-[var(--color-secondary-text)] py-4">
                  All devices are already assigned.
                </p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {unassignedDevices.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-2 bg-[var(--color-light-blue-bg)]/50 dark:bg-slate-800/60 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-mono text-sm font-semibold text-[#263445] dark:text-white truncate">
                          {d.deviceId}
                        </div>
                        <div className="text-xs text-[var(--color-secondary-text)] truncate">
                          {d.uniqueId} • {d.deviceType}
                        </div>
                      </div>
                      <button
                        onClick={() => assign(d.id)}
                        disabled={busy}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-md bg-[#8BBFD5] hover:bg-[#78AEC6] text-white disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}