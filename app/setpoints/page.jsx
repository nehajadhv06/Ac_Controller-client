"use client";
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useAcDevice } from '../../hooks/useAcDevice';

export default function SetpointsPage() {
  const { parsed, loading, hasData, saving, isWaitingForConfirmation, sendSetpoints } = useAcDevice();
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  // State to track validation errors
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (isEditing || isWaitingForConfirmation) return;
    if (Object.keys(parsed).length > 0) setFormData(parsed);
  }, [parsed, isEditing, isWaitingForConfirmation]);

  const nac = parsed['D_NAC'] || 0;

  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    setIsEditing(true);
    
    // Clear the error for this specific field when the user types
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleSave = async () => {
    if (!isEditing) return;

    // Validate all fields before saving
    const errors = {};
    
    // Helper to check limits
    const checkLimit = (val, min, max, label) => {
      if (val === '' || val === undefined || val === null) return;
      const num = Number(val);
      if (min !== undefined && num < min) {
        errors[label] = `Value cannot be less than ${min}`;
      }
      if (max !== undefined && num > max) {
        errors[label] = `Value cannot exceed ${max}`;
      }
    };

    // Check Global Temp
    checkLimit(formData['S_HI'], 250, 600, 'S_HI');
    checkLimit(formData['S_HIHY'], 0, 100, 'S_HIHY');
    checkLimit(formData['S_LO'], 0, 250, 'S_LO');
    checkLimit(formData['S_LOHY'], 0, 100, 'S_LOHY');

    // Check Delays
    checkLimit(formData['S_OV'], 100, 500, 'S_OV');
    checkLimit(formData['S_UV'], 0, 400, 'S_UV');
    checkLimit(formData['S_BL'], 5, 600, 'S_BL');
    checkLimit(formData['S_RBL'], 20, 400, 'S_RBL');

    // Check Offsets
    ['S_ROFP', 'S_ROFM', 'S_YOFP', 'S_YOFM', 'S_BOFP', 'S_BOFM', 'S_TOFP', 'S_TOFM'].forEach(k => {
      checkLimit(formData[k], 0, 100, k);
    });

    // Check AC Settings
    for (let i = 1; i <= nac; i++) {
      checkLimit(formData[`S_A${i}N`], 0, 600, `S_A${i}N`);
      checkLimit(formData[`S_A${i}H`], 0, 100, `S_A${i}H`);
      checkLimit(formData[`S_A${i}UL`], 0, 100, `S_A${i}UL`);
      checkLimit(formData[`S_A${i}OL`], 20, 400, `S_A${i}OL`);
      checkLimit(formData[`S_A${i}SFN`], 5, 600, `S_A${i}SFN`);
      checkLimit(formData[`S_A${i}SFF`], 5, 600, `S_A${i}SFF`);
      checkLimit(formData[`S_A${i}D`], 10, 300, `S_A${i}D`);
    }

    // If there are errors, show them and STOP
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.warning("Please fix the highlighted errors before saving.");
      return;
    }

    // If no errors, proceed to save
    setValidationErrors({});
    const payload = { ...parsed };

    Object.keys(formData).forEach((key) => {
      if (!key.startsWith('S_')) return;
      const liveVal = parsed[key];
      const formVal = formData[key];
      const norm = (v) =>
        v === undefined || v === null || v === '' ? 0 : Number(v);
      if (norm(formVal) !== norm(liveVal)) {
        payload[key] = formVal;
      }
    });
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        payload[key] = 0;
      }
    });

    const ok = await sendSetpoints(payload);
    if (ok) setIsEditing(false);
  };

  if (loading && !hasData) {
    return (
      <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
        <DashboardLayout title="Setpoints & Configuration">
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <span className="spinner w-10 h-10 border-4 text-[#8BBFD5] mb-4"></span>
            <p className="text-[var(--color-secondary-text)] animate-pulse font-medium">Loading setpoints...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="Setpoints & Configuration">

        {!hasData && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-base font-semibold">
              Device is offline. Showing default zero values. Setpoints cannot be saved until the device reconnects.
            </span>
          </div>
        )}

        {isWaitingForConfirmation && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-xl flex items-center gap-3">
            <span className="spinner w-4 h-4 border-2 border-blue-500"></span>
            <span className="text-base font-semibold">Waiting for hardware confirmation...</span>
          </div>
        )}

        <div className="space-y-6">
          <Section title="Global Temperature" code="(S_)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputRow label="High Setpoint" code="S_HI" val={formData['S_HI']} onChange={handleChange} unit="°C" multiplier={0.1} min={250} max={600} error={validationErrors['S_HI']} />
              <InputRow label="High Hyst" code="S_HIHY" val={formData['S_HIHY']} onChange={handleChange} unit="°C" multiplier={0.1} min={0} max={100} error={validationErrors['S_HIHY']} />
              <InputRow label="Low Setpoint" code="S_LO" val={formData['S_LO']} onChange={handleChange} unit="°C" multiplier={0.1} min={0} max={250} error={validationErrors['S_LO']} />
              <InputRow label="Low Hyst" code="S_LOHY" val={formData['S_LOHY']} onChange={handleChange} unit="°C" multiplier={0.1} min={0} max={100} error={validationErrors['S_LOHY']} />
            </div>
          </Section>

          <Section title="Delay Menu" code="(S_)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputRow label="OV Trip" code="S_OV" val={formData['S_OV']} onChange={handleChange} unit="V" min={100} max={500} error={validationErrors['S_OV']} />
              <InputRow label="UV Trip" code="S_UV" val={formData['S_UV']} onChange={handleChange} unit="V" min={0} max={400} error={validationErrors['S_UV']} />
              <InputRow label="Cycle Time" code="S_BL" val={formData['S_BL']} onChange={handleChange} unit="min" min={5} max={600} error={validationErrors['S_BL']} />
              <InputRow label="Reload Cycle Time" code="S_RBL" val={formData['S_RBL']} onChange={handleChange} unit="min" min={20} max={400} error={validationErrors['S_RBL']} />
            </div>
          </Section>

          <Section title="Offset Settings" code="(S_)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputRow label="R Offset +" code="S_ROFP" val={formData['S_ROFP']} onChange={handleChange} unit="V" multiplier={0.1} min={0} max={100} error={validationErrors['S_ROFP']} />
              <InputRow label="R Offset -" code="S_ROFM" val={formData['S_ROFM']} onChange={handleChange} unit="V" multiplier={0.1} min={0} max={100} error={validationErrors['S_ROFM']} />
              <InputRow label="Y Offset +" code="S_YOFP" val={formData['S_YOFP']} onChange={handleChange} unit="V" multiplier={0.1} min={0} max={100} error={validationErrors['S_YOFP']} />
              <InputRow label="Y Offset -" code="S_YOFM" val={formData['S_YOFM']} onChange={handleChange} unit="V" multiplier={0.1} min={0} max={100} error={validationErrors['S_YOFM']} />
              <InputRow label="B Offset +" code="S_BOFP" val={formData['S_BOFP']} onChange={handleChange} unit="V" multiplier={0.1} min={0} max={100} error={validationErrors['S_BOFP']} />
              <InputRow label="B Offset -" code="S_BOFM" val={formData['S_BOFM']} onChange={handleChange} unit="V" multiplier={0.1} min={0} max={100} error={validationErrors['S_BOFM']} />
              <InputRow label="Temp Offset +" code="S_TOFP" val={formData['S_TOFP']} onChange={handleChange} unit="°C" multiplier={0.1} min={0} max={100} error={validationErrors['S_TOFP']} />
              <InputRow label="Temp Offset -" code="S_TOFM" val={formData['S_TOFM']} onChange={handleChange} unit="°C" multiplier={0.1} min={0} max={100} error={validationErrors['S_TOFM']} />
            </div>
          </Section>

          {nac > 0 ? (
            Array.from({ length: nac }).map((_, idx) => {
              const i = idx + 1;
              return (
                <Section key={i} title={`AC ${i} Settings`} code={`(Loop 1 to D_NAC)`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={formData[`S_A${i}`] === 1}
                        onChange={(e) => handleChange(`S_A${i}`, e.target.checked ? 1 : 0)}
                        className="w-5 h-5 text-[#8BBFD5] rounded border-[var(--color-border)] focus:ring-[#8BBFD5]"
                      />
                      <label className="text-base font-semibold text-[#263445] dark:text-slate-300">Enable AC {i}</label>
                    </div>
                    <InputRow label="ON Setpoint" code={`S_A${i}N`} val={formData[`S_A${i}N`]} onChange={handleChange} unit="A" multiplier={0.1} min={0} max={600} error={validationErrors[`S_A${i}N`]} />
                    <InputRow label="Hysteresis" code={`S_A${i}H`} val={formData[`S_A${i}H`]} onChange={handleChange} unit="A" multiplier={0.1} min={0} max={100} error={validationErrors[`S_A${i}H`]} />
                    <InputRow label={`AC${i} Underload`} code={`S_A${i}UL`} val={formData[`S_A${i}UL`]} onChange={handleChange} unit="A" multiplier={0.1} min={0} max={100} error={validationErrors[`S_A${i}UL`]} />
                    <InputRow label={`AC${i} Overload`} code={`S_A${i}OL`} val={formData[`S_A${i}OL`]} onChange={handleChange} unit="A" multiplier={0.1} min={20} max={400} error={validationErrors[`S_A${i}OL`]} />
                    <InputRow label="SF ON Time" code={`S_A${i}SFN`} val={formData[`S_A${i}SFN`]} onChange={handleChange} unit="min" min={5} max={600} error={validationErrors[`S_A${i}SFN`]} />
                    <InputRow label="SF OFF Time" code={`S_A${i}SFF`} val={formData[`S_A${i}SFF`]} onChange={handleChange} unit="min" min={5} max={600} error={validationErrors[`S_A${i}SFF`]} />
                    <InputRow label="Run Duration" code={`S_A${i}D`} val={formData[`S_A${i}D`]} onChange={handleChange} unit="s" min={10} max={300} error={validationErrors[`S_A${i}D`]} />
                  </div>
                </Section>
              );
            })
          ) : (
            <div className="p-6 text-center text-base text-[var(--color-secondary-text)] border border-[var(--color-border)] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
              Waiting for hardware to report AC count (D_NAC)...
            </div>
          )}

          <Section title="System Protection" code="">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border border-[var(--color-border)] dark:border-slate-700 rounded-lg">
                <span className="text-base font-semibold text-[#263445] dark:text-slate-300">Voltage Protection</span>
                <input
                  type="checkbox"
                  checked={formData['S_VPR'] === 1}
                  onChange={(e) => handleChange('S_VPR', e.target.checked ? 1 : 0)}
                  className="w-5 h-5 text-[#8BBFD5] rounded"
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-[var(--color-border)] dark:border-slate-700 rounded-lg">
                <span className="text-base font-semibold text-[#263445] dark:text-slate-300">Current Protection</span>
                <input
                  type="checkbox"
                  checked={formData['S_CPR'] === 1}
                  onChange={(e) => handleChange('S_CPR', e.target.checked ? 1 : 0)}
                  className="w-5 h-5 text-[#8BBFD5] rounded"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-[var(--color-secondary-text)] mb-1.5">Reset Run Hours</label>
                <select
                  value={formData['S_RRH'] || 0}
                  onChange={(e) => handleChange('S_RRH', Number(e.target.value))}
                  className="input-field py-2.5 text-base"
                >
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
              <InputRow label="IOTT" code="S_IOTT" val={formData['S_IOTT']} onChange={handleChange} unit="Min" />
            </div>
          </Section>
        </div>

        <div className="mt-8 flex justify-end pb-10">
          <button
            onClick={handleSave}
            disabled={saving || !hasData || isWaitingForConfirmation || !isEditing}
            className="btn-primary py-3.5 px-8 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><span className="spinner w-5 h-5 border-white mr-2" /> SENDING...</>
            ) : isWaitingForConfirmation ? (
              <><span className="spinner w-5 h-5 border-white mr-2" /> WAITING FOR HARDWARE...</>
            ) : !isEditing ? (
              'NO CHANGES TO SAVE'
            ) : (
              'SAVE SETPOINT'
            )}
          </button>
        </div>

      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Section({ title, code, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] dark:border-slate-800 bg-[var(--color-light-blue-bg)]/50 dark:bg-slate-800/50 flex items-center gap-2">
        <h3 className="text-lg font-bold text-[#263445] dark:text-slate-300">{title}</h3>
        {code && <span className="text-sm font-mono text-[var(--color-secondary-text)]">{code}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InputRow({ label, code, val, onChange, unit, multiplier = 1, min, max, error }) {
  const safeVal = (val === undefined || val === null || val === '') ? 0 : Number(val);

  let displayVal = '';
  if (!isNaN(safeVal)) {
    displayVal = (safeVal * multiplier).toFixed(multiplier === 0.1 ? 1 : 0);
  }

  const handleInput = (e) => {
    const rawInput = e.target.value;
    if (rawInput === '') {
      onChange(code, '');
      return;
    }
    const numVal = Number(rawInput);
    onChange(code, Math.round(numVal / multiplier));
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-baseline mb-1.5">
        <label className={`text-sm font-semibold ${error ? 'text-red-500' : 'text-[var(--color-secondary-text)] dark:text-slate-400'}`}>
          {label}
        </label>
        <span className="text-xs font-mono text-[var(--color-secondary-text)]">{code}</span>
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          value={displayVal}
          onChange={handleInput}
          className={`w-full px-3 py-2.5 rounded border font-mono text-base focus:outline-none focus:ring-1 transition-colors
            ${error 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 focus:ring-red-500' 
              : 'border-[var(--color-border)] dark:border-slate-700 bg-[var(--color-input-bg)] dark:bg-slate-900 text-[#263445] dark:text-slate-100 focus:ring-[#8BBFD5]'
            }
          `}
        />
        {unit && (
          <span className={`absolute right-3 text-sm pointer-events-none ${error ? 'text-red-500' : 'text-[var(--color-secondary-text)]'}`}>
            {unit}
          </span>
        )}
      </div>
      {/* Error message display */}
      {error && (
        <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}