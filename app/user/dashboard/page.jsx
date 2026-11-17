"use client";
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import DashboardLayout from '../../../components/ui/DashboardLayout';

export default function UserDashboard() {
  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="My Dashboard">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[var(--color-border)] dark:border-slate-800 p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-[#263445] dark:text-white mb-2">
            Welcome!
          </h2>
          <p className="text-[var(--color-secondary-text)] dark:text-slate-400">
            You are signed in. See your assigned AC devices under My Devices.
          </p>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}