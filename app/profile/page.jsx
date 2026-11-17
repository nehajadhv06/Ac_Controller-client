"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import api from '../../lib/api';
import { getSession, setSession } from '../../lib/auth';
import { toast } from 'react-toastify';

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-[var(--color-input-bg)] dark:bg-slate-900 text-[#263445] dark:text-slate-100 placeholder-[var(--color-secondary-text)] focus:outline-none focus:ring-2 focus:ring-[#8BBFD5] focus:border-transparent transition text-sm shadow-sm";

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

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--color-secondary-text)] mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="My Profile">
        <ProfileTab />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function ProfileTab() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Image State
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    
    // Load locally saved profile picture
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) setProfileImage(savedImage);

    try {
      const session = getSession();
      if (session?.user) {
        const u = session.user;
        setProfile(u);
        setEditForm((prev) => ({
          ...prev,
          fullName: u.fullName || '',
          email: u.email || '',
        }));
      }

      try {
        const { data } = await api.get('/api/auth/me');
        if (data) {
          const merged = { ...(session?.user || {}), ...data };
          setProfile(merged);
          setEditForm((prev) => ({
            ...prev,
            fullName: merged.fullName || '',
            email: merged.email || '',
          }));
          if (session?.token) {
            setSession({ accessToken: session.token, user: merged });
          }
        }
      } catch (_) {}
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProfileImage(base64String);
      localStorage.setItem('profileImage', base64String);
      toast.success('Profile photo updated!');
    };
    reader.readAsDataURL(file);
  };

  // Handle Image Delete
  const handleDeleteImage = (e) => {
    e.stopPropagation(); // prevent triggering the upload input
    setProfileImage(null);
    localStorage.removeItem('profileImage');
    toast.success('Profile photo removed!');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: '' }));
  };

  const validate = () => {
    const fe = {};
    if (!editForm.email.trim() || !/\S+@\S+\.\S+/.test(editForm.email)) {
      fe.email = 'Valid email required';
    }
    if (editForm.newPassword || editForm.confirmPassword) {
      if (editForm.newPassword.length < 8) fe.newPassword = 'Min. 8 characters';
      if (editForm.newPassword !== editForm.confirmPassword) {
        fe.confirmPassword = 'Passwords do not match';
      }
    }
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    try {
      const payload = { email: editForm.email };
      if (editForm.fullName && editForm.fullName !== profile?.fullName) {
        payload.fullName = editForm.fullName;
      }
      if (editForm.newPassword) {
        payload.password = editForm.newPassword;
      }

      await api.put('/api/ac/profile', payload);

      const { data } = await api.get('/api/auth/me');
      const session = getSession();
      const merged = { ...(profile || {}), ...data };
      if (session?.token) {
        setSession({ accessToken: session.token, user: merged });
      }
      setProfile(merged);
      setEditForm((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));

      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <span className="spinner w-8 h-8 border-4 text-[#8BBFD5]" />
        <p className="text-sm text-[var(--color-secondary-text)]">Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        {error}
      </div>
    );
  }

  const initial = (profile?.fullName || profile?.username || '?').charAt(0).toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Profile Summary Card */}
      <div className="lg:col-span-1">
        <div className="card p-6 flex flex-col items-center text-center">
          
          {/* Avatar / Image Upload Area */}
          <div className="relative group mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8BBFD5] to-[#78AEC6] text-white flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden cursor-pointer relative"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            {/* Delete Button */}
            {profileImage && (
              <button 
                onClick={handleDeleteImage}
                className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition"
                title="Remove photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <h2 className="text-lg font-bold text-[#263445] dark:text-white truncate max-w-full">
            {profile?.fullName || profile?.username || '—'}
          </h2>
          <p className="text-sm text-[var(--color-secondary-text)] mb-2">@{profile?.username}</p>
          <span
            className={`badge text-[11px] font-bold px-3 py-1 rounded-full ${
              profile?.role === 'ADMIN' ? 'badge-purple' : 'badge-blue'
            }`}
          >
            {profile?.role || 'USER'}
          </span>

          <div className="w-full mt-6 pt-4 border-t border-[var(--color-border)] dark:border-slate-800 space-y-3 text-left">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold">Email</p>
              <p className="text-sm text-[#263445] dark:text-slate-200 break-all">{profile?.email || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold mb-1">Status</p>
              <span
                className={`badge text-[11px] ${
                  profile?.enabled === false ? 'badge-red' : 'badge-green'
                }`}
              >
                {profile?.enabled === false ? 'Inactive' : 'Active'}
              </span>
            </div>
            {profile?.createdAt && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold">Member Since</p>
                <p className="text-sm text-[#263445] dark:text-slate-200">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="lg:col-span-2">
        <div className="card p-5 sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-secondary-text)] mb-4">
            Edit Profile
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name">
              <input
                name="fullName"
                value={editForm.fullName}
                onChange={handleChange}
                className={inputCls}
                placeholder="John Doe"
              />
            </Field>

            <Field label="Username" hint="Username cannot be changed.">
              <input
                value={profile?.username || ''}
                disabled
                className={`${inputCls} opacity-60 cursor-not-allowed`}
              />
            </Field>

            <Field label="Email" error={fieldErrors.email}>
              <input
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleChange}
                className={inputCls}
                placeholder="john@example.com"
              />
            </Field>

            <div className="pt-2 border-t border-[var(--color-border)] dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-text)] mb-3">
                Change Password <span className="font-normal normal-case">(optional)</span>
              </p>

              <div className="space-y-4">
                <Field label="New Password" error={fieldErrors.newPassword}>
                  <div className="relative">
                    <input
                      name="newPassword"
                      type={showPw ? 'text' : 'password'}
                      value={editForm.newPassword}
                      onChange={handleChange}
                      className={`${inputCls} pr-16`}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8BBFD5] hover:underline"
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </Field>

                <Field label="Confirm New Password" error={fieldErrors.confirmPassword}>
                  <input
                    name="confirmPassword"
                    type={showPw ? 'text' : 'password'}
                    value={editForm.confirmPassword}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[var(--color-border)] dark:border-slate-800">
              <button
                type="button"
                onClick={loadProfile}
                className="btn-secondary"
                disabled={saving}
              >
                Reset
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? (
                  <>
                    <span className="spinner w-3.5 h-3.5" /> Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}