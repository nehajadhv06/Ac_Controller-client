"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import Modal from '../../components/ui/Modal';
import api from '../../lib/api';
import { useAcDevice } from '../../hooks/useAcDevice';
import { toast } from 'react-toastify';
import { FiCpu, FiChevronDown, FiDownload, FiPlus, FiFileText, FiThermometer, FiZap, FiAlertTriangle, FiActivity, FiCalendar } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

export default function DashboardOverview() {
  const {
    devices, deviceId, setDeviceId, parsed, lastFdString,
    loading, hasData, refreshDevices,
  } = useAcDevice();

  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  
  // Date Range State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isOnline = hasData;
  const deviceDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const datePickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(e.target))
        setShowDeviceDropdown(false);
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target))
        setShowExportDropdown(false);
      if (datePickerRef.current && !datePickerRef.current.contains(e.target))
        setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Export Filtered by Date Range
  const exportFilteredByDateRange = async () => {
    if (!deviceId) {
      toast.error('Please select a device first');
      return;
    }
    if (!startDate) {
      toast.warning('Please select a start date first');
      return;
    }

    setLoadingExport(true);
    setShowDatePicker(false);
    setShowExportDropdown(false);

    try {
      // Fetch all history for the device
      const { data } = await api.get(`/api/ac/${deviceId}/history`);
      let historyEntries = Array.isArray(data) ? data : [];

      // Filter based on date range
      if (historyEntries.length > 0) {
        const start = dayjs(startDate).startOf('day');
        const end = endDate ? dayjs(endDate).endOf('day') : dayjs(startDate).endOf('day');

        historyEntries = historyEntries.filter(entry => {
          if (!entry.timestamp) return false;
          const entryDate = dayjs(entry.timestamp);
          return entryDate.isAfter(start) && entryDate.isBefore(end);
        });
      }

      if (historyEntries.length === 0) {
        toast.info(`No history data found for selected date range`);
        return;
      }

      // Format for Excel
      const excelData = historyEntries.map(entry => {
        let fdString = entry.fdString || entry.fd || 'N/A';
        let timestamp = 'N/A';
        if (entry.timestamp) {
          timestamp = dayjs(entry.timestamp).format('DD-MM-YYYY HH:mm:ss');
        }

        return {
          'Device ID': deviceId,
          'Timestamp': timestamp,
          'FD String': fdString
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AC History');

      const dateRangeStr = endDate 
        ? `${startDate}_to_${endDate}` 
        : startDate;
      const fileName = `AC_History_${deviceId.replace(/:/g, '_')}_${dateRangeStr}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success(`Exported ${historyEntries.length} entries!`);

    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export: ${error.message}`);
    } finally {
      setLoadingExport(false);
    }
  };

  const exportCurrentRawFd = () => {
    if (!lastFdString) {
      toast.warning('No live FD data yet.');
      return;
    }
    const blob = new Blob([lastFdString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ac_fd_${deviceId.replace(/:/g, '_')}_${dayjs().format('DD-MM-YYYY_HH-mm-ss')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Raw FD exported!');
    setShowExportDropdown(false);
  };

  const exportHistory = async (detailed = false) => {
    setLoadingExport(true);
    setShowExportDropdown(false);
    try {
      const { data } = await api.get(`/api/ac/${deviceId}/history`);
      const history = Array.isArray(data) ? data : [];
      if (history.length === 0) {
        toast.info('No history available to export.');
        return;
      }

      const rows = history.map((e) => {
        const formattedTimestamp = e.timestamp
          ? dayjs(e.timestamp).format('DD-MM-YYYY HH:mm:ss')
          : 'N/A';

        if (detailed && e.fdString) {
          const p = {};
          const clean = e.fdString.trim().replace(/^{|}$/g, '');
          const firstComma = clean.indexOf(',');
          if (firstComma !== -1) {
            const params = clean.substring(firstComma + 1);
            params.split(',').forEach((pair) => {
              const [k, v] = pair.split(':');
              if (k && v !== undefined) p[k.trim()] = v.trim();
            });
          }
          return { Timestamp: formattedTimestamp, ...p };
        }

        return {
          'Device ID': e.deviceId,
          Timestamp: formattedTimestamp,
          'FD String': e.fdString || 'N/A',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'History');
      const filename = `AC_History_${detailed ? 'Detailed' : 'Simple'}_${deviceId.replace(/:/g, '_')}_${dayjs().format('DD-MM-YYYY_HH-mm-ss')}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Exported ${history.length} entries.`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Export failed. Please try again.');
    } finally {
      setLoadingExport(false);
    }
  };

  const nac = parsed['D_NAC'] || 0;
  const roomTemp = parsed['C_TM'] ? (parsed['C_TM'] / 10).toFixed(1) : '0.0';
  const balanceCycle = parsed['C_BL'] || 0;
  const is3Phase = parsed['D_1P3P'] === 1;

  let activeACCount = 0;
  for (let i = 1; i <= 9; i++) if (parsed[`C_A${i}`] === 1) activeACCount++;

  let activeFaultCount = 0;
  ['F_ROV', 'F_YOV', 'F_BOV', 'F_RUV', 'F_YUV', 'F_BUV', 'F_FR', 'F_SFL', 'F_THI', 'F_TLO']
    .forEach((k) => { if (parsed[k] === 1) activeFaultCount++; });
  if (parsed['D_LPHP'] === 1) {
    ['F_LP', 'F_HP'].forEach((k) => { if (parsed[k] === 1) activeFaultCount++; });
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
        <DashboardLayout title="Dashboard Overview">
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <span className="spinner w-8 h-8 border-4 text-[#8BBFD5]" />
            <p className="text-sm text-[var(--color-secondary-text)]">Loading dashboard…</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="Dashboard Overview">

        {/* ═══════════ Device Control Bar ═══════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-3 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

          {/* Device Selector */}
          <div className="relative flex-1 min-w-0" ref={deviceDropdownRef}>
            <button
              onClick={() => setShowDeviceDropdown((v) => !v)}
              className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-input-bg)] border border-[var(--color-border)] hover:border-[#8BBFD5] transition min-h-[44px]"
              aria-haspopup="listbox"
              aria-expanded={showDeviceDropdown}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#8BBFD5] to-[#78AEC6] flex items-center justify-center text-white shrink-0">
                  <FiCpu size={14} />
                </div>
                <span className="text-sm font-semibold font-mono truncate text-[#263445] dark:text-slate-200">
                  {deviceId || devices[0]?.deviceId || 'Select a Device'}
                </span>
              </div>
              <FiChevronDown
                className={`shrink-0 text-[var(--color-secondary-text)] transition-transform ${showDeviceDropdown ? 'rotate-180' : ''}`}
                size={16}
              />
            </button>

            {showDeviceDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-[var(--color-border)] dark:border-slate-800 rounded-xl shadow-lg z-30 overflow-hidden max-h-64 overflow-y-auto">
                {devices.length === 0 ? (
                  <div className="p-4 text-sm text-[var(--color-secondary-text)] text-center">
                    No devices assigned. Click &quot;Add Device&quot; to claim one.
                  </div>
                ) : (
                  devices.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDeviceId(d.deviceId);
                        setShowDeviceDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 transition min-h-[44px] ${deviceId === d.deviceId
                        ? 'bg-[#E8F0FE] dark:bg-blue-900/20 text-[#263445] dark:text-blue-300 font-bold'
                        : 'text-[#263445] dark:text-slate-300'
                        }`}
                    >
                      <FiCpu size={14} className="shrink-0" />
                      <span className="flex-1 text-left font-mono truncate">{d.deviceId}</span>
                      {deviceId === d.deviceId && <span className="shrink-0 text-[#8BBFD5]">✓</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:shrink-0">
            
            {/* Export Dropdown */}
            <div className="relative flex-1 sm:flex-initial" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown((v) => !v)}
                disabled={loadingExport || !hasData || !deviceId}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
              >
                {loadingExport ? <span className="spinner w-3.5 h-3.5" /> : <FiDownload size={14} />}
                <span>{loadingExport ? 'Exporting…' : 'Export'}</span>
              </button>
              
              {showExportDropdown && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-white dark:bg-slate-900 border border-[var(--color-border)] dark:border-slate-800 rounded-xl shadow-lg z-30 overflow-hidden">
                  <div className="p-1.5 space-y-0.5">
                    
                    {/* Filtered By Date Range */}
                    <div className="relative">
                      <button
                        onClick={() => setShowDatePicker(true)}
                        className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 rounded-lg transition text-[#263445] dark:text-slate-300"
                      >
                        <div className="flex items-center gap-2.5">
                          <FiCalendar size={14} className="shrink-0 text-[var(--color-secondary-text)]" />
                          <span>Filter by Date</span>
                        </div>
                      </button>
                    </div>

                    <button
                      onClick={exportCurrentRawFd}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 rounded-lg transition text-[#263445] dark:text-slate-300"
                    >
                      <FiFileText size={14} className="shrink-0 text-[var(--color-secondary-text)]" />
                      Current Raw FD (.txt)
                    </button>
                    <button
                      onClick={() => exportHistory(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 rounded-lg transition text-[#263445] dark:text-slate-300"
                    >
                      <FiDownload size={14} className="shrink-0 text-[var(--color-secondary-text)]" />
                      All History - Simple (.xlsx)
                    </button>
                    <button
                      onClick={() => exportHistory(true)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 rounded-lg transition text-[#263445] dark:text-slate-300"
                    >
                      <FiDownload size={14} className="shrink-0 text-[var(--color-secondary-text)]" />
                      All History - Detailed (.xlsx)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowAddDevice(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#8BBFD5] to-[#78AEC6] hover:from-[#78AEC6] hover:to-[#5a9ab8] text-white text-xs font-semibold transition min-h-[44px]"
            >
              <FiPlus size={14} />
              <span>Add Device</span>
            </button>
          </div>
        </div>

        {/* ═══════════ Date Picker Modal ═══════════ */}
        {showDatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDatePicker(false)}>
            <div 
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-[var(--color-border)] dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
              ref={datePickerRef}
            >
              <div className="px-5 py-4 border-b border-[var(--color-border)] dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-[#263445] dark:text-white">Select Date Range</h3>
                <button onClick={() => setShowDatePicker(false)} className="text-slate-400 hover:text-red-500 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-secondary-text)] uppercase mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#263445] dark:text-white focus:ring-2 focus:ring-[#8BBFD5] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-secondary-text)] uppercase mb-1">End Date (Optional)</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#263445] dark:text-white focus:ring-2 focus:ring-[#8BBFD5] outline-none"
                  />
                </div>
              </div>
              <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--color-border)] dark:border-slate-800 flex justify-end gap-2">
                <button onClick={() => setShowDatePicker(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Cancel</button>
                <button onClick={exportFilteredByDateRange} disabled={!startDate} className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition">Export</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ Offline Notice ═══════════ */}
        {deviceId && !isOnline && (
          <div className="mb-4 flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-xl text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1 shrink-0" />
            <span>
              Device <strong className="font-mono">{deviceId}</strong> is currently offline. Waiting for it to publish data…
            </span>
          </div>
        )}

        {/* ═══════════ Stat Cards ═══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <StatCard title="Room Temp" value={roomTemp} unit="°C" icon={<FiThermometer className="w-5 h-5" />} color="blue" />
          <StatCard title="Balance Cycle" value={balanceCycle} unit="M" icon={<FiActivity className="w-5 h-5" />} color="purple" />
          <StatCard title="Active ACs" value={activeACCount} suffix={`/ ${nac}`} icon={<FiZap className="w-5 h-5" />} color="emerald" />
          <StatCard title="Faults" value={activeFaultCount} icon={<FiAlertTriangle className="w-5 h-5" />} color={activeFaultCount > 0 ? 'red' : 'red'} />
        </div>

        {/* ═══════════ Phase Voltages ═══════════ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm mb-5">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)] dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-text)] dark:text-slate-400">
              Phase Voltages
            </h3>
          </div>
          <div className={`grid grid-cols-1 ${is3Phase ? 'sm:grid-cols-3' : ''} divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border)] dark:divide-slate-800`}>
            <VoltageCard label="R Phase" code="C_RV" value={(parsed['C_RV'] || 0).toFixed(1)} bg="bg-red-50 dark:bg-red-900/20" text="text-red-600" />
            {is3Phase && (
              <>
                <VoltageCard label="Y Phase" code="C_YV" value={(parsed['C_YV'] || 0).toFixed(1)} bg="bg-amber-50 dark:bg-amber-900/20" text="text-amber-600" />
                <VoltageCard label="B Phase" code="C_BV" value={(parsed['C_BV'] || 0).toFixed(1)} bg="bg-blue-50 dark:bg-blue-900/20" text="text-blue-600" />
              </>
            )}
          </div>
        </div>

        {/* AC Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--color-border)] dark:border-slate-800 flex justify-between items-center bg-[var(--color-light-blue-bg)]/50 dark:bg-slate-800/20">
            <h3 className="text-sm font-bold text-[#263445] dark:text-slate-200">Live AC Units</h3>
            <span className="text-xs font-mono text-[var(--color-secondary-text)] bg-white dark:bg-slate-800 px-2 py-1 rounded border border-[var(--color-border)] dark:border-slate-700">
              D_NAC: {nac}
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: nac }).map((_, idx) => {
              const i = idx + 1;
              const isOn = parsed[`C_A${i}`] === 1;
              const current = isOn ? ((parsed[`C_A${i}C`] || 0) / 10).toFixed(1) : '0.0';
              const hours = isOn ? (parsed[`C_A${i}H`] || 0) : 0;

              return (
                <div
                  key={i}
                  className={`relative rounded-xl border p-5 flex flex-col justify-between
                    ${isOn
                      ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/50 to-white dark:border-emerald-900/50 dark:from-emerald-900/10 dark:to-slate-900 shadow-sm'
                      : 'border-[var(--color-border)] bg-[var(--color-light-blue-bg)]/50 dark:border-slate-700 dark:bg-slate-800/40'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-extrabold text-[#263445] dark:text-slate-200 text-lg">AC {i}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${isOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--color-secondary-text)]'}`}>
                        {isOn ? 'Running' : 'Standby'}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOn ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-200 dark:bg-slate-700 text-[var(--color-secondary-text)]'}`}>
                      <svg className={`w-5 h-5 ${isOn ? 'animate-[spin_3s_linear_infinite]' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2-3 3-5 6-5s4 3 4 5-1 5-4 5M12 12c-2-3-3-5-6-5S2 10 2 12s1 5 4 5M12 12v10m0-10h10" />
                      </svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-[var(--color-secondary-text)] font-semibold mb-0.5 uppercase">Current</p>
                      <p className={`text-xl font-mono font-bold ${isOn ? 'text-[#263445] dark:text-white' : 'text-[var(--color-secondary-text)]'}`}>
                        {current} <span className="text-xs font-normal text-[var(--color-secondary-text)]">A</span>
                      </p>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-900/60 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-[var(--color-secondary-text)] font-semibold mb-0.5 uppercase">Hours</p>
                      <p className={`text-xl font-mono font-bold ${isOn ? 'text-[#263445] dark:text-white' : 'text-[var(--color-secondary-text)]'}`}>
                        {hours} <span className="text-xs font-normal text-[var(--color-secondary-text)]">H</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {showAddDevice && (
          <AddDeviceModal
            onClose={() => setShowAddDevice(false)}
            onSuccess={() => {
              setShowAddDevice(false);
              refreshDevices();
            }}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────────── */
function StatCard({ title, value, unit, suffix, icon, color = 'blue' }) {
  const colors = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', val: 'text-blue-700 dark:text-blue-300', bar: 'bg-[#8BBFD5]' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', val: 'text-purple-700 dark:text-purple-300', bar: 'bg-purple-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', val: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400', val: 'text-red-700 dark:text-red-300', bar: 'bg-red-500' },
    slate: { bg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500 dark:text-slate-400', val: 'text-slate-700 dark:text-slate-300', bar: 'bg-slate-400' },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-4 sm:p-5 relative overflow-hidden shadow-sm">
      <div className={`absolute top-0 left-0 w-1 h-full ${c.bar} rounded-l-xl`} />
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs uppercase font-semibold tracking-wider text-[var(--color-secondary-text)] dark:text-slate-400 mb-1.5 truncate">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${c.val} leading-none`}>
            {value}
            {unit && <span className="text-base sm:text-lg text-[var(--color-secondary-text)] ml-1">{unit}</span>}
            {suffix && <span className="text-base sm:text-lg text-[var(--color-secondary-text)] ml-1">{suffix}</span>}
          </p>
        </div>
        {icon && (
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
            <div className={c.icon}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── VoltageCard ───────────────────────────────────────────────────── */
function VoltageCard({ label, code, value, bg, text }) {
  return (
    <div className="p-4 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${bg} ${text}`}>
          {label.charAt(0)}
        </span>
        <span className="text-sm font-semibold text-[#263445] dark:text-slate-300">{label}</span>
        <span className="text-xs font-mono text-[var(--color-secondary-text)]">({code})</span>
      </div>
      <div className="text-2xl sm:text-3xl font-mono font-bold text-[#263445] dark:text-white flex items-baseline gap-1">
        {value} <span className="text-sm font-sans font-normal text-[var(--color-secondary-text)]">V</span>
      </div>
    </div>
  );
}

/* ─── AddDeviceModal ────────────────────────────────────────────────── */
function AddDeviceModal({ onClose, onSuccess }) {
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!uniqueId.trim()) {
      setError('Unique ID is required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/user/devices/claim', {
        uniqueId: uniqueId.trim().toUpperCase(),
      });
      toast.success('Device claimed successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim device.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Device" onClose={onClose} headerColor="blue">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-[#263445] dark:text-slate-300 mb-1.5">
            Unique ID
          </label>
          <input
            value={uniqueId}
            onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
            placeholder="e.g. UNQ005"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-input-bg)] font-mono uppercase text-[#263445] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#8BBFD5] min-h-[44px]"
            autoFocus
            disabled={loading}
          />
          <p className="text-xs text-[var(--color-secondary-text)] mt-2">
            Enter the Unique ID printed on the device label.
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <span className="spinner w-3.5 h-3.5" /> Claiming…
              </>
            ) : (
              'Claim'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}