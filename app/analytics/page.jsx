"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import DashboardLayout from '../../components/ui/DashboardLayout';
import dynamic from 'next/dynamic';
import { useAcDevice } from '../../hooks/useAcDevice';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '../../lib/api';
import { parseFD } from '../../utils/parseFd';
import {
  FiClock,
  FiCpu,
  FiCalendar,
  FiZap,
  FiActivity,
  FiChevronDown,
  FiRadio,
} from 'react-icons/fi';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const downsampleData = (data, maxPoints = 500) => {
  if (data.length <= maxPoints) return data;
  const factor = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % factor === 0 || i === data.length - 1);
};

const getXAxisConfig = (selectedRange) => {
  const wide = selectedRange === "WEEKLY" || selectedRange === "PREVIOUS_MONTH";
  if (wide) {
    return {
      datetimeFormatter: { month: "MMM 'yy", day: "dd MMM", hour: "dd MMM HH:mm" },
    };
  }
  return {
    datetimeFormatter: { hour: "HH:mm", minute: "HH:mm:ss" },
  };
};

export default function AnalyticsPage() {
  const {
    deviceId,
    setDeviceId,
    devices,
    lastFdString,
    parsed: liveParsed,
    hasData,
  } = useAcDevice();

  // ── State ────────────────────────────────────────────────────────────────
  const [tempData , setTempData] = useState([]);
  const [voltageRData, setVoltageRData] = useState([]);
  const [voltageYData, setVoltageYData] = useState([]);
  const [voltageBData, setVoltageBData] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // ── Filters / UI ─────────────────────────────────────────────────────────
  const [live, setLive] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedRange, setSelectedRange] = useState("live");
  const [theme, setTheme] = useState('light');

  // ── Refs ─────────────────────────────────────────────────────────────────
  const lastProcessedTimestampRef = useRef(null);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const parseMetrics = useCallback((fdString) => {
    if (!fdString) return {tempData:0, voltageR: 0, voltageY: 0, voltageB: 0, current: 0 };
    const parsed = parseFD(fdString);
    return {
      tempData:parsed['C_TM'] !== undefined? Number (parsed['C_TM']):0,
      voltageR: parsed['C_RV'] !== undefined ? Number(parsed['C_RV']) : 0,
      voltageY: parsed['C_YV'] !== undefined ? Number(parsed['C_YV']) : 0,
      voltageB: parsed['C_BV'] !== undefined ? Number(parsed['C_BV']) : 0,
      current: parsed['C_A1C'] !== undefined ? Number(parsed['C_A1C']) / 10 : 0
    };
  }, []);

  const getTimeLabel = (timestamp) => dayjs(timestamp).format("HH:mm:ss");

  // Theme tracker
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');

    const observer = new MutationObserver(() => {
      const darkNow = document.documentElement.classList.contains('dark');
      setTheme(darkNow ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Fetch Historical Data
  // ─────────────────────────────────────────────────────────────────────────
  const fetchHistoryForRange = useCallback(async (start, end) => {
    if (!deviceId) {
      toast.error("Please select a device first");
      return;
    }
    setLoadingHistory(true);

    try {
      const { data } = await api.get(`/api/ac/${deviceId}/history`);
      let history = Array.isArray(data) ? data : [];

      history = history.filter((h) => {
        const ts = dayjs(h.timestamp);
        return (
          (ts.isAfter(start) || ts.isSame(start, "minute")) &&
          (ts.isBefore(end) || ts.isSame(end, "minute"))
        );
      });

      if (history.length === 0) {
        toast.info("No data available for this range");
        setTempData([]);
        setVoltageRData([]);
        setVoltageYData([]);
        setVoltageBData([]);
        setCurrentData([]);
        return;
      }

      let processed = history.map(entry => {
        const timestamp = new Date(entry.timestamp).getTime();
        const { tempData,voltageR, voltageY, voltageB, current } = parseMetrics(entry.fdString);
        return { time: getTimeLabel(timestamp), tempData,voltageR, voltageY, voltageB, current, timestamp };
      });

      processed.sort((a, b) => a.timestamp - b.timestamp);
      const downsampled = downsampleData(processed, 500);
       const tCArr = downsampled.map(p => ({ time: p.time, value: p.tempData, timestamp: p.timestamp }));
      const vRArr = downsampled.map(p => ({ time: p.time, value: p.voltageR, timestamp: p.timestamp }));
      const vYArr = downsampled.map(p => ({ time: p.time, value: p.voltageY, timestamp: p.timestamp }));
      const vBArr = downsampled.map(p => ({ time: p.time, value: p.voltageB, timestamp: p.timestamp }));
      const cArr = downsampled.map(p => ({ time: p.time, value: p.current, timestamp: p.timestamp }));
      setTempData(tCArr)
      setVoltageRData(vRArr);
      setVoltageYData(vYArr);
      setVoltageBData(vBArr);
      setCurrentData(cArr);

      if (vRArr.length > 0) {
        setLastUpdated(new Date(vRArr[vRArr.length - 1].timestamp));
        lastProcessedTimestampRef.current = vRArr[vRArr.length - 1].timestamp;
      }
      toast.success(`Loaded ${downsampled.length} data points`);
    } catch (err) {
      console.error("Error fetching history:", err);
      toast.error("Failed to fetch data for selected range");
    } finally {
      setLoadingHistory(false);
    }
  }, [deviceId, parseMetrics]);

  // ─────────────────────────────────────────────────────────────────────────
  // Live Streaming Handler
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!live || !hasData) return;

    const handleNewData = (e) => {
      const { detail } = e || {};
      const timestamp = detail?.timestamp ? Number(detail.timestamp) : Date.now();

      if (lastProcessedTimestampRef.current && timestamp <= lastProcessedTimestampRef.current) return;
      lastProcessedTimestampRef.current = timestamp;

      let tempData= 0,voltageR = 0, voltageY = 0, voltageB = 0, current = 0;

      if (detail?.parsed) {
         tempData = detail.parsed['C_TM'] !== undefined ? Number(detail.parsed['C_TM']) : 0;
        voltageR = detail.parsed['C_RV'] !== undefined ? Number(detail.parsed['C_RV']) : 0;
        voltageY = detail.parsed['C_YV'] !== undefined ? Number(detail.parsed['C_YV']) : 0;
        voltageB = detail.parsed['C_BV'] !== undefined ? Number(detail.parsed['C_BV']) : 0;
        current = detail.parsed['C_A1C'] !== undefined ? Number(detail.parsed['C_A1C']) / 10 : 0;
      } else if (lastFdString) {
        const m = parseMetrics(lastFdString);
        tempData = m.tempData
        voltageR = m.voltageR;
        voltageY = m.voltageY;
        voltageB = m.voltageB;
        current = m.current;
      }

      const newPoint = { time: getTimeLabel(timestamp), timestamp };
      setTempData((prev) =>[...prev,{...newPoint,value:tempData}].slice(-500));
      setVoltageRData((prev) => [...prev, { ...newPoint, value: voltageR }].slice(-500));
      setVoltageYData((prev) => [...prev, { ...newPoint, value: voltageY }].slice(-500));
      setVoltageBData((prev) => [...prev, { ...newPoint, value: voltageB }].slice(-500));
      setCurrentData((prev) => [...prev, { ...newPoint, value: current }].slice(-500));

      setLastUpdated(new Date(timestamp));
    };

    window.addEventListener('new-fd-data', handleNewData);
    return () => window.removeEventListener('new-fd-data', handleNewData);
  }, [live, hasData, lastFdString, parseMetrics]);

  // Initial point from context if empty
  useEffect(() => {
    if (!live || !hasData || !lastFdString) return;
    if (voltageRData.length === 0) {
      const {tempData, voltageR, voltageY, voltageB, current } = parseMetrics(lastFdString);
      const timestamp = Date.now();
      const newPoint = { time: getTimeLabel(timestamp), timestamp };
      setTempData([{...newPoint,value:tempData}]);
      setVoltageRData([{ ...newPoint, value: voltageR }]);
      setVoltageYData([{ ...newPoint, value: voltageY }]);
      setVoltageBData([{ ...newPoint, value: voltageB }]);
      setCurrentData([{ ...newPoint, value: current }]);
      setLastUpdated(new Date(timestamp));
      lastProcessedTimestampRef.current = timestamp;
    }
  }, [live, hasData, lastFdString, parseMetrics, voltageRData.length]);

  // ─────────────────────────────────────────────────────────────────────────
  // UI Event Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectedRange(val);

    if (val === 'live') {
      handleGoLive();
      return;
    }

    setLive(false);

    let start, end = dayjs();
    switch (val) {
      case "1DAY":
        start = end.startOf("day"); end = end.endOf("day"); break;
      case "WEEKLY":
        start = end.subtract(6, "day").startOf("day"); end = end.endOf("day"); break;
      case "PREVIOUS_MONTH":
        const prev = end.subtract(1, "month");
        start = prev.startOf("month"); end = prev.endOf("month"); break;
      default: return;
    }
    setDateRange([start.toDate(), end.toDate()]);
    fetchHistoryForRange(start, end);
  };

  const handleRangeChange = (newRange) => {
    setDateRange(newRange);
    const [start, end] = newRange || [null, null];
    if (start && end) {
      setLive(false);
      setSelectedRange("custom");
      fetchHistoryForRange(dayjs(start).startOf("minute"), dayjs(end).endOf("minute"));
    }
  };

  const handleGoLive = () => {
    setLive(true);
    setSelectedRange("live");
    setDateRange([null, null]);
    toast.info("Switched to Live mode");
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Chart Configuration
  // ─────────────────────────────────────────────────────────────────────────
  const getBaseOptions = useCallback((colors, title, unit) => {
    const isDark = theme === 'dark';
    const xCfg = getXAxisConfig(selectedRange);

    return {
      chart: {
        type: 'area',
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        background: 'transparent',
        animations: { enabled: false },
      },
      stroke: { curve: 'smooth', width: 2 },
      colors: Array.isArray(colors) ? colors : [colors],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.25,
          opacityTo: 0.02,
          stops: [0, 95, 100],
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          datetimeFormatter: xCfg.datetimeFormatter,
          style: { colors: isDark ? '#94a3b8' : '#8995A8', fontSize: '11px' },
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val) => (val != null ? `${val.toFixed(1)} ${unit}` : `0 ${unit}`),
          style: { colors: isDark ? '#94a3b8' : '#8995A8', fontSize: '11px' },
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        x: { format: 'dd MMM yyyy, HH:mm:ss' },
        y: { formatter: (val) => `${val?.toFixed(2)} ${unit}` },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        markers: { radius: 12 },
      },
      grid: {
        borderColor: isDark ? '#1e293b' : '#E2E8F0',
        strokeDashArray: 3,
        padding: { left: 8, right: 12, top: 0, bottom: 0 },
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      responsive: [
        {
          breakpoint: 640,
          options: {
            chart: { height: 250 },
            xaxis: { labels: { style: { fontSize: '9px' } } },
          },
        },
      ],
    };
  }, [theme, selectedRange]);

  // ✅ Series mapping for all 3 phases + current
  const tempcontrolSeries = useMemo(() => [
    { name: 'Temp Control', data: tempData.map(d => ({ x: d.timestamp, y: d.value })) }
  ], [tempData]);

  const voltageSeries = useMemo(() => [
    { name: 'R Phase', data: voltageRData.map(d => ({ x: d.timestamp, y: d.value })) },
    { name: 'Y Phase', data: voltageYData.map(d => ({ x: d.timestamp, y: d.value })) },
    { name: 'B Phase', data: voltageBData.map(d => ({ x: d.timestamp, y: d.value })) }
  ], [voltageRData, voltageYData, voltageBData]);

  const currentSeries = useMemo(() => [
    { name: 'Current (A)', data: currentData.map(d => ({ x: d.timestamp, y: d.value })) }
  ], [currentData]);

  return (
    <ProtectedRoute allowedRole={['USER', 'ADMIN']}>
      <DashboardLayout title="Analytics" subtitle="Real-time and historical power telemetry monitoring">
        
        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-3.5 sm:p-5 mb-5 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Device Identity */}
            <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#8BBFD5]/20 flex items-center justify-center shrink-0">
                  <FiCpu className="text-[#8BBFD5]" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">
                    Target Device
                  </p>
                  {devices && devices.length > 1 ? (
                    <select
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="font-mono font-bold text-sm text-[#263445] dark:text-white bg-transparent outline-none cursor-pointer truncate"
                    >
                      {devices.map((d) => (
                        <option key={d.id || d.deviceId} value={d.deviceId}>{d.deviceId}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-mono font-bold text-sm text-[#263445] dark:text-white truncate">
                      {deviceId || 'No device connected'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1 sm:flex-initial min-w-[130px]">
                <select
                  value={selectedRange}
                  onChange={handleSelectChange}
                  className="w-full appearance-none px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#263445] dark:text-white outline-none cursor-pointer pr-8 shadow-sm"
                >
                  <option value="live">⚡ Live Mode</option>
                  <option value="1DAY">📅 Today</option>
                  <option value="WEEKLY">📊 Last 7 Days</option>
                  <option value="PREVIOUS_MONTH">🗓️ Previous Month</option>
                  {selectedRange === 'custom' && <option value="custom">🔍 Custom Range</option>}
                </select>
                <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
              </div>

              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <DatePicker
                  selected={dateRange[0]}
                  onChange={(date) => handleRangeChange([date, dateRange[1]])}
                  selectsStart
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  placeholderText="From (Start)"
                  className="w-full px-2.5 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-slate-800 text-xs sm:text-sm"
                  showTimeSelect
                  dateFormat="MMM d, HH:mm"
                />
                <DatePicker
                  selected={dateRange[1]}
                  onChange={(date) => handleRangeChange([dateRange[0], date])}
                  selectsEnd
                  startDate={dateRange[0]}
                  endDate={dateRange[1]}
                  placeholderText="To (End)"
                  className="w-full px-2.5 py-2 rounded-lg border border-[var(--color-border)] bg-white dark:bg-slate-800 text-xs sm:text-sm"
                  showTimeSelect
                  dateFormat="MMM d, HH:mm"
                />
              </div>

              <button
                onClick={handleGoLive}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs sm:text-sm font-bold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                  live ? 'bg-emerald-500' : 'bg-[#8BBFD5]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${live ? 'bg-white animate-pulse' : 'bg-white/80'}`} />
                {live ? 'Live' : 'Go Live'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Charts Grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 relative">
          {loadingHistory && (
            <div className="absolute inset-0 z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex items-center justify-center rounded-xl p-4">
              <span className="spinner w-7 h-7 border-3 text-[#8BBFD5]" />
            </div>
          )}

          {/* Voltage Chart Card */}
          <div className="w-full min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-3.5 sm:p-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#263445] dark:text-white truncate">
                  Voltage Telemetry
                </h3>
                <p className="text-[11px] text-[var(--color-secondary-text)] mt-0.5">
                  R, Y, B Phase Voltage
                </p>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-hidden">
              {voltageRData.length === 0 && !loadingHistory ? (
                <div className="h-[250px] sm:h-[290px] flex flex-col items-center justify-center text-center p-4">
                  <FiZap size={30} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No voltage points recorded</p>
                </div>
              ) : (
                <Chart
                  // ✅ Colors for R (Blue), Y (Yellow), B (Red)
                  options={getBaseOptions(['#ef4444', '#eab308', '#3b82f6'], 'Voltage', 'V')}
                  series={voltageSeries}
                  type="area"
                  height={290}
                />
              )}
            </div>
          </div>
         {/* Temperature control Chart Card */}
          <div className="w-full min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-3.5 sm:p-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#263445] dark:text-white truncate">
                  Temperature Telemetry
                </h3>
                <p className="text-[11px] text-[var(--color-secondary-text)] mt-0.5">
               Temperature Control 
                </p>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-hidden">
              {tempData.length === 0 && !loadingHistory ? (
                <div className="h-[250px] sm:h-[290px] flex flex-col items-center justify-center text-center p-4">
                  <FiActivity size={30} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No current points recorded</p>
                </div>
              ) : (
                <Chart
                  options={getBaseOptions('#8b5cf6', 'Temperature  Control', '°C')}
                  series={tempcontrolSeries}
                  type="area"
                  height={290}
                />
              )}
            </div>
          </div>
          {/* Current Chart Card */}
          <div className="w-full min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-[var(--color-border)] dark:border-slate-800 shadow-sm p-3.5 sm:p-5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#263445] dark:text-white truncate">
                  Current Telemetry
                </h3>
                <p className="text-[11px] text-[var(--color-secondary-text)] mt-0.5">
                  AC 1 Compressor Current (C_A1C)
                </p>
              </div>
            </div>

            <div className="w-full min-w-0 overflow-hidden">
              {currentData.length === 0 && !loadingHistory ? (
                <div className="h-[250px] sm:h-[290px] flex flex-col items-center justify-center text-center p-4">
                  <FiActivity size={30} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-slate-500">No current points recorded</p>
                </div>
              ) : (
                <Chart
                  options={getBaseOptions('#8b5cf6', 'Current', 'A')}
                  series={currentSeries}
                  type="area"
                  height={290}
                />
              )}
            </div>
          </div>

        </div>

      </DashboardLayout>
    </ProtectedRoute>
  );
}