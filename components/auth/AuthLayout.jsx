"use client";
import { useEffect, useState } from 'react';
import { getTheme, toggleTheme } from '../../lib/theme';
import Image from 'next/image';

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function AuthLayout({ children }) {
  const [theme, setThemeState] = useState('light');
  useEffect(() => setThemeState(getTheme()), []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[var(--color-light-blue-bg)] dark:bg-[#0b1120] transition-colors duration-300">

      {/* Theme toggle */}
      <button
        onClick={() => setThemeState(toggleTheme())}
        aria-label="Toggle theme"
        className="fixed top-4 right-4 z-20 w-10 h-10 rounded-full
                   bg-white dark:bg-slate-800 shadow-md
                   flex items-center justify-center
                   text-[var(--color-primary-text)] dark:text-slate-300
                   hover:bg-slate-50 dark:hover:bg-slate-700
                   border border-[var(--color-border)] dark:border-slate-700
                   transition active:scale-95"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
      <div
        className="flex flex-col md:flex-row w-full max-w-[920px]
                   h-auto md:h-[600px] md:max-h-[92vh]
                   bg-white dark:bg-[#0f1929]
                   rounded-2xl sm:rounded-3xl
                   shadow-2xl overflow-hidden
                   border border-[var(--color-border)] dark:border-slate-800
                   fade-in"
      >

        {/* ── Left panel (Reference Design) ──────────────────────── */}
        <div className="relative w-full md:w-[50%] overflow-hidden
                        bg-[#8BBFD5] dark:bg-[#1a3a4f]
                        p-6 sm:p-8 md:p-10 lg:p-12
                        flex flex-col justify-between
                        text-white min-h-[200px] md:min-h-0">

          {/* Decorative circles */}
          <div className="absolute -top-14 -left-14 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
          {/* Logo (Box removed, sized natively) */}
                   {/* Logo (Box removed, sized natively) */}
          <div className="relative z-10 flex items-center gap-4 shrink-0">
            <Image
             src="/images/logo.png"
              alt="Logo"
              width={150}
              height={50}
              style={{ width: 'auto', height: '40px' }}
            />
            {/* Flex column stacks the text nicely next to the logo */}
            <span className="flex flex-col text-sm sm:text-base font-bold text-white tracking-wide leading-tight">
              <span>PROTON POWER</span>
              <span>CONTROL</span>
            </span>
          </div>            
          {/* Tagline */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white/95 mb-2">
              Welcome!
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              SMART <br />
              MONITOR<br />
              CONTROL
            </h1>
          </div>

          {/* Bottom spacer for alignment */}
          <div className="relative z-10 h-4 hidden md:block" />
        </div>
        
        {/* ── Right panel ─────────────────────────────────────────── */}
        <div className="w-full md:w-[60%] bg-white dark:bg-[#0f1929]
                        flex items-center justify-center
                        overflow-y-auto">
          <div className="w-full max-w-sm mx-auto px-6 sm:px-8 lg:px-10 py-8 md:py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}