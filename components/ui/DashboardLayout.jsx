"use client";
import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function DashboardLayout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[var(--color-light-blue-bg)] dark:bg-[#0b1120] text-[var(--color-primary-text)] dark:text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <div className="w-full max-w-[1600px] mx-auto fade-in">
            {title && (
              <div className="mb-6 sm:mb-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#263445] dark:text-white tracking-tight leading-tight">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="mt-1 text-sm text-[var(--color-secondary-text)] dark:text-slate-400">{subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-0.5 w-12 bg-[#8BBFD5] rounded-full" />
                  <div className="h-0.5 w-4 bg-[#8BBFD5]/50 rounded-full" />
                  <div className="h-0.5 w-2 bg-[#8BBFD5]/30 rounded-full" />
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}