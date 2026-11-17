"use client";
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import { useAcDevice } from '../../hooks/useAcDevice';

export default function FaultsPage() {
  const { parsed, loading } = useAcDevice();

  const nac = parsed['D_NAC'] || 0;
  const lphp = parsed['D_LPHP'] === 1;
  const isFault = (k) => parsed[k] === 1;

  if (loading) {
    return (
      <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
        <DashboardLayout title="Faults">
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <span className="spinner w-8 h-8 border-4 text-[#8BBFD5]" />
            <p className="text-sm text-[var(--color-secondary-text)]">Loading fault data…</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="Faults">

        <div className="mb-5">
          <p className="text-sm text-[var(--color-secondary-text)]">Current fault status &amp; controller fault history</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 mb-5">
          {/* Global Phase Faults */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm">
            <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)] dark:border-slate-800 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#263445] dark:text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Global Phase Faults
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-secondary-text)] bg-[var(--color-light-blue-bg)] dark:bg-slate-800 px-2 py-0.5 rounded">F_</span>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FaultRow label="R Overvoltage" code="F_ROV" active={isFault('F_ROV')} />
              <FaultRow label="R Undervoltage" code="F_RUV" active={isFault('F_RUV')} />
              <FaultRow label="Y Overvoltage" code="F_YOV" active={isFault('F_YOV')} />
              <FaultRow label="Y Undervoltage" code="F_YUV" active={isFault('F_YUV')} />
              <FaultRow label="B Overvoltage" code="F_BOV" active={isFault('F_BOV')} />
              <FaultRow label="B Undervoltage" code="F_BUV" active={isFault('F_BUV')} />
            </div>
          </div>

          {/* System Faults */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm">
            <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)] dark:border-slate-800 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#263445] dark:text-slate-300 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                System Faults
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-secondary-text)] bg-[var(--color-light-blue-bg)] dark:bg-slate-800 px-2 py-0.5 rounded">F_</span>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FaultRow label="Sensor Fail" code="F_SFL" active={isFault('F_SFL')} />
              <FaultRow label="Fire Fault" code="F_FR" active={isFault('F_FR')} />
              <FaultRow label="Low Temp" code="F_TLO" active={isFault('F_TLO')} />
              <FaultRow label="High Temp" code="F_THI" active={isFault('F_THI')} />
              {lphp && (
                <>
                  <FaultRow label="High Pressure" code="F_HP" active={isFault('F_HP')} />
                  <FaultRow label="Low Pressure" code="F_LP" active={isFault('F_LP')} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* AC Current Faults */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm mb-5">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#263445] dark:text-slate-300">
              AC Current Faults
              <span className="font-normal text-xs text-[var(--color-secondary-text)] ml-2">(Loop 1 to D_NAC = {nac})</span>
            </h3>
            <span className="text-[10px] font-semibold bg-[var(--color-light-blue-bg)] dark:bg-slate-800 px-2 py-1 rounded text-[var(--color-secondary-text)]">
              {nac} CONFIGURED UNITS
            </span>
          </div>

          {/* Mobile: card-based list */}
          <div className="md:hidden divide-y divide-[var(--color-border)] dark:divide-slate-800">
            {nac === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--color-secondary-text)]">
                Waiting for device to report AC count…
              </div>
            ) : (
              Array.from({ length: nac }).map((_, idx) => {
                const i = idx + 1;
                const overload = isFault(`F_A${i}OL`);
                const underload = isFault(`F_A${i}UL`);
                return (
                  <div key={i} className="px-4 py-3 hover:bg-[var(--color-light-blue-bg)]/50 dark:hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-3.5 h-3.5 text-[var(--color-secondary-text)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                      <span className="font-semibold text-sm text-[#263445] dark:text-slate-300">AC {i}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-[var(--color-secondary-text)] mb-1">Load Protection / High</p>
                        <FaultBadge label="Overload" code={`F_A${i}OL`} active={overload} />
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--color-secondary-text)] mb-1">Load Protection / Low</p>
                        <FaultBadge label="Underload" code={`F_A${i}UL`} active={underload} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[var(--color-secondary-text)] uppercase bg-[var(--color-light-blue-bg)]/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 font-bold tracking-wider">Equipment</th>
                  <th className="px-5 py-3 font-bold tracking-wider text-center">Load Protection / High</th>
                  <th className="px-5 py-3 font-bold tracking-wider text-center">Load Protection / Low</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] dark:divide-slate-800">
                {nac === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-[var(--color-secondary-text)]">
                      Waiting for device to report AC count…
                    </td>
                  </tr>
                ) : (
                  Array.from({ length: nac }).map((_, idx) => {
                    const i = idx + 1;
                    return (
                      <tr key={i} className="hover:bg-[var(--color-light-blue-bg)]/50 dark:hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4 font-semibold text-[#263445] dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-[var(--color-secondary-text)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                            AC {i}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <FaultRow label="Overload" code={`F_A${i}OL`} active={isFault(`F_A${i}OL`)} centered />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <FaultRow label="Underload" code={`F_A${i}UL`} active={isFault(`F_A${i}UL`)} centered />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-2.5 border-t border-[var(--color-border)] dark:border-slate-800 text-xs text-[var(--color-secondary-text)]">
            AC {nac + 1}–9 are dynamically hidden (D_NAC = {nac}).
          </div>
        </div>

      </DashboardLayout>
    </ProtectedRoute>
  );
}

function FaultRow({ label, code, active, centered }) {
  return (
    <div className={`flex items-center ${centered ? 'justify-center' : 'justify-between'} gap-2`}>
      {!centered && (
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-[#263445] dark:text-slate-300 text-sm truncate">{label}</span>
          <span className="text-[10px] font-mono text-[var(--color-secondary-text)]">({code})</span>
        </div>
      )}
      <FaultBadge label={label} code={code} active={active} />
    </div>
  );
}

function FaultBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap
      ${active
        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
      {active ? 'FAULT' : 'CLEAR'}
    </span>
  );
}