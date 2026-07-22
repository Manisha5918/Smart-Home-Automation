import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ShieldAlert, ShieldCheck, LogIn, AlertTriangle,
  CheckCircle, XCircle, Cpu, Wifi,
  Scan, Lock, Moon, RefreshCw, Download,
  TrendingUp, TrendingDown, Clock,
} from 'lucide-react';
import { securityService, deviceHealthService, deviceService, vacationModeService } from '../services/api';
import { staggerContainer, fadeUp } from '../utils/motionVariants';
import useReducedMotion from '../utils/useReducedMotion';
import Skeleton from '../components/Skeleton';

const ANIMATED_DURATION = { duration: 1.2, ease: [0.16, 1, 0.3, 1] };

const AnimatedCounter = ({ value, suffix = '', prefix = '', decimals = 0, className = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;
    const duration = 1200;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span ref={ref} className={className}>{prefix}{display.toFixed(decimals)}{suffix}</span>;
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'online': case 'on': return <Wifi className="text-[#22c55e]" size={14} />;
    case 'offline': case 'off': return <Wifi className="text-[#ef4444]" size={14} />;
    default: return <Cpu className="text-[#64748B]" size={14} />;
  }
};

const RiskGauge = ({ score = 0, reducedMotion = false, riskLevel = 'low' }) => {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;
  const color = score <= 30 ? '#22c55e' : score <= 70 ? '#eab308' : '#ef4444';
  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" fill="none" r={radius} stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="70" cy="70" fill="none" r={radius} stroke={color} strokeDasharray={circumference} strokeDashoffset={reducedMotion ? 0 : offset} strokeLinecap="round" strokeWidth="8" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedCounter value={score} className="text-3xl font-extrabold text-[#0F172A] font-mono" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-[#64748B] mt-0.5">Risk Score</span>
      </div>
    </div>
  );
};

const getRiskBadgeClass = (level) => {
  switch (level?.toLowerCase()) {
    case 'low': return 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20';
    case 'moderate': case 'medium': return 'bg-[#eab308]/10 text-[#eab308] border-[#eab308]/20';
    case 'high': case 'critical': return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20';
    default: return 'bg-[#f1f5f9] text-[#64748B] border-[#e2e8f0]';
  }
};

const KPI_CONFIG = [
  { id: 'devices', icon: <ShieldCheck size={20} />, label: 'Protected Devices', gradient: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(34,197,94,0.05))', accent: '#16A34A' },
  { id: 'threats', icon: <AlertTriangle size={20} />, label: 'Active Threats', gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(248,113,113,0.05))', accent: '#EF4444' },
  { id: 'online', icon: <Wifi size={20} />, label: 'Devices Online', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(96,165,250,0.05))', accent: '#3B82F6' },
  { id: 'firewall', icon: <ShieldAlert size={20} />, label: 'Firewall Status', gradient: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.05))', accent: '#7C3AED' },
];

