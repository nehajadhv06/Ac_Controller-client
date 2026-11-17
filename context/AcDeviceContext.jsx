"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import { toast } from 'react-toastify';
import { parseFD } from '../utils/parseFd';
import { getSession } from '../lib/auth';

const AcDeviceContext = createContext(null);

const PENDING_TD_KEY = 'pending_td_';
const PENDING_TD_TIME_KEY = 'pending_td_time_';
const SELECTED_DEVICE_KEY = 'ac_selected_device';

const POLL_INTERVAL_MS = 2000;
const PENDING_HARD_TIMEOUT_MS = 120_000;   // 2 min safety net

function tdMatchesFd(sentTdString, rawFdParsed) {
  const tdParsed = parseFD(sentTdString);
  const keys = Object.keys(tdParsed).filter(
    (k) => k.startsWith('S_') || k.startsWith('C_') || k.startsWith('F_')
  );
  if (keys.length === 0) return true;

  for (const key of keys) {
    const sentVal = Number(tdParsed[key]);
    const recvVal = Number(rawFdParsed[key]);
    if (Number.isNaN(sentVal)) continue;
    if (Number.isNaN(recvVal) || sentVal !== recvVal) {
      return false;
    }
  }
  return true;
}

export function AcDeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState('');
  const [parsed, setParsed] = useState({});
  const [lastFdString, setLastFdString] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSentPayload, setLastSentPayload] = useState(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const [backendRetryCount, setBackendRetryCount] = useState(0);
  const [backendWaiting, setBackendWaiting] = useState(false);

  const pollRef = useRef(null);
  const lastSentPayloadRef = useRef(lastSentPayload);
  const deviceIdRef = useRef(deviceId); // ✅ Added ref to prevent stale polling

  useEffect(() => {
    lastSentPayloadRef.current = lastSentPayload;
    deviceIdRef.current = deviceId;
  }, [lastSentPayload, deviceId]);

  const clearPendingState = useCallback((devId) => {
    if (!devId) return;
    localStorage.removeItem(`${PENDING_TD_KEY}${devId}`);
    localStorage.removeItem(`${PENDING_TD_TIME_KEY}${devId}`);
  }, []);

  const savePendingState = useCallback((devId, payload) => {
    if (!devId || !payload) return;
    localStorage.setItem(`${PENDING_TD_KEY}${devId}`, payload);
    localStorage.setItem(`${PENDING_TD_TIME_KEY}${devId}`, Date.now().toString());
  }, []);

  const loadPendingState = useCallback((devId) => {
    if (!devId) return null;
    const payload = localStorage.getItem(`${PENDING_TD_KEY}${devId}`);
    const ts = localStorage.getItem(`${PENDING_TD_TIME_KEY}${devId}`);
    if (!payload || !ts) return null;
    return { payload, ts: Number(ts) };
  }, []);

  function getSafeParsed(rawParsed) {
    const commonKeys = [
      'C_RV', 'C_YV', 'C_BV', 'C_TM', 'C_BL',
      'S_HI', 'S_HIHY', 'S_LO', 'S_LOHY', 'S_OV', 'S_UV', 'S_BL', 'S_RBL',
      'S_ROFP', 'S_ROFM', 'S_YOFP', 'S_YOFM', 'S_BOFP', 'S_BOFM', 'S_TOFP', 'S_TOFM',
      'S_VPR', 'S_CPR', 'S_RRH', 'S_IOTT',
      'D_NAC', 'D_1P3P', 'D_LPHP',
      'F_ROV', 'F_YOV', 'F_BOV', 'F_RUV', 'F_YUV', 'F_BUV',
      'F_FR', 'F_SFL', 'F_THI', 'F_TLO', 'F_HP', 'F_LP',
    ];
    const safeObj = { ...rawParsed };
    commonKeys.forEach((key) => {
      if (safeObj[key] === undefined || safeObj[key] === null) safeObj[key] = 0;
    });
    const nac = Number(rawParsed['D_NAC']) || 0;
    for (let i = 1; i <= nac; i++) {
      const acKeys = [
        `C_A${i}`, `C_A${i}C`, `C_A${i}H`,
        `S_A${i}`, `S_A${i}N`, `S_A${i}D`, `S_A${i}H`,
        `S_A${i}UL`, `S_A${i}OL`, `S_A${i}SFN`, `S_A${i}SFF`,
        `F_A${i}OL`, `F_A${i}UL`,
      ];
      acKeys.forEach((k) => {
        if (safeObj[k] === undefined || safeObj[k] === null) safeObj[k] = 0;
      });
    }
    Object.keys(safeObj).forEach((k) => {
      const m = k.match(/^[CSF]_A(\d+)/);
      if (m && Number(m[1]) > nac) delete safeObj[k];
    });
    return safeObj;
  }

  const fetchDevices = useCallback(async () => {
    if (!getSession()?.token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/api/user/devices');
      const list = Array.isArray(data) ? data : [];
      setDevices(list);
      if (list.length > 0) {
        const saved = localStorage.getItem(SELECTED_DEVICE_KEY);
        const validSaved = saved && list.some(d => d.deviceId === saved);
        setDeviceId(validSaved ? saved : list[0].deviceId);
      } else {
        setDeviceId('');
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  useEffect(() => {
    const onAuthChanged = () => {
      setDevices([]); setDeviceId(''); setParsed({}); setHasData(false);
      setLastFdString(null); setLastSentPayload(null);
      setBackendRetryCount(0); setBackendWaiting(false);
      setLoading(true); fetchDevices();
    };
    window.addEventListener('ac:auth-changed', onAuthChanged);
    return () => window.removeEventListener('ac:auth-changed', onAuthChanged);
  }, [fetchDevices]);

  useEffect(() => {
    if (deviceId) localStorage.setItem(SELECTED_DEVICE_KEY, deviceId);
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;
    const saved = loadPendingState(deviceId);
    setLastSentPayload(saved ? saved.payload : null);
    setBackendRetryCount(0);
    setBackendWaiting(false);
  }, [deviceId, loadPendingState]);
  const fetchFd = useCallback(async () => {
    if (!deviceId) return;
    const reqDevice = deviceId;

    try {
      const { data } = await api.get(`/api/ac/${reqDevice}/latest`);
      if (deviceIdRef.current !== reqDevice) return;

      if (typeof data.retryCount === 'number') setBackendRetryCount(data.retryCount);
      if (typeof data.waitingForConfirmation === 'boolean') setBackendWaiting(data.waitingForConfirmation);

      const pending = lastSentPayloadRef.current;

      if (pending) {
        const saved = loadPendingState(reqDevice);
        if (saved && Date.now() - saved.ts > PENDING_HARD_TIMEOUT_MS) {
          toast.error("❌ Setpoint confirmation timed out. Please retry.");
          setLastSentPayload(null);
          clearPendingState(reqDevice);
          setBackendWaiting(false);
          return;
        }
      }

      if (data.hasData && data.fdString) {
        // ✅ ONLY process if the string is actually new
        if (data.fdString !== lastFdString) {
          const p = parseFD(data.fdString);
          p['SR_2-9AC'] = reqDevice;

          const safeData = getSafeParsed(p);
          setParsed(safeData);
          setHasData(true);
          setLastFdString(data.fdString);

          // ✅ Use the actual database timestamp
          const dbTimestamp = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
          
          window.dispatchEvent(new CustomEvent('new-fd-data', { 
            detail: { parsed: safeData, timestamp: dbTimestamp } 
          }));
        }

        if (pending) {
          const p = parseFD(data.fdString);
          if (tdMatchesFd(pending, p)) {
            toast.success("✅ Setpoints confirmed by hardware!");
            setLastSentPayload(null);
            clearPendingState(reqDevice);
            setJustConfirmed(true);
            setTimeout(() => setJustConfirmed(false), 1500);
            return;
          }
          if (data.waitingForConfirmation === false) {
            toast.warning("Setpoints not confirmed by hardware. Last changes are synchronized!");
            setLastSentPayload(null);
            clearPendingState(reqDevice);
            return;
          }
        }
      } else {
        setHasData(false);
        setParsed(prev => getSafeParsed({
          D_NAC: prev.D_NAC || 0,
          D_1P3P: prev.D_1P3P || 0,
          D_LPHP: prev.D_LPHP || 0,
        }));
        setLastFdString(null);
      }
    } catch (err) {
      if (deviceIdRef.current !== reqDevice) return;
      console.error("FD poll failed", err);
      setHasData(false);
      setParsed(getSafeParsed({}));
      setLastFdString(null);
    }
  }, [deviceId, clearPendingState, loadPendingState, lastFdString]);
  useEffect(() => {
    if (!deviceId) return;
    fetchFd();
    pollRef.current = setInterval(fetchFd, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [deviceId, fetchFd]);

  // ✅ THE FIX: Only send keys provided in `overrides`
  const sendSetpoints = useCallback(async (overrides = {}) => {
    if (!deviceId) { toast.error("No device selected"); return false; }
    setSaving(true);
    try {
      const nac = Number(parsed['D_NAC']) || 0;
      const pairs = [];

      // Iterate over OVERRIDES, not the whole parsed object
      Object.keys(overrides).forEach((k) => {
        if (!k.startsWith('S_')) return;
        if (overrides[k] === undefined || overrides[k] === null) return;
        
        // Filter out AC channels that don't exist
        if (/^S_A(\d+)/.test(k)) {
          const idx = Number(k.match(/^S_A(\d+)/)[1]);
          if (idx < 1 || idx > nac) return;
        }
        pairs.push(`${k}:${overrides[k]}`);
      });

      if (pairs.length === 0) {
        toast.info("No setpoints to send.");
        return false;
      }

      const tdString = `{${deviceId},${pairs.join(',')}}`.replace(/\s/g, '');
      console.log("📤 Sending TD:", tdString, `(D_NAC=${nac})`);

      await api.post(`/api/ac/${deviceId}/setpoints`, { tdString });

      setLastSentPayload(tdString);
      savePendingState(deviceId, tdString);
      setBackendRetryCount(0);
      setBackendWaiting(true);
      toast.info("Setpoint sent! Waiting for hardware confirmation...");
      return true;
    } catch (err) {
      console.error("TD send failed", err);
      toast.error("Failed to send setpoints");
      return false;
    } finally {
      setSaving(false);
    }
  }, [deviceId, parsed, savePendingState]);

  const isWaitingForConfirmation = lastSentPayload !== null;

  // ✅ Moved value DOWN so sendSetpoints is fully defined first
  const value = {
    devices, deviceId, setDeviceId,
    parsed, lastFdString, hasData, loading, saving,
    lastSentPayload, isWaitingForConfirmation,
    backendRetryCount, backendWaiting, justConfirmed,
    sendSetpoints, refreshFd: fetchFd, refreshDevices: fetchDevices,
  };

  return (
    <AcDeviceContext.Provider value={value}>
      {children}
    </AcDeviceContext.Provider>
  );
}

export function useAcDeviceContext() {
  const ctx = useContext(AcDeviceContext);
  if (!ctx) throw new Error('useAcDeviceContext must be used inside <AcDeviceProvider>');
  return ctx;
}