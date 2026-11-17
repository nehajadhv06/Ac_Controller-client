import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-light-blue-bg)] dark:bg-[#0b1120] px-4">
      <h1 className="text-6xl font-extrabold text-red-600 mb-4">403</h1>
      <h2 className="text-3xl font-bold text-[#263445] dark:text-white mb-4">Access Denied</h2>
      <p className="text-[var(--color-secondary-text)] dark:text-slate-400 mb-8 text-center max-w-md">
        You do not have the required permissions to view this page. Please contact your administrator.
      </p>
      <Link
        href="/login"
        className="btn-primary px-6 py-3"
      >
        Return to Login
      </Link>
    </div>
  );
}