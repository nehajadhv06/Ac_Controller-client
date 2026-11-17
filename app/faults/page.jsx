"use client";
import { useState, useMemo, useCallback } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { useAcDevice } from '../../hooks/useAcDevice';
import {
  FiAlertTriangle,
  FiAlertCircle,
  FiAlertOctagon,
  FiCheckCircle,
  FiShield,
  FiZap,
  FiThermometer,
  FiActivity,
  FiCpu,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiInfo,
  FiChevronDown,
  FiClock,
  FiPower,
  FiX,
  FiLayers,
  FiWind,
} from 'react-icons/fi';

export default function FaultsPage() {
  const {
    parsed,
    loading,
    deviceId,
    setDeviceId,
    devices,
    hasData,
    refreshFd,
  } = useAcDevice();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFault, setSelectedFault] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Manual refresh handler with animation feedback
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshFd) await refreshFd();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, [refreshFd]);

  const nac = Number(parsed['D_NAC']) || 0;
  const lphp = parsed['D_LPHP'] === 1;
  const is3Phase = parsed['D_1P3P'] === 1 || parsed['D_1P3P'] === 3;
  const isFault = useCallback((k) => parsed[k] === 1, [parsed]);

  // Live telemetry values for context
  const rVolt = parsed['C_RV'] !== undefined ? Number(parsed['C_RV']) : 0;
  const yVolt = parsed['C_YV'] !== undefined ? Number(parsed['C_YV']) : 0;
  const bVolt = parsed['C_BV'] !== undefined ? Number(parsed['C_BV']) : 0;
  const roomTemp = parsed['C_TM'] !== undefined ? (Number(parsed['C_TM']) / 10).toFixed(1) : null;
  const sOv = parsed['S_OV'] !== undefined ? Number(parsed['S_OV']) : 270;
  const sUv = parsed['S_UV'] !== undefined ? Number(parsed['S_UV']) : 170;
  const sHi = parsed['S_HI'] !== undefined ? (Number(parsed['S_HI']) / 10).toFixed(1) : '35.0';
  const sLo = parsed['S_LO'] !== undefined ? (Number(parsed['S_LO']) / 10).toFixed(1) : '15.0';

  // ─────────────────────────────────────────────────────────────────────────
  // Diagnostic Definitions with Human-Readable Guidance & Thresholds
  // ─────────────────────────────────────────────────────────────────────────
  const phaseFaults = useMemo(() => [
    {
      code: 'F_ROV',
      name: 'R-Phase Overvoltage',
      category: 'phase',
      subsystem: 'Power Quality',
      phase: 'R Phase',
      severity: 'high',
      desc: 'Red Phase supply voltage has exceeded the maximum safe limit.',
      threshold: `Max: ${sOv} V`,
      liveReading: `${rVolt} V`,
      icon: FiZap,
      troubleshoot: [
        'Check grid supply transformer tap settings.',
        'Verify voltage stabilizer / AVR regulation performance.',
        'Ensure the high-voltage cutoff setpoint (S_OV) is calibrated correctly.',
      ],
    },
    {
      code: 'F_RUV',
      name: 'R-Phase Undervoltage',
      category: 'phase',
      subsystem: 'Power Quality',
      phase: 'R Phase',
      severity: 'medium',
      desc: 'Red Phase supply voltage dropped below the minimum operating limit.',
      threshold: `Min: ${sUv} V`,
      liveReading: `${rVolt} V`,
      icon: FiZap,
      troubleshoot: [
        'Check utility supply line for brownout or grid sagging.',
        'Inspect incoming terminals for loose or oxidized connections.',
        'Verify low-voltage cutoff setpoint (S_UV) configuration.',
      ],
    },
    {
      code: 'F_YOV',
      name: 'Y-Phase Overvoltage',
      category: 'phase',
      subsystem: 'Power Quality',
      phase: 'Y Phase',
      severity: 'high',
      desc: 'Yellow Phase supply voltage has exceeded the maximum safe limit.',
      threshold: `Max: ${sOv} V`,
      liveReading: `${yVolt} V`,
      icon: FiZap,
      troubleshoot: [
        'Check three-phase grid line balance and neutral connection.',
        'Verify AVR regulation on Yellow phase.',
      ],
    },
    {
      code: 'F_YUV',
      name: 'Y-Phase Undervoltage',
      category: 'phase',
      subsystem: 'Power Quality',
      phase: 'Y Phase',
      severity: 'medium',
      desc: 'Yellow Phase supply voltage dropped below the minimum operating limit.',
      threshold: `Min: ${sUv} V`,
      liveReading: `${yVolt} V`,
      icon: FiZap,
      troubleshoot: [
        'Check incoming Yellow phase wiring and fuse/circuit breaker.',
        'Inspect contactor supply terminals for voltage drop under load.',
      ],
    },
    {
      code: 'F_BOV',
      name: 'B-Phase Overvoltage',
      category: 'phase',
      subsystem: 'Power Quality',
      phase: 'B Phase',
      severity: 'high',
      desc: 'Blue Phase supply voltage has exceeded the maximum safe limit.',
      threshold: `Max: ${sOv} V`,
      liveReading: `${bVolt} V`,
      icon: FiZap,
      troubleshoot: [
        'Verify utility voltage surge protection and transformer output.',
        'Inspect incoming main breaker for balanced phase supply.',
      ],
    },
    {
      code: 'F_BUV',
      name: 'B-Phase Undervoltage',
      category: 'phase',
      subsystem: 'Power Quality',
      phase: 'B Phase',
      severity: 'medium',
      desc: 'Blue Phase supply voltage dropped below the minimum operating limit.',
      threshold: `Min: ${sUv} V`,
      liveReading: `${bVolt} V`,
      icon: FiZap,
      troubleshoot: [
        'Check utility supply lines for phase imbalance or blown fuse.',
        'Verify that heavy single-phase loads are not pulling down Blue phase.',
      ],
    },
  ], [rVolt, yVolt, bVolt, sOv, sUv]);

  const systemFaults = useMemo(() => {
    const list = [
      {
        code: 'F_FR',
        name: 'Fire / Smoke Hazard',
        category: 'system',
        subsystem: 'Safety Interlock',
        severity: 'critical',
        desc: 'Emergency fire or smoke sensor triggered. All AC units forced OFF immediately.',
        threshold: 'Digital Trigger = 1',
        liveReading: isFault('F_FR') ? 'TRIGGERED (1)' : 'Clear (0)',
        icon: FiAlertOctagon,
        troubleshoot: [
          'IMMEDIATE ACTION: Inspect equipment shelter or server room for smoke/fire.',
          'If false alarm, check fire sensor contacts (NC/NO) and wiring integrity.',
          'Reset the physical fire alarm panel after verifying safe conditions.',
        ],
      },
      {
        code: 'F_SFL',
        name: 'Sensor Communication Failure',
        category: 'system',
        subsystem: 'Hardware Health',
        severity: 'high',
        desc: 'Room temperature sensor or internal probe communication failed or disconnected.',
        threshold: 'Signal Open / Short',
        liveReading: isFault('F_SFL') ? 'FAILED (1)' : 'Healthy (0)',
        icon: FiCpu,
        troubleshoot: [
          'Check temperature probe wiring connection to terminal block.',
          'Inspect probe cable for cuts, pinching, or moisture damage.',
          'Test probe resistance with multimeter or replace temperature sensor.',
        ],
      },
      {
        code: 'F_THI',
        name: 'High Room Temperature',
        category: 'system',
        subsystem: 'Environment',
        severity: 'high',
        desc: 'Shelter temperature exceeded safe operating limit. Thermal runaway risk.',
        threshold: `Limit: ${sHi} °C`,
        liveReading: roomTemp ? `${roomTemp} °C` : 'N/A',
        icon: FiThermometer,
        troubleshoot: [
          'Ensure all available AC units are commanded ON.',
          'Check for dirty air filters or clogged outdoor condenser fins.',
          'Verify shelter doors/windows are sealed and room insulation is intact.',
        ],
      },
      {
        code: 'F_TLO',
        name: 'Low Room Temperature',
        category: 'system',
        subsystem: 'Environment',
        severity: 'medium',
        desc: 'Shelter temperature dropped below low operating setpoint.',
        threshold: `Limit: ${sLo} °C`,
        liveReading: roomTemp ? `${roomTemp} °C` : 'N/A',
        icon: FiThermometer,
        troubleshoot: [
          'Verify cooling setpoints are not set unnecessarily low.',
          'Check if cooling units are stuck in continuous running mode.',
          'Ensure room heater / reheat cycle activates if installed.',
        ],
      },
    ];

    if (lphp) {
      list.push(
        {
          code: 'F_HP',
          name: 'High Refrigerant Pressure',
          category: 'system',
          subsystem: 'Refrigeration',
          severity: 'critical',
          desc: 'High pressure safety switch tripped on compressor discharge line.',
          threshold: 'HP Switch Open',
          liveReading: isFault('F_HP') ? 'TRIPPED (1)' : 'Normal (0)',
          icon: FiActivity,
          troubleshoot: [
            'Inspect outdoor condenser fan motor for failure or slow rotation.',
            'Wash and clear outdoor condenser coils of dirt, dust, and debris.',
            'Check for overcharged refrigerant or non-condensables in system.',
          ],
        },
        {
          code: 'F_LP',
          name: 'Low Refrigerant Pressure',
          category: 'system',
          subsystem: 'Refrigeration',
          severity: 'high',
          desc: 'Low suction pressure detected in refrigeration circuit (leak or loss).',
          threshold: 'LP Switch Open',
          liveReading: isFault('F_LP') ? 'TRIPPED (1)' : 'Normal (0)',
          icon: FiActivity,
          troubleshoot: [
            'Check system for refrigerant gas leaks using electronic leak detector.',
            'Inspect indoor evaporator coil for heavy frost/ice buildup.',
            'Verify indoor blower fan is running at full airflow speed.',
          ],
        }
      );
    }

    return list;
  }, [isFault, lphp, roomTemp, sHi, sLo]);

  // AC Equipment Load Faults (Loop 1 to nac)
  const equipmentFaults = useMemo(() => {
    const list = [];
    for (let i = 1; i <= nac; i++) {
      const current = parsed[`C_A${i}C`] ? (Number(parsed[`C_A${i}C`]) / 10).toFixed(1) : '0.0';
      const isRunning = parsed[`C_A${i}`] === 1;
      const sOl = parsed[`S_A${i}OL`] ? (Number(parsed[`S_A${i}OL`]) / 10).toFixed(1) : '15.0';
      const sUl = parsed[`S_A${i}UL`] ? (Number(parsed[`S_A${i}UL`]) / 10).toFixed(1) : '2.0';
      const hours = parsed[`C_A${i}H`] || 0;

      list.push({
        code: `F_A${i}OL`,
        name: `AC ${i} Overload`,
        category: 'equipment',
        subsystem: `AC Unit ${i}`,
        unitIndex: i,
        isRunning,
        runtimeHours: hours,
        severity: 'high',
        desc: `AC ${i} compressor current exceeded maximum overload threshold (${sOl} A).`,
        threshold: `Overload Limit: ${sOl} A`,
        liveReading: `${current} A`,
        icon: FiLayers,
        troubleshoot: [
          `Inspect AC ${i} compressor run capacitor for degradation or bulging.`,
          `Check supply voltage at AC ${i} contactor while compressor is loaded.`,
          `Inspect compressor motor windings for high resistance or ground short.`,
        ],
      });

      list.push({
        code: `F_A${i}UL`,
        name: `AC ${i} Underload`,
        category: 'equipment',
        subsystem: `AC Unit ${i}`,
        unitIndex: i,
        isRunning,
        runtimeHours: hours,
        severity: 'medium',
        desc: `AC ${i} current fell below minimum underload threshold (${sUl} A) while running.`,
        threshold: `Underload Limit: ${sUl} A`,
        liveReading: `${current} A`,
        icon: FiLayers,
        troubleshoot: [
          `Inspect AC ${i} blower motor belt for slippage, break, or detachment.`,
          `Check compressor contactor points for pitting or failed closure.`,
          `Verify AC ${i} compressor is actually drawing current or running unloaded.`,
        ],
      });
    }
    return list;
  }, [nac, parsed]);

  // Master list of all monitored checks
  const allMonitors = useMemo(() => [
    ...phaseFaults,
    ...systemFaults,
    ...equipmentFaults,
  ], [phaseFaults, systemFaults, equipmentFaults]);

  // Active faults (where isFault === true)
  const activeFaults = useMemo(() => {
    return allMonitors.filter((f) => isFault(f.code));
  }, [allMonitors, isFault]);

  const activeFaultCount = activeFaults.length;
  const totalMonitorsCount = allMonitors.length;
  const healthPercentage = totalMonitorsCount > 0
    ? Math.round(((totalMonitorsCount - activeFaultCount) / totalMonitorsCount) * 100)
    : 100;

  // Filtered list based on activeTab & searchQuery
  const filteredList = useMemo(() => {
    return allMonitors.filter((item) => {
      // Tab filter
      if (activeTab === 'active' && !isFault(item.code)) return false;
      if (activeTab === 'phase' && item.category !== 'phase') return false;
      if (activeTab === 'system' && item.category !== 'system') return false;
      if (activeTab === 'equipment' && item.category !== 'equipment') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.toLowerCase().includes(q);
        const matchesSubsystem = item.subsystem.toLowerCase().includes(q);
        const matchesDesc = item.desc.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesSubsystem || matchesDesc;
      }
      return true;
    });
  }, [allMonitors, activeTab, isFault, searchQuery]);

  // Count active AC units
  const runningAcCount = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= nac; i++) {
      if (parsed[`C_A${i}`] === 1) count++;
    }
    return count;
  }, [nac, parsed]);

  if (loading) {
    return (
      <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
        <DashboardLayout title="Faults & Diagnostics">
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <span className="spinner w-8 h-8 border-4 text-[#8BBFD5]" />
            <p className="text-sm font-medium text-[var(--color-secondary-text)]">
              Loading diagnostic telemetry…
            </p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout
        title="Faults & Diagnostics"
        subtitle="Real-time system health, electrical protection, and equipment fault status"
      >
        
        {/* ── Top Bar: Device Selector, Status & Refresh ───────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-3.5 sm:p-5 mb-5 transition-all">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* Target Device Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8BBFD5]/20 to-[#8BBFD5]/40 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0 border border-[#8BBFD5]/30 dark:border-slate-700">
                <FiCpu className="text-[#8BBFD5]" size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-secondary-text)] dark:text-slate-400">
                  Target Controller
                </p>
                {devices && devices.length > 1 ? (
                  <div className="relative inline-block max-w-full">
                    <select
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      aria-label="Select device"
                      className="font-mono font-bold text-sm sm:text-base text-[#263445] dark:text-white bg-transparent outline-none cursor-pointer pr-4 truncate block max-w-[180px] sm:max-w-[260px]"
                    >
                      {devices.map((d) => (
                        <option key={d.id || d.deviceId} value={d.deviceId} className="dark:bg-slate-900">
                          {d.deviceId}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="font-mono font-bold text-sm sm:text-base text-[#263445] dark:text-white truncate">
                    {deviceId || 'No controller connected'}
                  </p>
                )}
              </div>
            </div>

            {/* Status Pills & Action Button */}
            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                  hasData
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>{hasData ? 'Online / Streaming' : 'Offline'}</span>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing || !deviceId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#263445] dark:text-slate-200 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
                title="Refresh diagnostic data"
              >
                <FiRefreshCw className={`shrink-0 ${refreshing ? 'animate-spin text-[#8BBFD5]' : ''}`} size={14} />
                <span className="hidden sm:inline">{refreshing ? 'Syncing…' : 'Sync'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── High-Impact Status Hero Banner ──────────────────────────── */}
        {activeFaultCount === 0 ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 sm:p-5 mb-5 shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <FiShield size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-emerald-900 dark:text-emerald-300">
                      All Systems Operational
                    </h3>
                    <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[11px] font-bold">
                      0 Active Alarms
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-700/90 dark:text-slate-400 mt-0.5">
                    All electrical phases, safety interlocks, ambient temperatures, and compressor loads are operating within normal limits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-red-50 via-rose-50/60 to-white dark:from-red-950/30 dark:via-slate-900 dark:to-slate-900 border border-red-300 dark:border-red-800/60 rounded-xl p-4 sm:p-5 mb-5 shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30 animate-pulse">
                  <FiAlertTriangle size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-red-900 dark:text-red-300">
                      Attention Required: {activeFaultCount} Active Fault{activeFaultCount > 1 ? 's' : ''}
                    </h3>
                    <span className="badge bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 text-[11px] font-bold">
                      Critical Alert
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-red-700/90 dark:text-slate-400 mt-0.5">
                    Active anomalies detected on: {activeFaults.map((f) => f.name).join(', ')}. Immediate technician inspection recommended.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('active')}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/20 transition active:scale-95 shrink-0"
              >
                View Active Faults ({activeFaultCount})
              </button>
            </div>
          </div>
        )}

        {/* ── Diagnostic KPI Overview Cards (2-col / 4-col Responsive) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5 mb-5">
          
          {/* Health Index */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:shadow transition min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-secondary-text)] dark:text-slate-400 truncate">
                Health Status
              </span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeFaultCount === 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {activeFaultCount === 0 ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-[#263445] dark:text-white font-mono">
                {healthPercentage}%
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {activeFaultCount === 0 ? 'Optimal' : 'Degraded'}
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] truncate">
              {activeFaultCount === 0 ? 'All 100% checks passing' : `${activeFaultCount} active alarm(s)`}
            </div>
          </div>

          {/* Active Alarms Count */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:shadow transition min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-secondary-text)] dark:text-slate-400 truncate">
                Active Alarms
              </span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                activeFaultCount > 0
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                <FiAlertTriangle size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg sm:text-2xl font-bold tracking-tight font-mono ${
                activeFaultCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#263445] dark:text-white'
              }`}>
                {activeFaultCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                of {totalMonitorsCount} checks
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] truncate">
              {activeFaultCount === 0 ? 'Zero active issues' : 'Action required'}
            </div>
          </div>

          {/* Power Phase Grid Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:shadow transition min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-secondary-text)] dark:text-slate-400 truncate">
                Phase Voltages
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FiZap size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-[#263445] dark:text-white font-mono">
                {rVolt}
              </span>
              <span className="text-xs font-semibold text-slate-500">V (R Line)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] truncate">
              Y: <b className="text-slate-700 dark:text-slate-300">{yVolt}V</b> • B: <b className="text-slate-700 dark:text-slate-300">{bVolt}V</b>
            </div>
          </div>

          {/* Equipment Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-3 sm:p-4 shadow-sm hover:shadow transition min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[var(--color-secondary-text)] dark:text-slate-400 truncate">
                Equipment Load
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FiLayers size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-[#263445] dark:text-white font-mono">
                {nac}
              </span>
              <span className="text-xs font-semibold text-slate-500">AC Units</span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] text-[var(--color-secondary-text)] truncate">
              {runningAcCount} running • {nac * 2} load monitors
            </div>
          </div>

        </div>

        {/* ── Filter Tabs & Search Bar ─────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-3 sm:p-4 mb-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Filter Tabs (Horizontal scroll on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-[#8BBFD5] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>All Checks</span>
                <span className="text-[10px] opacity-80 font-mono">({allMonitors.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeFaultCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>Active Alarms</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeFaultCount > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'opacity-80'
                }`}>
                  {activeFaultCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('phase')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'phase'
                    ? 'bg-[#8BBFD5] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FiZap size={13} />
                <span>Phase Power</span>
                <span className="text-[10px] opacity-80 font-mono">({phaseFaults.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('system')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'system'
                    ? 'bg-[#8BBFD5] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FiShield size={13} />
                <span>Safety & System</span>
                <span className="text-[10px] opacity-80 font-mono">({systemFaults.length})</span>
              </button>

              {nac > 0 && (
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                    activeTab === 'equipment'
                      ? 'bg-[#8BBFD5] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FiLayers size={13} />
                  <span>AC Equipment</span>
                  <span className="text-[10px] opacity-80 font-mono">({equipmentFaults.length})</span>
                </button>
              )}

            </div>

            {/* Instant Search Bar */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagnostics..."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-[var(--color-border)] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-[#263445] dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#8BBFD5] transition"
              />
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <FiX size={13} />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Main Diagnostics Grid ───────────────────────────────────── */}
        {filteredList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-8 sm:p-12 text-center shadow-sm">
            <FiCheckCircle size={36} className="mx-auto text-emerald-500 mb-3" />
            <h3 className="text-base font-bold text-[#263445] dark:text-white">
              {activeTab === 'active' ? 'No Active Faults Found' : 'No Matching Checks'}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-secondary-text)] mt-1 max-w-md mx-auto">
              {activeTab === 'active'
                ? 'Great news! All monitored parameters are healthy and running within configured safety thresholds.'
                : 'Try adjusting your search query or switch back to the "All Checks" filter tab.'}
            </p>
            {activeTab !== 'all' && (
              <button
                onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                className="mt-4 px-4 py-2 rounded-lg bg-[#8BBFD5] text-white text-xs font-bold hover:bg-[#78AEC6] transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 mb-6">
            {filteredList.map((item) => {
              const active = isFault(item.code);
              const Icon = item.icon;

              return (
                <div
                  key={item.code}
                  onClick={() => setSelectedFault(item)}
                  className={`group relative bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between overflow-hidden ${
                    active
                      ? 'border-red-400 dark:border-red-800/80 ring-1 ring-red-400/30'
                      : 'border-[var(--color-border)] dark:border-slate-800 hover:border-[#8BBFD5]'
                  }`}
                >
                  {/* Color-coded accent stripe */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 transition ${
                      active ? 'bg-red-500' : 'bg-emerald-500/40 group-hover:bg-[#8BBFD5]'
                    }`}
                  />

                  <div>
                    {/* Header: Title, Subsystem, and Status Badge */}
                    <div className="flex items-start justify-between gap-2 pl-2 mb-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition ${
                            active
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-[#8BBFD5]/20 group-hover:text-[#263445] dark:group-hover:text-white'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#263445] dark:text-white truncate leading-snug">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono text-[var(--color-secondary-text)] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {item.code}
                            </span>
                            <span className="text-[10px] text-[var(--color-secondary-text)]">
                              • {item.subsystem}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          active
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}
                        />
                        {active ? 'FAULT' : 'NORMAL'}
                      </span>
                    </div>

                    {/* Human description */}
                    <p className="text-xs text-[var(--color-secondary-text)] dark:text-slate-400 pl-2 mb-3 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>

                  {/* Footer telemetry value and trigger threshold */}
                  <div className="pl-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-[var(--color-secondary-text)]">
                      <span>Value: </span>
                      <b className={`font-mono ${active ? 'text-red-600 dark:text-red-400' : 'text-[#263445] dark:text-slate-200'}`}>
                        {item.liveReading}
                      </b>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-secondary-text)] bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                      {item.threshold}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* ── AC Units Equipment Summary Panel ────────────────────────── */}
        {nac > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-4 sm:p-5 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--color-border)] dark:border-slate-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#263445] dark:text-white flex items-center gap-2">
                  <FiLayers className="text-[#8BBFD5]" size={16} />
                  Equipment Protection Overview
                </h3>
                <p className="text-xs text-[var(--color-secondary-text)] mt-0.5">
                  Motor load thresholds and operational state for all {nac} configured air conditioner units
                </p>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-[var(--color-light-blue-bg)] dark:bg-slate-800 text-[#263445] dark:text-slate-300 w-fit">
                D_NAC = {nac} Units
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: nac }).map((_, idx) => {
                const i = idx + 1;
                const isRunning = parsed[`C_A${i}`] === 1;
                const current = parsed[`C_A${i}C`] ? (Number(parsed[`C_A${i}C`]) / 10).toFixed(1) : '0.0';
                const hours = parsed[`C_A${i}H`] || 0;
                const isOverload = isFault(`F_A${i}OL`);
                const isUnderload = isFault(`F_A${i}UL`);
                const sOl = parsed[`S_A${i}OL`] ? (Number(parsed[`S_A${i}OL`]) / 10).toFixed(1) : '15.0';
                const sUl = parsed[`S_A${i}UL`] ? (Number(parsed[`S_A${i}UL`]) / 10).toFixed(1) : '2.0';

                return (
                  <div
                    key={i}
                    className="p-3.5 rounded-lg border border-[var(--color-border)] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        <span className="font-bold text-sm text-[#263445] dark:text-white">
                          AC Unit {i}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isRunning
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {isRunning ? `RUNNING (${current}A)` : 'STANDBY'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[var(--color-secondary-text)]">
                      <div className="flex items-center justify-between">
                        <span>Overload (F_A{i}OL):</span>
                        <span className={`font-mono font-bold ${isOverload ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isOverload ? 'FAULT' : 'CLEAR'} ({sOl}A)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Underload (F_A{i}UL):</span>
                        <span className={`font-mono font-bold ${isUnderload ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isUnderload ? 'FAULT' : 'CLEAR'} ({sUl}A)
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                        <span>Runtime:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{hours} Hours</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Interactive Troubleshooting Detail Modal ─────────────────── */}
        {selectedFault && (
          <Modal
            title={`Diagnostic: ${selectedFault.name}`}
            onClose={() => setSelectedFault(null)}
            headerColor={isFault(selectedFault.code) ? 'red' : 'blue'}
          >
            <div className="p-5 space-y-4">
              
              {/* Status Header Chip */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-[var(--color-border)] dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isFault(selectedFault.code) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs text-[var(--color-secondary-text)]">System Condition</span>
                    <p className="text-sm font-bold text-[#263445] dark:text-white">
                      {isFault(selectedFault.code) ? 'FAULT TRIGGERED' : 'NORMAL / ALL CLEAR'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[var(--color-secondary-text)]">Parameter Code</span>
                  <p className="font-mono font-bold text-sm text-[#263445] dark:text-white">
                    {selectedFault.code}
                  </p>
                </div>
              </div>

              {/* Live Reading vs Threshold */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-[var(--color-border)] dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[var(--color-secondary-text)]">Live Telemetry</span>
                  <p className="font-mono font-bold text-base text-[#263445] dark:text-white mt-0.5">
                    {selectedFault.liveReading}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-[var(--color-border)] dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[var(--color-secondary-text)]">Configured Threshold</span>
                  <p className="font-mono font-bold text-base text-[#263445] dark:text-white mt-0.5">
                    {selectedFault.threshold}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-text)] mb-1">
                  Condition Description
                </h4>
                <p className="text-sm text-[#263445] dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {selectedFault.desc}
                </p>
              </div>

              {/* Step-by-Step Troubleshooting Actions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary-text)] mb-2 flex items-center gap-1.5">
                  <FiInfo size={14} className="text-[#8BBFD5]" />
                  Recommended Troubleshooting Steps
                </h4>
                <ul className="space-y-2">
                  {selectedFault.troubleshoot.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#8BBFD5]/20 text-[#263445] dark:text-[#8BBFD5] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedFault(null)}
                  className="w-full py-2.5 rounded-lg bg-[#8BBFD5] hover:bg-[#78AEC6] text-white font-bold text-sm transition shadow-sm"
                >
                  Close Diagnostic
                </button>
              </div>

            </div>
          </Modal>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  );
}
