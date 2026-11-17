// lib/auth.js
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';
const ROLE_KEY = 'role';
const store = () => (typeof window !== 'undefined' ? window.sessionStorage : null);

const fireAuthChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('ac:auth-changed'));
  }
};

export const setSession = (data) => {
  const s = store();
  if (!s) return;
  s.setItem(TOKEN_KEY, data.accessToken);
  s.setItem(USER_KEY, JSON.stringify(data.user));
  s.setItem(ROLE_KEY, data.user.role);
  notifySameRoleTabs(data.user.role, 'login');
  fireAuthChanged();
};

export const getSession = () => {
  const s = store();
  if (!s) return null;
  const token = s.getItem(TOKEN_KEY);
  const userStr = s.getItem(USER_KEY);
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) };
  } catch {
    return null;
  }
};

export const clearSession = () => {
  const s = store();
  if (!s) return;
  const role = s.getItem(ROLE_KEY);
  s.removeItem(TOKEN_KEY);
  s.removeItem(USER_KEY);
  s.removeItem(ROLE_KEY);
  if (role) notifySameRoleTabs(role, 'logout');
  fireAuthChanged();
};

const CHANNEL_PREFIX = 'ac_session_';
const channels = new Map();

function getChannel(role) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  const name = CHANNEL_PREFIX + role;
  if (channels.has(name)) return channels.get(name);
  const ch = new BroadcastChannel(name);
  channels.set(name, ch);
  return ch;
}

export function notifySameRoleTabs(role, event) {
  try { getChannel(role)?.postMessage({ type: event, role }); } catch (_) { }
}

export function subscribeSameRoleTabs(role, handler) {
  const ch = getChannel(role);
  if (!ch) return () => { };
  const fn = (ev) => { if (ev.data?.role === role) handler(ev.data); };
  ch.addEventListener('message', fn);
  return () => ch.removeEventListener('message', fn);
}