const QUICK_ACTIONS = [
  { id: 'scan', icon: <Scan size={18} />, label: 'Run Security Scan', color: '#16A34A', bg: 'rgba(22,163,74,0.10)', comingSoon: false },
  { id: 'lock', icon: <Lock size={18} />, label: 'Lock All Doors', color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', comingSoon: false },
  { id: 'vacation', icon: <Moon size={18} />, label: 'Enable Vacation Mode', color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', comingSoon: false },
  { id: 'firmware', icon: <RefreshCw size={18} />, label: 'Update Firmware', color: '#EA580C', bg: 'rgba(234,88,12,0.10)', comingSoon: true },
  { id: 'backup', icon: <Download size={18} />, label: 'Backup Settings', color: '#64748B', bg: 'rgba(100,116,139,0.10)', comingSoon: true },
];

const SecurityDashboard = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [risk, setRisk] = useState(null);
  const [loginActivity, setLoginActivity] = useState([]);
  const [summary, setSummary] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [riskData, loginData, summaryData, deviceData] = await Promise.all([
        securityService.getRisk(),
        securityService.getLoginActivity(),
        securityService.getSummary(),
        deviceHealthService.getMyDevices()
      ]);
      setRisk(riskData);
      setLoginActivity(loginData || []);
      setSummary(summaryData);
      setDevices(deviceData || []);
    } catch (err) {
      console.error('Failed to load security dashboard:', err);
      setError(err.message || 'Failed to load security data');
      toast.error(t('security.overview', 'Failed to load security dashboard'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const recentLoginActivity = useMemo(() =>
    (loginActivity || []).slice(0, 15), [loginActivity]
  );

  const riskFactors = useMemo(() => {
    const factors = risk?.riskFactors || summary?.riskFactors || [];
    return Array.isArray(factors) ? factors : [];
  }, [risk, summary]);

  const riskLevel = risk?.riskLevel || summary?.riskLevel || 'low';
  const riskScore = summary?.riskScore ?? risk?.riskScore ?? 0;

  const totalDevices = devices.length || 0;
  const activeThreats = riskFactors.length || 0;
  const devicesOnline = devices.filter(d =>
    d.status?.toLowerCase() === 'online' || d.status?.toLowerCase() === 'on'
  ).length || 0;
  const onlinePercent = totalDevices > 0 ? Math.round((devicesOnline / totalDevices) * 100) : 0;
  const offlineCount = totalDevices - devicesOnline;

  const kpiValues = useMemo(() => ({
    devices: { value: totalDevices, trend: `${totalDevices} total`, trendUp: null, subtitle: 'All registered', progress: totalDevices > 0 ? 100 : 0 },
    threats: { value: activeThreats, trend: activeThreats > 0 ? 'Active' : 'None', trendUp: null, subtitle: activeThreats > 0 ? `${activeThreats} risk factors` : 'No risks', progress: activeThreats > 0 ? Math.min(activeThreats * 25, 100) : 0 },
    online: { value: devicesOnline, trend: `${onlinePercent}%`, trendUp: null, subtitle: `${offlineCount} offline`, progress: onlinePercent },
    firewall: { value: 'Active', trend: summary?.failedLogins ? `${summary.failedLogins} blocked` : 'Enabled', trendUp: null, subtitle: riskLevel === 'low' ? 'Secure' : `${riskLevel} risk`, progress: riskLevel === 'low' ? 92 : riskLevel === 'medium' ? 65 : 40 },
  }), [totalDevices, activeThreats, devicesOnline, onlinePercent, offlineCount, summary, riskLevel]);

  const handleQuickAction = async (id) => {
    if (loadingAction) return;

    try {
      setLoadingAction(id);

      switch (id) {
        case 'scan': {
          const riskData = await securityService.getRisk();
          setRisk(riskData);
          const score = riskData?.riskScore ?? 0;
          toast.success(`Security scan complete. Risk score: ${score}/100`);
          break;
        }
        case 'lock': {
          const lockDevices = devices.filter(d =>
            d.type?.toLowerCase().includes('lock') ||
            d.type?.toLowerCase().includes('door') ||
            d.name?.toLowerCase().includes('door')
          );

          if (lockDevices.length === 0) {
            toast.error('No lock-type devices found to lock');
            break;
          }

          const results = await Promise.allSettled(
            lockDevices.map(d => deviceService.updateDeviceStatus(d.deviceId, 'off'))
          );

          const successCount = results.filter(r => r.status === 'fulfilled').length;
          const failCount = results.filter(r => r.status === 'rejected').length;
          toast.success(`Locked ${successCount}/${lockDevices.length} doors`);
          if (failCount > 0) {
            toast.error(`${failCount} door(s) failed to lock`);
          }

          const deviceData = await deviceHealthService.getMyDevices();
          setDevices(deviceData || []);
          break;
        }
        case 'vacation': {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 7);
          await vacationModeService.enable({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          });
          toast.success('Vacation mode enabled successfully');
          break;
        }
        default: break;
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || 'Action failed';
      toast.error(message);
    } finally {
      setLoadingAction(null);
    }
  };

  if (loading) {
    return (
      <motion.div className="space-y-6 px-1 text-[#0F172A]" variants={staggerContainer} initial="hidden" animate="visible">
        <div className="space-y-1">
          <Skeleton width="100px" height="12px" />
          <Skeleton width="200px" height="28px" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-12 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-gray-100 rounded-xl p-5">
              <Skeleton width="60%" height="12px" />
              <Skeleton width="40%" height="24px" className="mt-2.5" />
              <Skeleton width="80%" height="4px" className="mt-3.5" />
            </div>
          ))}
          <div className="col-span-12 lg:col-span-8 bg-white border border-gray-100 rounded-xl p-5">
            <Skeleton width="30%" height="14px" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} width="100%" height="36px" className="mt-2.5" />
            ))}
          </div>
          <div className="col-span-12 lg:col-span-4 bg-white border border-gray-100 rounded-xl p-5">
            <Skeleton width="50%" height="14px" />
            <Skeleton width="100%" height="140px" className="mt-3" />
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !risk && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <ShieldAlert className="text-[#EF4444]" size={48} />
        <p className="text-sm font-medium text-[#64748B]">{t('security.overview', 'Unable to load security dashboard')}</p>
        <p className="text-xs text-[#94A3B8]">{error}</p>
        <button onClick={loadData} className="px-5 py-2.5 bg-[#16A34A] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-[#15803D] transition-all duration-200">
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 px-1 text-[#0F172A]" variants={staggerContainer} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-[0.2em] mb-1">Security</p>
          <h1 className="sr-only">Security Dashboard</h1>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">Security Dashboard</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">Real-time threat monitoring & device protection</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span className="text-xs font-bold text-[#16A34A]">All Systems Operational</span>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {KPI_CONFIG.map((cfg) => {
          const k = kpiValues[cfg.id];
          return (
            <motion.div
              key={cfg.id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white border border-gray-100 rounded-xl p-5 transition-all duration-200 cursor-default overflow-hidden relative shadow-[0_1px_2px_rgba(0,0,0,0.04)] bg-[var(--kpi-bg)]"
              style={{
                '--kpi-bg': cfg.gradient,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/80 border border-white/60 backdrop-blur-sm text-[var(--kpi-accent)]"
                  style={{ '--kpi-accent': cfg.accent }}>
                  {cfg.icon}
                </div>
                {k.trend && (
                  <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                    k.trendUp === true ? 'text-[#16A34A] bg-[#16A34A]/8' :
                    k.trendUp === false ? 'text-[#EF4444] bg-[#EF4444]/8' :
                    'text-[#64748B] bg-gray-100'
                  }`}>
                    {k.trendUp === true && <TrendingUp size={10} />}
                    {k.trendUp === false && <TrendingDown size={10} />}
                    {k.trend}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-[#64748B]">{cfg.label}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">
                  {typeof k.value === 'number' ? <AnimatedCounter value={k.value} /> : k.value}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--kpi-accent)]" style={{ '--kpi-accent': cfg.accent }} />
                <span className="text-sm font-medium text-[#475569]">{k.subtitle}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100/50">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--kpi-accent)]"
                      style={{ '--kpi-accent': cfg.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${k.progress}%` }}
                      transition={ANIMATED_DURATION}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#64748B]">{k.progress}%</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Risk Score</h3>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRiskBadgeClass(riskLevel)}`}>
              {riskLevel}
            </span>
          </div>
          <RiskGauge score={riskScore} reducedMotion={reducedMotion} riskLevel={riskLevel} />
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="text-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Successful</p>
              <p className="text-lg font-extrabold text-[#16A34A] mt-1">{summary?.successfulLogins ?? 0}</p>
            </div>
            <div className="text-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Failed</p>
              <p className="text-lg font-extrabold text-[#EF4444] mt-1">{summary?.failedLogins ?? 0}</p>
            </div>
          </div>
          {riskFactors.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">Risk Factors</p>
              {riskFactors.slice(0, 3).map((factor, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                  <AlertTriangle size={12} className="text-[#EF4444] shrink-0" />
                  <span className="text-xs font-medium text-[#475569]">{factor}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Activity</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Login Activity</p>
            </div>
            {loginActivity.length > 0 && (
              <span className="text-[10px] font-mono text-[#64748B] bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Last {loginActivity.length} entries</span>
            )}
          </div>
          {recentLoginActivity.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    <th className="pb-3 pr-3">User</th>
                    <th className="pb-3 pr-3">IP Address</th>
                    <th className="pb-3 pr-3">Status</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoginActivity.map((entry) => (
                    <tr key={entry.loginHistoryId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 flex items-center justify-center text-xs font-bold text-[#16A34A] border border-[#16A34A]/10">
                            {(entry.email || 'U')[0].toUpperCase()}
                          </div>
                          <p className="text-xs font-bold text-[#0F172A]">{entry.email || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs font-mono text-[#64748B]">{entry.ipAddress || '—'}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          entry.isSuccessful
                            ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'
                            : 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'
                        }`}>
                          {entry.isSuccessful ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {entry.isSuccessful ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3 text-[10px] font-mono text-[#64748B] whitespace-nowrap">
                        {entry.attemptedAt ? new Date(entry.attemptedAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-[#64748B]">
              <LogIn size={28} className="mb-2 text-slate-300" />
              <p className="text-xs font-medium">No login activity recorded.</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {devices.length > 0 && (
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Devices</h3>
                <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Device Status</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-1 rounded-full border border-[#16A34A]/20">
                  {devicesOnline} Online
                </span>
                <span className="text-[10px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2 py-1 rounded-full border border-[#EF4444]/20">
                  {offlineCount} Offline
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {devices.slice(0, 10).map((device) => {
                const isOn = device.status?.toLowerCase() === 'online' || device.status?.toLowerCase() === 'on';
                return (
                  <div key={device.deviceId} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {getStatusIcon(device.status)}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">{device.name}</p>
                        <p className="text-[9px] font-medium text-[#64748B]">{device.type || 'Device'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase shrink-0 ${isOn ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {device.status || 'Offline'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={devices.length > 0 ? '' : 'lg:col-span-3'}>
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Actions</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Quick Actions</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const isComingSoon = action.comingSoon;
                const isLoading = loadingAction === action.id;

                return (
                  <motion.button
                    key={action.id}
                    whileHover={!isComingSoon && !isLoading ? { x: 2 } : {}}
                    whileTap={!isComingSoon && !isLoading ? { scale: 0.98 } : {}}
                    onClick={() => !isComingSoon && !isLoading && handleQuickAction(action.id)}
                    disabled={isComingSoon || isLoading}
                    title={isComingSoon ? 'Coming soon' : action.label}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${
                      isComingSoon
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : 'border-gray-100 bg-white hover:shadow-sm cursor-pointer'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isComingSoon ? 'opacity-50' : ''
                    }`}
                      style={{ backgroundColor: action.bg, color: action.color }}>
                      {action.icon}
                    </div>
                    <span className={`text-sm font-bold flex-1 ${
                      isComingSoon ? 'text-[#94A3B8]' : 'text-[#0F172A]'
                    }`}>
                      {action.label}
                    </span>
                    {isComingSoon && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] bg-gray-100 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                    {isLoading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-[#0F172A] border-t-transparent rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {summary && (
            <div className="mt-5 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B] mb-3">Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-[#64748B]">Period</span>
                  <span className="text-xs font-bold text-[#0F172A]">{summary.period || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-[#64748B]">Successful Logins</span>
                  <span className="text-xs font-bold text-[#16A34A]">{summary.successfulLogins ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-[#64748B]">Failed Logins</span>
                  <span className="text-xs font-bold text-[#EF4444]">{summary.failedLogins ?? 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-medium text-[#64748B]">Last Login</span>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {summary.lastSuccessfulLogin ? new Date(summary.lastSuccessfulLogin).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-sm font-semibold text-[#475569]">All Systems Operational</span>
          </div>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{devicesOnline} devices online</span>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{activeThreats} active threats</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-[#94A3B8]" />
          <span className="text-xs font-medium text-[#94A3B8]">Last updated: just now</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecurityDashboard;
