import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/api';
import { useSignalR } from '../../context/SignalRContext';
import { motion } from 'framer-motion';
import {
  Users, Activity, Cpu, BarChart3, Zap, Bell, Shield, Settings,
  AlertTriangle, XCircle, Clock, UserPlus,
  Monitor, Lock,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import Skeleton from '../../components/Skeleton';

const ANIMATED_DURATION = { duration: 1.2, ease: [0.16, 1, 0.3, 1] };
const PIE_COLORS = ['var(--accent-primary)', 'var(--accent-info)', 'var(--accent-warning)', 'var(--accent-danger)', 'var(--accent-purple)', 'var(--accent-orange)', 'var(--accent-success)', 'var(--accent-secondary)'];

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

const ChartTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '', color = '#16A34A' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
        <p className="text-xs font-semibold text-[#64748B]">{label}</p>
        <p className="text-sm font-bold mt-1" style={{ color }}>{valuePrefix}{payload[0].value}{valueSuffix}</p>
      </div>
    );
  }
  return null;
};

const EmptyState = ({ icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-[#94A3B8] mb-3">
      {icon}
    </div>
    <p className="text-sm font-semibold text-[#64748B]">{title}</p>
    {description && <p className="text-xs font-medium text-[#94A3B8] mt-1">{description}</p>}
  </div>
);

const KPI_CONFIG = [
  { id: 'users', icon: <Users size={20} />, label: 'Total Users', color: '#3B82F6', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(96,165,250,0.05))' },
  { id: 'online', icon: <Activity size={20} />, label: 'Online Now', color: '#10B981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(52,211,153,0.05))' },
  { id: 'devices', icon: <Cpu size={20} />, label: 'Total Devices', color: '#8B5CF6', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(167,139,250,0.05))' },
  { id: 'activeDevices', icon: <BarChart3 size={20} />, label: 'Active Devices', color: '#F59E0B', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.05))' },
  { id: 'energy', icon: <Zap size={20} />, label: 'Energy Today', color: '#F97316', gradient: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(251,146,60,0.05))' },
  { id: 'health', icon: <Shield size={20} />, label: 'System Health', color: '#06B6D4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(34,211,238,0.05))' },
];

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [energyOverview, setEnergyOverview] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [failedLogins, setFailedLogins] = useState([]);
  const [deviceMetrics, setDeviceMetrics] = useState(null);
  const [activitySummary, setActivitySummary] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { on, off } = useSignalR();
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashboard, analytics, health, energy, growth, types, recent, failed, metrics, activity, top] = await Promise.all([
          adminService.getDashboardData().catch(() => null),
          adminService.getAnalytics().catch(() => null),
          adminService.getSystemHealth().catch(() => null),
          adminService.getEnergyOverview().catch(() => null),
          adminService.getUserGrowth().catch(() => []),
          adminService.getDeviceTypes().catch(() => []),
          adminService.getRecentUsers().catch(() => []),
          adminService.getFailedLogins().catch(() => []),
          adminService.getDeviceMetrics().catch(() => null),
          adminService.getActivitySummary().catch(() => null),
          adminService.getTopUsers().catch(() => []),
        ]);
        setDashboardData(dashboard);
        setAnalyticsData(analytics);
        setSystemHealth(health);
        setEnergyOverview(energy);
        setUserGrowth(Array.isArray(growth) ? growth : []);
        setDeviceTypes(Array.isArray(types) ? types : []);
        setRecentUsers(Array.isArray(recent) ? recent : []);
        setFailedLogins(Array.isArray(failed) ? failed : []);
        setDeviceMetrics(metrics);
        setActivitySummary(activity);
        setTopUsers(Array.isArray(top) ? top : []);
      } catch (err) {
        setError(err?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const refresh = () => window.location.reload();
    on('AdminDashboardUpdated', refresh);
    on('UserPresenceChanged', refresh);
    return () => {
      off('AdminDashboardUpdated', refresh);
      off('UserPresenceChanged', refresh);
    };
  }, [on, off]);

  const totalUsers = dashboardData?.totalUsers ?? analyticsData?.TotalUsers ?? systemHealth?.metrics?.totalUsers ?? 0;
  const onlineUsers = dashboardData?.onlineUsers ?? analyticsData?.OnlineUsers ?? systemHealth?.metrics?.activeUsers ?? 0;
  const totalDevices = dashboardData?.totalDevices ?? analyticsData?.TotalDevices ?? systemHealth?.metrics?.totalDevices ?? 0;
  const activeDevices = dashboardData?.activeDevices ?? analyticsData?.ActiveDevices ?? systemHealth?.metrics?.activeDevices ?? 0;
  const energyToday = energyOverview?.todayUsage ?? 0;
  const systemStatus = systemHealth?.status || 'Unknown';
  const totalAlerts = dashboardData?.totalAlerts ?? analyticsData?.TotalAlerts ?? systemHealth?.metrics?.totalAlerts ?? 0;
  const automationRules = dashboardData?.automationRules ?? systemHealth?.metrics?.activeAutomationRules ?? 0;
  const lockedUsers = dashboardData?.lockedUsers ?? systemHealth?.metrics?.lockedAccounts ?? 0;
  const unreadAlerts = systemHealth?.metrics?.unreadAlerts ?? 0;
  const pendingMaintenance = systemHealth?.metrics?.pendingMaintenance ?? 0;
  const faultyDevices = deviceMetrics?.faultyDevices ?? 0;
  const avgHealthScore = deviceMetrics?.averageHealthScore ?? 0;
  const todayActivities = activitySummary?.todayActivities ?? 0;

  const dailyTrend = energyOverview?.dailyTrend || [];
  const growthData = userGrowth;
  const deviceTypeData = deviceTypes;
  const byAction = activitySummary?.byAction || [];
  const hourlyDistribution = activitySummary?.hourlyDistribution || [];

  const offlineUsers = (analyticsData?.OfflineUsers ?? systemHealth?.metrics?.offlineUsers ?? 0);
  const offlineDevices = (analyticsData?.OfflineDevices ?? systemHealth?.metrics?.inactiveDevices ?? 0);

  const kpiValues = {
    users: { value: totalUsers, subtitle: `${lockedUsers} locked`, progress: totalUsers > 0 ? 100 : 0 },
    online: { value: onlineUsers, subtitle: `${offlineUsers} offline`, progress: totalUsers > 0 ? Math.round((onlineUsers / totalUsers) * 100) : 0 },
    devices: { value: totalDevices, subtitle: `${faultyDevices} faulty`, progress: totalDevices > 0 ? 100 : 0 },
    activeDevices: { value: activeDevices, subtitle: `${offlineDevices} inactive`, progress: totalDevices > 0 ? Math.round((activeDevices / totalDevices) * 100) : 0 },
    energy: { value: `${Number(energyToday).toFixed(1)} kWh`, subtitle: `${(energyOverview?.monthlyUsage ?? 0).toFixed(1)} kWh month`, progress: 0 },
    health: { value: systemStatus, subtitle: `${unreadAlerts} alerts`, progress: systemStatus === 'Healthy' ? 92 : 50 },
  };

  const deviceStatusPie = totalDevices > 0 ? [
    { name: 'Active', value: activeDevices, color: '#10B981' },
    { name: 'Inactive', value: offlineDevices, color: '#94A3B8' },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6 px-1">
        <div className="space-y-1">
          <Skeleton width="110px" height="12px" />
          <Skeleton width="200px" height="28px" className="mt-1" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
              <Skeleton width="50%" height="12px" />
              <Skeleton width="60%" height="28px" className="mt-2.5" />
              <Skeleton width="80%" height="4px" className="mt-3.5" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5">
            <Skeleton width="30%" height="14px" />
            <Skeleton width="100%" height="240px" className="mt-3" />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <Skeleton width="30%" height="14px" />
            <Skeleton width="100%" height="240px" className="mt-3" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData && !systemHealth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <AlertTriangle size={48} className="text-[#EF4444]" />
        <p className="text-sm font-medium text-[#64748B]">Unable to load admin dashboard</p>
        <p className="text-xs text-[#94A3B8]">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#16A34A] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm hover:bg-[#15803D] transition-all duration-200">
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 px-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <h1 className="sr-only">Admin Dashboard</h1>
      {/* ═══ HEADER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3"
      >
        <div>
          <p className="text-[#64748B] text-xs font-bold uppercase tracking-[0.2em] mb-1">Enterprise Overview</p>
          <h2 className="text-3xl font-extrabold text-[#16A34A] tracking-tight">Admin Dashboard</h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">System-wide monitoring & analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
            systemStatus === 'Healthy'
              ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
              : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${systemStatus === 'Healthy' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
            {systemStatus}
          </span>
        </div>
      </motion.div>

      {/* ═══ KPI CARDS (real data only) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {KPI_CONFIG.map((cfg) => {
          const k = kpiValues[cfg.id];
          return (
            <motion.div
              key={cfg.id}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white border border-gray-100 rounded-xl p-4 transition-all duration-200 cursor-default overflow-hidden relative shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              style={{ background: cfg.gradient }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/80 border border-white/60 backdrop-blur-sm" style={{ color: cfg.color }}>
                  {cfg.icon}
                </div>
              </div>
              <p className="text-xs font-semibold text-[#64748B]">{cfg.label}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  {typeof k.value === 'number' ? <AnimatedCounter value={k.value} /> : k.value}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-xs font-medium text-[#475569]">{k.subtitle}</span>
              </div>
              {k.progress > 0 && (
                <div className="mt-2.5 pt-2 border-t border-gray-100/50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cfg.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${k.progress}%` }}
                        transition={ANIMATED_DURATION}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#64748B]">{k.progress}%</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ CHART ROW 1: Energy Trend + Device Status ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Energy Daily Trend */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Energy</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Daily Energy Trend</p>
            </div>
            {dailyTrend.length > 0 && energyOverview && (
              <div className="flex items-center gap-3 text-[11px]">
                <span className="font-medium text-[#64748B]">Today: <strong className="text-[#0F172A]">{energyOverview.todayUsage?.toFixed(1)} kWh</strong></span>
                <span className="font-medium text-[#64748B]">Month: <strong className="text-[#0F172A]">{energyOverview.monthlyUsage?.toFixed(1)} kWh</strong></span>
              </div>
            )}
          </div>
          {dailyTrend.length === 0 ? (
            <EmptyState icon={<Zap size={24} />} title="No energy trend data available" description="Energy usage records will appear once devices start reporting consumption" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16A34A" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#16A34A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip valueSuffix=" kWh" color="#16A34A" />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="consumption" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#energyGrad)" activeDot={{ r: 5, strokeWidth: 0, fill: '#16A34A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Device Status Donut */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Devices</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Device Status</p>
            </div>
          </div>
          {totalDevices === 0 ? (
            <EmptyState icon={<Cpu size={24} />} title="No devices registered" description="Devices will appear here once added to the system" />
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deviceStatusPie} cx="50%" cy="50%" innerRadius={60} outerRadius={78} paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={800}>
                      {deviceStatusPie.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke={entry.color} strokeWidth={1} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-[#0F172A] leading-none"><AnimatedCounter value={activeDevices} /></span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] mt-0.5">Online</span>
                  <span className="text-[10px] font-semibold text-[#94A3B8] mt-0.5">of {totalDevices}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-3">
                {deviceStatusPie.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-semibold text-[#475569]">{d.name}</span>
                    <span className="text-xs font-bold text-[#0F172A]">{d.value}</span>
                  </div>
                ))}
              </div>
              {deviceMetrics && (
                <div className="w-full mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold uppercase text-[#64748B]">Avg Health</p>
                    <p className="text-sm font-extrabold text-[#0F172A]">{avgHealthScore.toFixed(1)}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold uppercase text-[#64748B]">Faulty</p>
                    <p className="text-sm font-extrabold text-[#EF4444]">{faultyDevices}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold uppercase text-[#64748B]">Rules</p>
                    <p className="text-sm font-extrabold text-[#0F172A]">{automationRules}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ CHART ROW 2: User Growth + Device Types ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* User Growth */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Users</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">User Growth</p>
            </div>
            {growthData.length > 0 && (
              <span className="text-[10px] font-medium text-[#64748B] bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                {growthData.reduce((s, d) => s + d.users, 0)} total signups
              </span>
            )}
          </div>
          {growthData.length === 0 ? (
            <EmptyState icon={<UserPlus size={24} />} title="No user growth data" description="Registration data will appear once users begin signing up" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip valueSuffix=" users" color="#10B981" />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGrad)" activeDot={{ r: 5, strokeWidth: 0, fill: '#10B981' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Device Type Distribution */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Types</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Device Type Distribution</p>
            </div>
            {deviceTypeData.length > 0 && (
              <span className="text-[10px] font-medium text-[#64748B] bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                {deviceTypeData.length} types
              </span>
            )}
          </div>
          {deviceTypeData.length === 0 ? (
            <EmptyState icon={<Monitor size={24} />} title="No device type data" description="Device type distribution will appear once devices are registered" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceTypeData} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="count" label={({ type, count }) => `${type} (${count})`} labelLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}>
                    {deviceTypeData.map((entry, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
                            <p className="text-xs font-semibold text-[#64748B]">{d.type}</p>
                            <p className="text-sm font-bold text-[#0F172A] mt-1">{d.count} devices</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ TABLE ROW: Recent Users + Failed Logins + Activity ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-5"
      >
        {/* Recent Users */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Users</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Recent Registrations</p>
            </div>
            {recentUsers.length > 0 && (
              <span className="text-[10px] font-medium text-[#64748B] bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Latest {recentUsers.length}</span>
            )}
          </div>
          {recentUsers.length === 0 ? (
            <EmptyState icon={<Users size={24} />} title="No recent registrations" description="New user registrations will appear here" />
          ) : (
            <div className="space-y-2">
              {recentUsers.slice(0, 6).map((user) => (
                <div key={user.userId} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-[#16A34A]/10 flex items-center justify-center text-xs font-bold text-[#16A34A] border border-[#16A34A]/10 shrink-0">
                    {(user.fullName || user.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{user.fullName || 'Unknown'}</p>
                    <p className="text-[10px] font-medium text-[#64748B] truncate">{user.email}</p>
                  </div>
                  <span className="text-[10px] font-medium text-[#94A3B8] whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failed Logins */}
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Security</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Failed Logins</p>
            </div>
            {failedLogins.length > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-[10px] font-bold text-[#EF4444]">{failedLogins.length}</span>
              </span>
            )}
          </div>
          {failedLogins.length === 0 ? (
            <EmptyState icon={<Shield size={24} />} title="No failed logins" description="All authentication attempts have been successful" />
          ) : (
            <div className="space-y-2">
              {failedLogins.slice(0, 6).map((entry) => (
                <div key={entry.loginHistoryId} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-50/50 transition-colors border border-transparent hover:border-red-100">
                  <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0 border border-[#EF4444]/10">
                    <XCircle size={14} className="text-[#EF4444]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#475569] truncate">{entry.email}</p>
                    <p className="text-[9px] font-mono text-[#94A3B8]">{entry.ipAddress || '—'}</p>
                  </div>
                  <span className="text-[9px] font-medium text-[#94A3B8] whitespace-nowrap">
                    {new Date(entry.attemptedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Activity</h3>
              <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Today's Activity</p>
            </div>
            {activitySummary && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#64748B] bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{todayActivities} events</span>
              </div>
            )}
          </div>
          {hourlyDistribution.length === 0 ? (
            <EmptyState icon={<Activity size={24} />} title="No activity data" description="Activity logs will appear once users interact with the system" />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip valueSuffix=" events" color="#3B82F6" />} cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {byAction.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2">By Action</p>
              <div className="flex flex-wrap gap-2">
                {byAction.slice(0, 5).map((item) => (
                  <span key={item.action} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-[#475569]">
                    {item.action}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ BOTTOM ROW: Top Users + Quick Stats ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        {/* Top Users */}
        {topUsers.length > 0 && (
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Usage</h3>
                <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Top Users by Usage</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    <th className="pb-3 pr-3">User</th>
                    <th className="pb-3 pr-3">Email</th>
                    <th className="pb-3">Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.slice(0, 5).map((user) => (
                    <tr key={user.userId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[10px] font-bold text-[#8B5CF6] border border-[#8B5CF6]/10">
                            {(user.fullName || '?')[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-[#0F172A]">{user.fullName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-[#64748B]">{user.email}</td>
                      <td className="py-2.5 text-xs font-mono font-bold text-[#0F172A]">{(user.hours || user.totalUsageMinutes / 60 || 0).toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Summary</h3>
            <p className="text-lg font-extrabold text-[#0F172A] tracking-tight mt-1">Quick Stats</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                <Bell size={14} className="text-[#F59E0B]" />
                <span className="text-xs font-medium text-[#475569]">Total Alerts</span>
              </div>
              <span className="text-xs font-bold text-[#0F172A]">{totalAlerts}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                <Bell size={14} className="text-[#EF4444]" />
                <span className="text-xs font-medium text-[#475569]">Unread Alerts</span>
              </div>
              <span className="text-xs font-bold text-[#EF4444]">{unreadAlerts}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                <Settings size={14} className="text-[#06B6D4]" />
                <span className="text-xs font-medium text-[#475569]">Automation Rules</span>
              </div>
              <span className="text-xs font-bold text-[#0F172A]">{automationRules}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-[#8B5CF6]" />
                <span className="text-xs font-medium text-[#475569]">Pending Maintenance</span>
              </div>
              <span className="text-xs font-bold text-[#F59E0B]">{pendingMaintenance}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2.5">
                <Lock size={14} />
                <span className="text-xs font-medium text-[#475569]">Locked Accounts</span>
              </div>
              <span className="text-xs font-bold text-[#EF4444]">{lockedUsers}</span>
            </div>
            {energyOverview && (
              <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Zap size={14} className="text-[#F97316]" />
                  <span className="text-xs font-medium text-[#475569]">Monthly Energy</span>
                </div>
                <span className="text-xs font-bold text-[#0F172A]">{(energyOverview.monthlyUsage || 0).toFixed(1)} kWh</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ FOOTER ═══ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-sm font-semibold text-[#475569]">{systemStatus}</span>
          </div>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{totalUsers} users</span>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{totalDevices} devices</span>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{todayActivities} events today</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-[#94A3B8]" />
          <span className="text-xs font-medium text-[#94A3B8]">Live</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
