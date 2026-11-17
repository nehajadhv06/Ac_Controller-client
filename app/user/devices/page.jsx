"use client";
import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import DashboardLayout from '../../../components/ui/DashboardLayout';
import Modal from '../../../components/ui/Modal';
import api from '../../../lib/api';
import { FiCpu, FiCheckCircle, FiAlertCircle, FiPlus } from 'react-icons/fi';

export default function UserDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/user/devices');
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleDeviceClaimed = () => {
    fetchDevices();
  };

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="My Devices">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-[#263445] dark:text-white">Assigned Devices</h2>
            <p className="text-sm text-[var(--color-secondary-text)]">Manage your AC Controllers here.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary self-start sm:self-auto"
          >
            <FiPlus className="w-4 h-4" />
            Add Device
          </button>
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
            <span className="spinner text-[#8BBFD5]" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <p className="text-sm text-[var(--color-secondary-text)]">Loading devices…</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        ) : devices.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-8 sm:p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-light-blue-bg)] dark:bg-slate-800 flex items-center justify-center mb-4">
              <FiCpu className="w-7 h-7 text-[var(--color-secondary-text)]" />
            </div>
            <p className="text-[var(--color-primary-text)] dark:text-slate-400 font-medium mb-1">No devices found</p>
            <p className="text-sm text-[var(--color-secondary-text)] mb-5">
              You currently have no devices assigned to your account.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-secondary text-sm"
            >
              <FiPlus className="w-4 h-4" />
              Claim a Device
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {devices.map((d) => (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-4 sm:p-5 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#E8F0FE] dark:bg-blue-900/30 text-[#263445] dark:text-blue-300 border border-[#D0E0F0] dark:border-blue-800">
                    {d.deviceType}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                    Assigned
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F0FE] dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <FiCpu className="w-4 h-4 text-[#8BBFD5] dark:text-blue-400" />
                  </div>
                  <div className="font-mono text-sm font-bold text-[#263445] dark:text-white break-all min-w-0 truncate">
                    {d.deviceId}
                  </div>
                </div>
                <div className="text-xs text-[var(--color-secondary-text)] mt-1">
                  Unique ID: <span className="font-mono font-semibold text-[#263445] dark:text-slate-300">{d.uniqueId}</span>
                </div>
                <div className="text-xs text-[var(--color-secondary-text)] mt-3 pt-3 border-t border-[var(--color-border)] dark:border-slate-800">
                  Assigned: {d.assignedAt ? new Date(d.assignedAt).toLocaleDateString() : '—'}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <AddDeviceModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleDeviceClaimed}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function AddDeviceModal({ onClose, onSuccess }) {
  const [uniqueId, setUniqueId] = useState('');
  const [deviceIdDisplayed, setDeviceIdDisplayed] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setUniqueId('');
    setDeviceIdDisplayed('');
    setIsSuccess(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    setError('');

    if (!uniqueId.trim()) {
      return setError('Please enter a valid Unique ID.');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/user/devices/claim', {
        uniqueId: uniqueId.trim().toUpperCase(),
      });

      setDeviceIdDisplayed(data.device?.deviceId || data.deviceId || 'Device claimed!');
      setIsSuccess(true);

      if (onSuccess) onSuccess(data);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      const status = err.response?.status;
      let message = 'Failed to claim device. Please check the Unique ID and try again.';

      if (status === 401) message = 'Session expired. Please login again.';
      else if (status === 403) message = 'Authentication failed. Please login again.';
      else if (status === 400) message = err.response?.data?.message || 'Invalid Unique ID or device already claimed.';
      else if (err.response?.data?.message) message = err.response.data.message;

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add New Device" onClose={handleClose} headerColor="blue">
      <form onSubmit={handleClaim} className="p-5 sm:p-6 space-y-5">

        {error && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
            <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">
            Unique ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={uniqueId}
            onChange={(e) => {
              setUniqueId(e.target.value.toUpperCase());
              if (isSuccess) {
                setIsSuccess(false);
                setDeviceIdDisplayed('');
              }
            }}
            placeholder="Enter unique ID (e.g., UNQ001)"
            className={`w-full px-3.5 py-3 rounded-lg border font-mono uppercase text-base transition min-h-[48px]
              ${isSuccess
                ? 'bg-[var(--color-light-blue-bg)] dark:bg-slate-800/50 border-[var(--color-border)] dark:border-slate-600 text-[#263445] dark:text-slate-100'
                : 'border-[var(--color-border)] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#263445] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#8BBFD5]'
              }`}
            disabled={loading || isSuccess}
            autoFocus={!isSuccess}
            required
          />
          <p className="text-xs text-[var(--color-secondary-text)] mt-2">
            Available Unique IDs: UNQ001 to UNQ010
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">
            Device ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={deviceIdDisplayed || (isSuccess ? 'Device claimed!' : 'Will appear after claiming')}
              className={`w-full px-3.5 py-3 rounded-lg font-mono text-base pr-10 transition min-h-[48px]
                ${isSuccess
                  ? 'border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border border-[var(--color-border)] dark:border-slate-700 bg-[var(--color-light-blue-bg)] dark:bg-slate-800/50 text-[var(--color-secondary-text)]'
                }`}
              disabled
              readOnly
            />
            {isSuccess && (
              <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            )}
          </div>
          {isSuccess && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1.5">
              <FiCheckCircle className="w-3.5 h-3.5" />
              Device successfully claimed! Refreshing…
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-[var(--color-border)] dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={loading}
          >
            {isSuccess ? 'Close' : 'Cancel'}
          </button>

          {!isSuccess ? (
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner w-3.5 h-3.5" /> Claiming…</>
              ) : (
                <><FiCpu className="w-4 h-4" /> Claim Device</>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition"
            >
              <FiCheckCircle className="w-4 h-4" />
              Done
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}