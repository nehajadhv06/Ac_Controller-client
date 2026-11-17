"use client";
import { useEffect } from 'react';

function XIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function Modal({ title, onClose, children, headerColor = 'blue' }) {
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', fn);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const headerClasses = {
    blue: 'bg-gradient-to-r from-[#8BBFD5] to-[#78AEC6]',
    green: 'bg-gradient-to-r from-emerald-500 to-green-700',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-600',
    red: 'bg-gradient-to-r from-red-500 to-red-700',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="modal-enter w-full sm:max-w-lg bg-white dark:bg-slate-900
                   rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden
                   max-h-[92vh] sm:max-h-[88vh] flex flex-col
                   border border-transparent dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className={`${headerClasses[headerColor] || headerClasses.blue} px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0`}>
          <h2 className="text-white font-bold text-sm sm:text-base tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition active:scale-95"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}