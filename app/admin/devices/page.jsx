"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import DashboardLayout from '../../../components/ui/DashboardLayout';
import Modal from '../../../components/ui/Modal';
import api from '../../../lib/api';
import { StatCard, Pill, IconBtn, Field } from '../users/page';

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-[var(--color-input-bg)] dark:bg-slate-900 text-[#263445] dark:text-slate-100 placeholder-[var(--color-secondary-text)] focus:outline-none focus:ring-2 focus:ring-[#8BBFD5] focus:border-transparent transition text-sm shadow-sm";
export default function AdminDevicesPage() {
  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout title="Devices">
        <DevicesTab />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function DevicesTab() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [assignFilter, setAssignFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [devRes, userRes] = await Promise.all([
        api.get('/api/admin/devices'),
        api.get('/api/admin/users'),
      ]);
      setDevices(Array.isArray(devRes.data) ? devRes.data : []);
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || d.deviceId?.toLowerCase().includes(q) || d.uniqueId?.toLowerCase().includes(q) || d.assignedUsername?.toLowerCase().includes(q);
      const matchesAssign =
        assignFilter === 'ALL' ||
        (assignFilter === 'ASSIGNED' && d.assignedUserId) ||
        (assignFilter === 'UNASSIGNED' && !d.assignedUserId);
      return matchesSearch && matchesAssign;
    });
  }, [devices, search, assignFilter]);

  const stats = useMemo(() => ({
    total: devices.length,
    unique: new Set(devices.map(d => d.uniqueId).filter(Boolean)).size,
    assigned: devices.filter(d => d.assignedUserId).length,
    unassigned: devices.filter(d => !d.assignedUserId).length,
  }), [devices]);

  const handleDelete = async (d) => {
    if (!confirm(`Delete device "${d.deviceId}"? This cannot be undone.`)) return;
    try { await api.delete(`/api/admin/devices/${d.id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const handleUnassign = async (d) => {
    if (!confirm(`Unassign "${d.deviceId}" from @${d.assignedUsername}?`)) return;
    try { await api.delete(`/api/admin/devices/${d.id}/unassign`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Unassign failed.'); }
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Total Devices" value={stats.total} tone="default" />
        <StatCard label="Unique IDs" value={stats.unique} tone="red" />
        <StatCard label="Assigned" value={stats.assigned} tone="blue" />
        <StatCard label="Unassigned" value={stats.unassigned} tone="amber" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-secondary-text)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search device ID, unique ID, or user…"
                value={search} onChange={e => setSearch(e.target.value)}
                className={`${inputCls} pl-9`} />
            </div>
            <select value={assignFilter} onChange={e => setAssignFilter(e.target.value)} className={`${inputCls} sm:w-44`}>
              <option value="ALL">All Devices</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNASSIGNED">Unassigned</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="btn-secondary px-4 py-2 text-sm gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button onClick={() => setShowAddModal(true)} className="btn-primary px-4 py-2 text-sm gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Device
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3 text-[var(--color-secondary-text)]">
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <span className="text-sm">Loading devices…</span>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500 dark:text-red-400 font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-light-blue-bg)] dark:bg-slate-800 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-[var(--color-secondary-text)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <p className="text-[var(--color-secondary-text)] text-sm">No devices found.</p>
          </div>
        ) : (
          <>
            <ul className="md:hidden divide-y divide-[var(--color-border)] dark:divide-slate-800">
              {filtered.map(d => (
                <li key={d.id} className="p-4 hover:bg-[var(--color-light-blue-bg)]/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-[#263445] dark:text-white truncate text-sm">{d.deviceId}</div>
                      <div className="text-xs text-[var(--color-secondary-text)] truncate">{d.uniqueId} · {d.deviceType}</div>
                    </div>
                    {d.assignedUsername
                      ? <Pill tone="blue">@{d.assignedUsername}</Pill>
                      : <Pill tone="gray">Unassigned</Pill>
                    }
                  </div>
                  <div className="text-xs text-[var(--color-secondary-text)] mb-3">
                    Created: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <IconBtn title="Assign" color="blue" onClick={() => setAssignTarget(d)}><LinkIcon /></IconBtn>
                    {d.assignedUserId && <IconBtn title="Unassign" color="amber" onClick={() => handleUnassign(d)}><UnlinkIcon /></IconBtn>}
                    <IconBtn title="Delete" color="red" onClick={() => handleDelete(d)}><TrashIcon /></IconBtn>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full data-table text-sm">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Unique ID</th>
                    <th>Type</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}>
                      <td><span className="font-mono font-semibold text-[#263445] dark:text-white">{d.deviceId}</span></td>
                      <td>
                        <span className="font-mono text-xs px-2 py-1 rounded-md bg-[var(--color-light-blue-bg)] dark:bg-slate-800 text-[#263445] dark:text-slate-300">
                          {d.uniqueId}
                        </span>
                      </td>
                      <td className="text-[var(--color-secondary-text)] dark:text-slate-400">{d.deviceType}</td>
                      <td>
                        {d.assignedUsername
                          ? <Pill tone="blue">@{d.assignedUsername}</Pill>
                          : <Pill tone="gray">Unassigned</Pill>
                        }
                      </td>
                      <td className="text-[var(--color-secondary-text)] text-xs">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconBtn title="Assign" color="blue" onClick={() => setAssignTarget(d)}><LinkIcon /></IconBtn>
                          {d.assignedUserId && <IconBtn title="Unassign" color="amber" onClick={() => handleUnassign(d)}><UnlinkIcon /></IconBtn>}
                          <IconBtn title="Delete" color="red" onClick={() => handleDelete(d)}><TrashIcon /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && !error && filtered.length > 0 && (
        <p className="text-xs text-[var(--color-secondary-text)] mt-2 text-right">
          Showing {filtered.length} of {devices.length} device{devices.length !== 1 ? 's' : ''}
        </p>
      )}

      {showAddModal && (
        <DeviceModal users={users} onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); fetchAll(); }} />
      )}
      {assignTarget && (
        <AssignDeviceModal device={assignTarget} users={users} onClose={() => setAssignTarget(null)} onSaved={() => { setAssignTarget(null); fetchAll(); }} />
      )}
    </>
  );
}

function DeviceModal({ users, onClose, onSaved }) {
  const [deviceNumber, setDeviceNumber] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [deviceType, setDeviceType] = useState('SR_2-9AC');
  const [assignToUserId, setAssignToUserId] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    (async () => {
      setSuggesting(true);
      try {
        const { data } = await api.get('/api/admin/devices/suggest-unique-id');
        setUniqueId(data.uniqueId || '');
      } catch (_) { setUniqueId('UNQ011'); }
      finally { setSuggesting(false); }
    })();
  }, []);

  const previewDeviceId = deviceNumber
    ? `${deviceType}:${String(deviceNumber).padStart(6, '0')}`
    : `${deviceType}:———`;

  const validate = () => {
    const fe = {};
    if (!/^\d{1,10}$/.test(deviceNumber)) fe.deviceNumber = 'Device number must be numeric';
    if (!uniqueId || uniqueId.length < 2) fe.uniqueId = 'Unique ID is required';
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { deviceNumber: deviceNumber.trim(), uniqueId: uniqueId.trim().toUpperCase(), deviceType };
      if (assignToUserId) payload.assignToUserId = Number(assignToUserId);
      await api.post('/api/admin/devices', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Add New Device" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Device Number" error={fieldErrors.deviceNumber}>
            <input value={deviceNumber} onChange={e => setDeviceNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 260011" className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Device Type">
            <select value={deviceType} onChange={e => setDeviceType(e.target.value)} className={inputCls}>
              <option value="SR_2-9AC">SR_2-9AC</option>
            </select>
          </Field>
        </div>
        <Field label="Unique ID" error={fieldErrors.uniqueId}>
          <div className="flex gap-2 items-center">
            <input value={uniqueId} onChange={e => setUniqueId(e.target.value.toUpperCase())}
              className={`${inputCls} font-mono flex-1`} placeholder="e.g. UNQ011" />
            {suggesting && <span className="text-xs text-[var(--color-secondary-text)] whitespace-nowrap">Suggesting…</span>}
          </div>
        </Field>
        <div className="panel-bg p-3">
          <p className="text-xs text-[var(--color-secondary-text)] mb-1 font-medium uppercase tracking-wide">Device ID Preview</p>
          <p className="font-mono font-bold text-[#263445] dark:text-blue-300 break-all">{previewDeviceId}</p>
        </div>
        <Field label="Assign to User (optional)">
          <select value={assignToUserId} onChange={e => setAssignToUserId(e.target.value)} className={inputCls}>
            <option value="">— Leave unassigned —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
          </select>
        </Field>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[var(--color-border)] dark:border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><span className="spinner w-3.5 h-3.5" /> Creating…</> : 'Create Device'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AssignDeviceModal({ device, users, onClose, onSaved }) {
  const [selectedUserId, setSelectedUserId] = useState(device.assignedUserId ? String(device.assignedUserId) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!selectedUserId) return setError('Please select a user.');
    setSaving(true);
    try {
      await api.post(`/api/admin/devices/${device.id}/assign`, { userId: Number(selectedUserId) });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Assign failed.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title="Assign Device" onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        <div className="panel-bg p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-secondary-text)]">Device</p>
          <p className="font-mono font-bold text-[#263445] dark:text-blue-300 break-all">{device.deviceId}</p>
          <p className="text-xs text-[var(--color-secondary-text)]">Unique ID: <span className="font-mono">{device.uniqueId}</span></p>
          {device.assignedUsername && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Currently assigned to <strong>@{device.assignedUsername}</strong>
            </p>
          )}
        </div>
        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}
        <Field label="Assign to User">
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className={inputCls}>
            <option value="">— Select a user —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.email})</option>)}
          </select>
        </Field>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[var(--color-border)] dark:border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving || !selectedUserId} className="btn-primary">
            {saving ? <><span className="spinner w-3.5 h-3.5" /> Assigning…</> : 'Assign Device'}
          </button>
        </div>
      </form>
    </Modal>
  );
}