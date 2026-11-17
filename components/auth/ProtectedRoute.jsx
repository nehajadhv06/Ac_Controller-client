"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../lib/auth';
import api from '../../lib/api';

export default function ProtectedRoute({ children, allowedRole }) {
  const router = useRouter();
  const [state, setState] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const session = getSession();
      if (!session) {
        if (!cancelled) router.replace('/login');
        return;
      }

      const allowedClient = Array.isArray(allowedRole)
        ? allowedRole.includes(session.user.role)
        : allowedRole === session.user.role;

      if (!allowedClient) {
        if (!cancelled) router.replace('/unauthorized');
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        const allowedServer = Array.isArray(allowedRole)
          ? allowedRole.includes(data.role)
          : allowedRole === data.role;

        if (!allowedServer) {
          if (!cancelled) router.replace('/unauthorized');
          return;
        }
        if (!cancelled) setState('ok');
      } catch (err) {
        if (err.response?.status === 403 && !cancelled) {
          router.replace('/unauthorized');
        }
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [router, allowedRole]);

  if (state !== 'ok') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-light-blue-bg)] dark:bg-[#0b1120]">
        <div className="text-sm font-medium text-[var(--color-secondary-text)] dark:text-slate-400">
          Verifying access…
        </div>
      </div>
    );
  }
  return children;
}