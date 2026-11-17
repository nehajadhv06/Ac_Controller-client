"use client";
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useAcDevice } from '../../hooks/useAcDevice';

export default function LiveMonitoringPage() {
  const {
    parsed,
    deviceId,
    saving,
    isWaitingForConfirmation,
    sendSetpoints,
    hasData,
    loading,
  } = useAcDevice();

  const [targetTemp, setTargetTemp] = useState(25.0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing || isWaitingForConfirmation) return;
    if (parsed['S_HI'] !== undefined) {
      setTargetTemp(parsed['S_HI'] / 10);
    }
  }, [parsed, isEditing, isWaitingForConfirmation]);

  const highSetpoint = 35.0;
  const lowSetpoint = 10.0;
  const hwTargetTemp = parsed['S_HI'] !== undefined ? parsed['S_HI'] / 10 : 25.0;
  const isDirty = Math.abs(targetTemp - hwTargetTemp) > 0.01;

  const handleIncrement = () => {
    if (targetTemp < highSetpoint) {
      setTargetTemp(prev => +(prev + 0.5).toFixed(1));
      setIsEditing(true);
    }
  };

  const handleDecrement = () => {
    if (targetTemp > lowSetpoint) {
      setTargetTemp(prev => +(prev - 0.5).toFixed(1));
      setIsEditing(true);
    }
  };

  const handlePushSetpoint = async () => {
    const ok = await sendSetpoints({ S_HI: Math.round(targetTemp * 10) });
    if (ok) setIsEditing(false);
  };

  const nac = parsed['D_NAC'] || 0;
  const currentRoomTemp = parsed['C_TM'] !== undefined ? (parsed['C_TM'] / 10).toFixed(1) : '0.0';
  const roomTemp = currentRoomTemp;
  const is3Phase = parsed['D_1P3P'] === 1;

  let totalCurrent = 0;
  for (let i = 1; i <= nac; i++) {
    if (parsed[`C_A${i}`] === 1) {
      totalCurrent += (parsed[`C_A${i}C`] || 0) / 10;
    }
  }

  const clampedTemp = Math.min(Math.max(parseFloat(currentRoomTemp), 0), 50);
  const dialPercentage = clampedTemp / 50;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - dialPercentage * circumference;

  if (loading && !hasData) {
    return (
      <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
        <DashboardLayout title="Live Monitoring">
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <span className="spinner w-10 h-10 border-4 text-[#8BBFD5] mb-4" />
            <p className="text-[var(--color-secondary-text)] font-medium">Waiting for hardware connection...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="Live Monitoring">

        {/* Top Status Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="font-bold text-[#263445] dark:text-white">Live Telemetry</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-[var(--color-light-blue-bg)] dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-[var(--color-border)] dark:border-slate-700">
            <span className="text-[var(--color-secondary-text)]">Device:</span>
            <span className="text-[#8BBFD5] font-bold">{deviceId}</span>
          </div>
        </div>

        {/* Room Temperature Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 p-6 flex justify-between items-center mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-light-blue-bg)] dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#263445] dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-secondary-text)]">Room temperature</p>
              <p className="text-xs text-[var(--color-secondary-text)] font-mono">(C_TM)</p>
            </div>
          </div>
          <div className="text-4xl font-mono font-bold text-[#263445] dark:text-white">
            {roomTemp} <span className="text-xl text-[var(--color-secondary-text)]">°C</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Temperature Dial */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-6 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-[#263445] dark:text-slate-300">Temperature Control</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-secondary-text)] bg-[var(--color-light-blue-bg)] dark:bg-slate-800 px-2 py-1 rounded">
                C_TM / S_HI
              </span>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r={radius}
                  fill="none"
                  className="stroke-[#8BBFD5] transition-all duration-1000 ease-out"
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>

              <div className="absolute inset-4 rounded-full bg-[var(--color-light-blue-bg)] dark:bg-slate-900/50 flex flex-col items-center justify-center border border-[var(--color-border)] dark:border-slate-800/50 shadow-inner">
                <span className="text-[10px] font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Current Room</span>
                <div className="flex items-start">
                  <span className="text-5xl font-extrabold text-[#263445] dark:text-white font-mono tracking-tighter">{currentRoomTemp}</span>
                  <span className="text-xl text-[var(--color-secondary-text)] mt-2 ml-1 font-sans">°C</span>
                </div>
                <div className="flex flex-col items-center gap-1 mt-2">
                  <div className="px-3 py-1 bg-[#E8F0FE] dark:bg-blue-900/20 text-[#263445] dark:text-blue-300 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5">
                    ⚡ Target: {targetTemp.toFixed(1)}°C
                  </div>
                  <div className="text-[9px] text-[var(--color-secondary-text)] font-mono">
                    Min: {lowSetpoint.toFixed(1)} / Max: {highSetpoint.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 w-full">
              <button
                onClick={handleDecrement}
                disabled={targetTemp <= lowSetpoint || isWaitingForConfirmation}
                className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] dark:border-slate-700 flex items-center justify-center text-[#263445] dark:text-slate-400 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 hover:border-[#8BBFD5] transition active:scale-95 shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>

              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-[#263445] dark:text-white font-mono">{targetTemp.toFixed(1)}°</span>
                <span className="text-[10px] text-[var(--color-secondary-text)] uppercase tracking-wider font-semibold">Setpoint</span>
              </div>

              <button
                onClick={handleIncrement}
                disabled={targetTemp >= highSetpoint || isWaitingForConfirmation}
                className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] dark:border-slate-700 flex items-center justify-center text-[#263445] dark:text-slate-400 hover:bg-[var(--color-light-blue-bg)] dark:hover:bg-slate-800 hover:border-[#8BBFD5] transition active:scale-95 shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <div className="w-full mt-6">
              <button
                onClick={handlePushSetpoint}
                disabled={!isDirty || saving || isWaitingForConfirmation}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                  ${isWaitingForConfirmation
                    ? 'bg-amber-500 text-white cursor-wait'
                    : isDirty
                      ? 'bg-[#8BBFD5] text-white hover:bg-[#78AEC6] shadow-md shadow-[#8BBFD5]/20'
                      : 'bg-slate-100 text-[var(--color-secondary-text)] dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                  }`}
              >
                {saving ? (
                  <><span className="spinner w-4 h-4 border-white" /> Sending String...</>
                ) : isWaitingForConfirmation ? (
                  <><span className="spinner w-4 h-4 border-white" /> Waiting for Hardware...</>
                ) : isDirty ? (
                  <>Push Setpoint String</>
                ) : (
                  <>Synced with Device</>
                )}
              </button>
            </div>
          </div>

          {/* Load + Voltage */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-[#263445] dark:text-slate-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#8BBFD5]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Total Active Load
                </h3>
              </div>
              <div className="relative z-10 mt-6 flex items-end gap-2">
                <span className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[#8BBFD5] to-[#78AEC6] font-mono tracking-tighter">
                  {totalCurrent.toFixed(1)}
                </span>
                <span className="text-2xl text-[var(--color-secondary-text)] mb-2 font-semibold">A</span>
              </div>
              <div className="relative z-10 mt-4 flex items-center gap-2 text-xs font-semibold text-[var(--color-secondary-text)]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {Array.from({ length: nac }).filter((_, i) => parsed[`C_A${i + 1}`] === 1).length} Units Running
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-sm font-bold text-[#263445] dark:text-slate-300 mb-6">Phase Voltages</h3>
              <div className="space-y-5">
                <VoltageBar label="R Phase" value={parsed['C_RV'] || 0} color="bg-red-500" />
                {is3Phase && (
                  <>
                    <VoltageBar label="Y Phase" value={parsed['C_YV'] || 0} color="bg-amber-500" />
                    <VoltageBar label="B Phase" value={parsed['C_BV'] || 0} color="bg-[#8BBFD5]" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function VoltageBar({ label, value, color }) {
  const numericValue = Number(value) || 0;
  const percentage = Math.min((numericValue / 300) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xs font-bold text-[#263445] dark:text-slate-300">{label}</span>
        <span className="font-mono text-[#263445] dark:text-white font-bold text-sm">
          {numericValue.toFixed(1)} <span className="text-[10px] text-[var(--color-secondary-text)] font-normal">V</span>
        </span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}