"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import DashboardLayout from '../../../components/ui/DashboardLayout';
import Modal from '../../../components/ui/Modal';
import api from '../../../lib/api';
import { getSession } from '../../../lib/auth';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRole="ADMIN">
      <DashboardLayout title="Users">
        <UsersTab />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-[var(--color-input-bg)] dark:bg-slate-900 text-[#263445] dark:text-slate-100 placeholder-[var(--color-secondary-text)] focus:outline-none focus:ring-2 focus:ring-[#8BBFD5] focus:border-transparent transition text-sm shadow-sm";

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentUsername, setCurrentUsername] = useState('');
  const [modal, setModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const session = getSession();
    if (session?.user?.username) setCurrentUsername(session.user.username);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || u.username?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    active: users.filter(u => u.enabled).length,
    inactive: users.filter(u => !u.enabled).length,
  }), [users]);

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try { await api.delete(`/api/admin/users/${u.id}`); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed.'); }
  };

  const handleToggle = async (u) => {
    try { await api.patch(`/api/admin/users/${u.id}/toggle-status`); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Status update failed.'); }
  };

  const closeModal = () => { setModal(null); setSelectedUser(null); };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <StatCard label="Total Users" value={stats.total} tone="blue" />
        <StatCard label="Admins" value={stats.admins} tone="purple" />
        <StatCard label="Active" value={stats.active} tone="green" />
        <StatCard label="Inactive" value={stats.inactive} tone="red" />
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-secondary-text)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, username, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} pl-9`}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`${inputCls} sm:w-44`}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchUsers} className="btn-secondary px-4 py-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button onClick={() => setModal('add')} className="btn-primary px-4 py-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3 text-[var(--color-secondary-text)]">
            <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="text-red-500 dark:text-red-400 font-medium">{error}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-light-blue-bg)] dark:bg-slate-800 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-[var(--color-secondary-text)]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 11l-4 4m0-4 4 4" />
              </svg>
            </div>
            <p className="text-[var(--color-secondary-text)] text-sm">No users found.</p>
          </div>
        ) : (
          <>
            <ul className="md:hidden divide-y divide-[var(--color-border)] dark:divide-slate-800">
              {filtered.map((u) => (
                <li key={u.id} className="p-4 hover:bg-[var(--color-light-blue-bg)]/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8BBFD5] to-[#78AEC6] text-white flex items-center justify-center font-bold shrink-0 text-sm">
                      {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#263445] dark:text-white truncate text-sm">
                          {u.fullName || '—'}
                        </span>
                        {u.username === currentUsername && (
                          <span className="badge badge-blue text-[10px]">You</span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-secondary-text)] truncate">@{u.username}</div>
                      <div className="text-xs text-[var(--color-secondary-text)] truncate">{u.email}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Pill tone={u.role === 'ADMIN' ? 'purple' : 'blue'}>{u.role}</Pill>
                        <Pill tone={u.enabled ? 'green' : 'red'}>{u.enabled ? 'Active' : 'Inactive'}</Pill>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 mt-3">
                    <IconBtn title="Edit" color="blue" onClick={() => { setSelectedUser(u); setModal('edit'); }}>
                      <EditIcon />
                    </IconBtn>
                    <IconBtn title="Reset Password" color="amber" onClick={() => { setSelectedUser(u); setModal('reset'); }}>
                      <KeyIcon />
                    </IconBtn>
                    <IconBtn title={u.enabled ? 'Deactivate' : 'Activate'} color="green" onClick={() => handleToggle(u)} disabled={u.username === currentUsername}>
                      {u.enabled ? <PauseIcon /> : <PlayIcon />}
                    </IconBtn>
                    <IconBtn title="Delete" color="red" onClick={() => handleDelete(u)} disabled={u.username === currentUsername}>
                      <TrashIcon />
                    </IconBtn>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full data-table text-sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8BBFD5] to-[#78AEC6] text-white flex items-center justify-center font-bold shrink-0 text-xs">
                            {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[#263445] dark:text-white truncate flex items-center gap-1.5">
                              {u.fullName || '—'}
                              {u.username === currentUsername && (
                                <span className="badge badge-blue text-[10px]">You</span>
                              )}
                            </div>
                            <div className="text-xs text-[var(--color-secondary-text)]">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--color-secondary-text)] dark:text-slate-400">{u.email}</td>
                      <td><Pill tone={u.role === 'ADMIN' ? 'purple' : 'blue'}>{u.role}</Pill></td>
                      <td><Pill tone={u.enabled ? 'green' : 'red'}>{u.enabled ? 'Active' : 'Inactive'}</Pill></td>
                      <td className="text-[var(--color-secondary-text)] text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <IconBtn title="Edit" color="blue" onClick={() => { setSelectedUser(u); setModal('edit'); }}><EditIcon /></IconBtn>
                          <IconBtn title="Reset Password" color="amber" onClick={() => { setSelectedUser(u); setModal('reset'); }}><KeyIcon /></IconBtn>
                          <IconBtn title={u.enabled ? 'Deactivate' : 'Activate'} color="green" onClick={() => handleToggle(u)} disabled={u.username === currentUsername}>
                            {u.enabled ? <PauseIcon /> : <PlayIcon />}
                          </IconBtn>
                          <IconBtn title="Delete" color="red" onClick={() => handleDelete(u)} disabled={u.username === currentUsername}><TrashIcon /></IconBtn>
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
          Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      )}

      {modal === 'add' && <UserModal mode="create" onClose={closeModal} onSaved={() => { closeModal(); fetchUsers(); }} />}
      {modal === 'edit' && selectedUser && <UserModal mode="edit" user={selectedUser} onClose={closeModal} onSaved={() => { closeModal(); fetchUsers(); }} />}
      {modal === 'reset' && selectedUser && <ResetPasswordModal user={selectedUser} onClose={closeModal} />}
    </>
  );
}

function UserModal({ mode, user, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState({
    fullName: user?.fullName || '', username: user?.username || '',
    email: user?.email || '', password: '',
    role: user?.role || 'USER', enabled: user?.enabled ?? true,
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors(fe => ({ ...fe, [name]: '' }));
  };

  const validate = () => {
    const fe = {};
    if (!isEdit && !form.fullName.trim()) fe.fullName = 'Full name is required';
    if (!isEdit && !form.username.trim()) fe.username = 'Username is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) fe.email = 'Valid email required';
    if (!isEdit && (!form.password || form.password.length < 8)) fe.password = 'Min. 8 characters';
    if (isEdit && form.password && form.password.length < 8) fe.password = 'Min. 8 characters';
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { fullName: form.fullName, email: form.email, role: form.role, enabled: form.enabled };
        if (form.password) payload.password = form.password;
        await api.put(`/api/admin/users/${user.id}`, payload);
      } else {
        await api.post('/api/admin/users', { ...form });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? 'Edit User' : 'Add New User'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {error && <AlertError>{error}</AlertError>}
        <Field label="Full Name" error={fieldErrors.fullName}>
          <input name="fullName" value={form.fullName} onChange={handleChange} className={inputCls} placeholder="John Doe" />
        </Field>
        <Field label="Username" error={fieldErrors.username}>
          <input name="username" value={form.username} onChange={handleChange} disabled={isEdit}
            className={`${inputCls} ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder="johndoe" />
        </Field>
        <Field label="Email" error={fieldErrors.email}>
          <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} placeholder="john@example.com" />
        </Field>
        <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} error={fieldErrors.password}>
          <div className="relative">
            <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handleChange}
              className={`${inputCls} pr-16`} placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 8 characters'} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8BBFD5] dark:text-[#8BBFD5] hover:underline">
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Role">
            <select name="role" value={form.role} onChange={handleChange} className={inputCls}>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </Field>
          <Field label="Status">
            <label className="flex items-center gap-2.5 mt-2 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" name="enabled" checked={form.enabled} onChange={handleChange} className="sr-only" />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.enabled ? 'bg-[#8BBFD5]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.enabled ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-[#263445] dark:text-slate-300 font-medium">
                {form.enabled ? 'Active' : 'Inactive'}
              </span>
            </label>
          </Field>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[var(--color-border)] dark:border-slate-800">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <><span className="spinner w-3.5 h-3.5" /> Saving…</> : (isEdit ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!success) return;
    if (countdown === 0) return onClose();
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (password.length < 8) return setError('Min. 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setSaving(true);
    try {
      await api.post(`/api/admin/users/${user.id}/reset-password`, { newPassword: password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally { setSaving(false); }
  };

  return (
    <Modal title={success ? 'Password Reset' : 'Reset Password'} onClose={onClose} headerColor={success ? 'green' : 'amber'}>
      {success ? (
        <div className="p-8 text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <p className="text-[#263445] dark:text-slate-300 font-medium">
            Password for <strong>{user.username}</strong> updated successfully.
          </p>
          <p className="text-xs text-[var(--color-secondary-text)]">Closing in {countdown}s…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="panel-bg p-3 text-sm text-amber-700 dark:text-amber-300">
            Resetting password for <strong>@{user.username}</strong> ({user.email})
          </div>
          {error && <AlertError>{error}</AlertError>}
          <Field label="New Password">
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required className={`${inputCls} pr-16`} placeholder="Min. 8 characters" />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8BBFD5]">
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password">
            <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              required className={inputCls} placeholder="Repeat password" />
          </Field>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[var(--color-border)] dark:border-slate-800">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition disabled:opacity-50">
              {saving ? <><span className="spinner w-3.5 h-3.5" /> Resetting…</> : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function StatCard({ label, value, tone = 'default' }) {
  const tones = {
    default: { val: 'text-[#263445] dark:text-white', bar: 'bg-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
    purple: { val: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    green: { val: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    red: { val: 'text-red-700 dark:text-red-300', bar: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    amber: { val: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    blue: { val: 'text-blue-700 dark:text-blue-300', bar: 'bg-[#8BBFD5]', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  };
  const t = tones[tone] || tones.default;
  return (
    <div className="card p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${t.bar} rounded-l-xl`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] dark:text-slate-400 truncate mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${t.val}`}>{value}</p>
    </div>
  );
}

export function Pill({ children, tone = 'blue' }) {
  const cls = {
    blue: 'bg-[#E8F0FE] text-[#263445] dark:bg-blue-900/40 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap ${cls[tone]}`}>
      {children}
    </span>
  );
}

export function IconBtn({ children, title, onClick, color = 'blue', disabled }) {
  const colorMap = {
    blue: 'hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700',
    amber: 'hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-300 dark:hover:border-amber-700',
    green: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700',
    red: 'hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700',
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] dark:border-slate-700 text-[var(--color-secondary-text)] dark:text-slate-400 transition-all duration-150 ${colorMap[color]} disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function AlertError({ children }) {
  return (
    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.707 7.293a1 1 0 0 0-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 1 0 1.414 1.414L10 11.414l1.293 1.293a1 1 0 0 0 1.414-1.414L11.414 10l1.293-1.293a1 1 0 0 0-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      {children}
    </div>
  );
}

function EditIcon() { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>; }
function KeyIcon() { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z" /></svg>; }
function PauseIcon() { return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>; }
function PlayIcon() { return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" /></svg>; }
function TrashIcon() { return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline strokeLinecap="round" strokeLinejoin="round" points="3 6 5 6 21 6" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" /></svg>; }