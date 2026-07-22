import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService, energyAnalyticsService, deviceService, monthlyReportService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSignalR } from '../context/SignalRContext';
import useReducedMotion from '../utils/useReducedMotion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Plug, Zap, Lightbulb, Fan, Tv, Lock, Wind, Wallet, ArrowUp, ArrowDown, Leaf, Shield, Bot, Clock, ChevronRight, Activity, TrendingUp, Cpu, Gauge, BarChart3 } from 'lucide-react';
import Skeleton, { ChartSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [myDevices, setMyDevices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [insightData, setInsightData] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(null);
  const [recommendationData, setRecommendationData] = useState(null);
  const [advisorData, setAdvisorData] = useState(null);
  const [carbonData, setCarbonData] = useState(null);
  const [energySavingLoading, setEnergySavingLoading] = useState(false);

  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    energyUsageToday: 0,
    monthlyCost: 0,
    co2Saved: 0,
    carbonRating: '-',
    systemStatus: 'Optimal',
    homeStatus: 'All Systems Operational',
  });





  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setInsightLoading(true);
      setEnergySavingLoading(true);

      const [dashRes, energyRes, predictionRes, devicesRes, insightRes, recRes, advisorRes, carbonRes] = await Promise.allSettled([
        dashboardService.getDashboardData(),
        energyAnalyticsService.getDashboardData(),
        energyAnalyticsService.getBillPrediction(),
        deviceService.getDevices(),
        monthlyReportService.getMonthlyReport(),
        energyAnalyticsService.getRecommendations(),
        energyAnalyticsService.getEnergyAdvisor(),
        energyAnalyticsService.getCarbonFootprint(),
      ]);

      let updatedStats = {
        totalDevices: 0,
        activeDevices: 0,
        energyUsageToday: 0,
        monthlyCost: 0,
        co2Saved: 0,
        carbonRating: '-',
        systemStatus: 'Optimal',
        homeStatus: 'All Systems Operational',
      };

      let devList = [];
      if (devicesRes.status === 'fulfilled' && devicesRes.value) {
        devList = devicesRes.value || [];
        setMyDevices(devList);
        updatedStats.totalDevices = devList.length;
        updatedStats.activeDevices = devList.filter(d => d.status === 'On').length;
      }

      const totalWatts = devList.reduce((sum, d) => sum + (parseFloat(d.powerConsumption) || 0), 0);
      const automatedMonthlyCost = ((totalWatts * 6 * 30) / 1000) * 7.50;
      updatedStats.monthlyCost = automatedMonthlyCost > 0 ? automatedMonthlyCost : 0;

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        const d = dashRes.value;
        updatedStats.totalDevices = d.statistics?.totalDevices ?? updatedStats.totalDevices;
        updatedStats.activeDevices = d.statistics?.activeDevices ?? updatedStats.activeDevices;
        updatedStats.systemStatus = d.statistics?.homeStatus || 'Optimal';
        updatedStats.homeStatus = d.statistics?.homeStatus || 'All Systems Operational';
        if (d.recentActivities && Array.isArray(d.recentActivities)) {
          setActivities(d.recentActivities);
        }
      }

      if (energyRes.status === 'fulfilled' && energyRes.value) {
        const e = energyRes.value;
        updatedStats.energyUsageToday =
          e.todayUsage !== undefined && e.todayUsage !== null ? parseFloat(e.todayUsage) : 0;
        updatedStats.co2Saved = updatedStats.energyUsageToday * 0.45;
      }

      if (predictionRes.status === 'fulfilled' && predictionRes.value && predictionRes.value.estimatedBill) {
        const p = predictionRes.value;
        const billStr = String(p.estimatedBill);
        const numericBill = parseFloat(billStr.replace(/[^0-9.]/g, ''));
        if (numericBill > 0) {
          updatedStats.monthlyCost = numericBill;
        }
      }

      if (insightRes.status === 'fulfilled' && insightRes.value) {
        setInsightData(insightRes.value);
        setInsightError(null);
      } else {
        setInsightError('Failed to load insights');
        setInsightData(null);
      }
      setInsightLoading(false);

      if (recRes.status === 'fulfilled' && recRes.value && recRes.value.recommendation) {
        setRecommendationData(recRes.value);
      } else {
        setRecommendationData(null);
      }

      if (advisorRes.status === 'fulfilled' && advisorRes.value && advisorRes.value.recommendations?.length > 0) {
        setAdvisorData(advisorRes.value);
      } else {
        setAdvisorData(null);
      }

      if (carbonRes.status === 'fulfilled' && carbonRes.value) {
        setCarbonData(carbonRes.value);
      } else {
        setCarbonData(null);
      }
      setEnergySavingLoading(false);

      setStats(updatedStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const { on, off } = useSignalR();
  useEffect(() => {
    const refresh = () => fetchDashboard();
    on('DashboardUpdated', refresh);
    on('DeviceStatusChanged', refresh);
    on('NewActivity', refresh);
    on('EnergyUpdated', refresh);
    return () => {
      off('DashboardUpdated', refresh);
      off('DeviceStatusChanged', refresh);
      off('NewActivity', refresh);
      off('EnergyUpdated', refresh);
    };
  }, [on, off]);

  const handleToggleDevice = async (id, name, currentStatus) => {
    const nextStatus = currentStatus === 'On' ? 'Off' : 'On';
    try {
      await deviceService.updateDeviceStatus(id, nextStatus);
      toast.success(`${name} successfully turned ${nextStatus.toLowerCase()}.`);
      fetchDashboard();
    } catch (err) {
      toast.error(`Failed to update ${name} status.`);
    }
  };

  const getDeviceIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('light') || t.includes('bulb')) return <Lightbulb />;
    if (t.includes('fan')) return <Fan />;
    if (t.includes('ac') || t.includes('air') || t.includes('condition')) return <Wind />;
    if (t.includes('lock') || t.includes('door')) return <Lock />;
    if (t.includes('tv') || t.includes('television')) return <Tv />;
    return <Plug />;
  };

  const getActivityIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('light') || t.includes('bulb')) return <Lightbulb />;
    if (t.includes('fan')) return <Fan />;
    if (t.includes('lock') || t.includes('door')) return <Lock />;
    if (t.includes('ac') || t.includes('air')) return <Wind />;
    if (t.includes('tv')) return <Tv />;
    if (t.includes('alert') || t.includes('security')) return <Shield />;
    if (t.includes('automation')) return <Bot />;
    return <Activity />;
  };

  const hours = new Date().getHours();
  const greetingKey = hours < 12 ? 'goodMorning' : hours < 18 ? 'welcomeBack' : 'goodEvening';
  const displayName = user?.fullName ? user.fullName.split(' ')[0] : '';
  const deviceOnlinePercent = stats.totalDevices > 0 ? Math.round((stats.activeDevices / stats.totalDevices) * 100) : 0;

  const displayActivities = activities.length > 0 ? activities.slice(0, 5) : [];

  const statusCfg = {
    success: { bg: 'rgba(22,163,74,0.10)', text: '#16A34A', dot: '#16A34A', label: 'Completed' },
    warning: { bg: 'rgba(234,88,12,0.10)', text: '#EA580C', dot: '#EA580C', label: 'Warning' },
    info: { bg: 'rgba(37,99,235,0.10)', text: '#2563EB', dot: '#2563EB', label: 'Info' },
    default: { bg: 'rgba(100,116,139,0.10)', text: '#64748B', dot: '#64748B', label: 'Event' },
    purple: { bg: 'rgba(124,58,237,0.10)', text: '#7C3AED', dot: '#7C3AED', label: 'Automated' },
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton height="120px" borderRadius="16px" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Skeleton height="160px" borderRadius="16px" />
          <Skeleton height="160px" borderRadius="16px" />
          <Skeleton height="160px" borderRadius="16px" />
          <Skeleton height="160px" borderRadius="16px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><Skeleton height="380px" borderRadius="16px" /></div>
          <div><Skeleton height="380px" borderRadius="16px" /></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 px-1" variants={stagger} initial="initial" animate="animate">
      {/* ═══════════════════════════════════════
          HERO — Premium Split Layout
          ═══════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        className="relative rounded-2xl overflow-hidden min-h-[340px] max-h-[360px] bg-gradient-to-br from-white to-[#f8fbfa] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)]"
      >
        {/* Faint mesh pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(circle_at_25%_25%,#16A34A_1px,transparent_1px),radial-gradient(circle_at_75%_75%,#16A34A_1px,transparent_1px)] bg-[length:60px_60px]" />

        <div className="relative h-full grid grid-cols-1 lg:grid-cols-[58%_42%]">
          {/* ─── GRADIENT TRANSITION ─── */}
          <div className="absolute inset-y-0 left-[58%] w-[15%] z-[3] pointer-events-none hidden lg:block bg-gradient-to-r from-white/95 via-white/45 to-transparent" />

          {/* ─── LEFT COLUMN ─── */}
          <div className="p-5 lg:p-6 flex flex-col justify-center relative z-10">
            {/* Live Date & Time Glass Card */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[18px] bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mb-2.5 flex-wrap"
            >
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="text-sm font-bold text-[#0F172A]">
                {t(`dashboard.${greetingKey}`)}, {displayName}
              </span>
              <span className="w-px h-3.5 bg-gray-200" />
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#16A34A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                System Online
              </span>
            </motion.div>

            <h1 className="sr-only">Dashboard</h1>
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight mb-1"
            >
              Welcome to your Smart Home
            </motion.h1>

            {/* Subtitle + Feature Tags */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="text-sm font-medium text-[#64748B] max-w-xl leading-relaxed"
            >
              Monitor, automate and secure every corner with AI-powered intelligence.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex items-center gap-2 mt-1"
            >
              <span className="text-[10px] font-semibold text-[#16A34A] bg-[#16A34A]/8 px-2 py-0.5 rounded-full">Real-time monitoring</span>
              <span className="text-[10px] font-semibold text-[#2563EB] bg-[#2563EB]/8 px-2 py-0.5 rounded-full">Smart Automation</span>
              <span className="text-[10px] font-semibold text-[#7C3AED] bg-[#7C3AED]/8 px-2 py-0.5 rounded-full">Local AI</span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.3 }}
              className="flex items-center gap-3 mt-3"
            >
              <Link
                to="/devices"
                className="h-10 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-[0_4px_12px_rgba(22,163,74,0.25)]"
              >
                <Plug size={13} />
                {t('dashboard.viewDevices')}
              </Link>
              <Link
                to="/ai-suggestions"
                className="h-10 px-4 bg-white border-2 border-gray-100 hover:border-gray-200 text-[#475569] text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 hover:shadow-sm"
              >
                <Cpu size={14} />
                {t('dashboard.aiInsights')}
              </Link>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="relative overflow-hidden h-full flex items-center justify-center">
            {/* Ambient glow behind image */}
            <div className="absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(34,197,94,0.14)_0%,transparent_72%)]" />

            {/* Decorative AI network lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] z-[1]"
              viewBox="0 0 500 360" preserveAspectRatio="xMidYMid meet">
              <path d="M 0 180 Q 125 100, 250 180 T 500 180" stroke="#16A34A" strokeWidth="1" fill="none" />
              <path d="M 0 260 Q 125 200, 250 260 T 500 260" stroke="#16A34A" strokeWidth="0.5" fill="none" strokeDasharray="3 4" />
              <path d="M 0 100 Q 125 160, 250 100 T 500 100" stroke="#16A34A" strokeWidth="0.5" fill="none" strokeDasharray="3 4" />
              <circle cx="250" cy="180" r="2" fill="#16A34A" opacity="0.3" />
              <circle cx="125" cy="100" r="1.5" fill="#16A34A" opacity="0.2" />
              <circle cx="375" cy="260" r="1.5" fill="#16A34A" opacity="0.2" />
            </svg>

            {/* Image container (reduced width, 24px radius, soft shadow, floating) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-2xl z-[2] w-[85%] h-[85%] shadow-[0_30px_70px_rgba(16,24,40,.12)]"
            >
              <motion.div
                className="w-full h-full"
                animate={reducedMotion ? {} : { y: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img src="/home_illustration.jpg" alt="Smart Home"
                  className="w-full h-full object-cover object-center"
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════
          STATS CARDS — Richer, Premium
          ═══════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            icon: <Plug size={18} />,
            title: t('dashboard.totalDevices'),
            value: stats.totalDevices,
            trend: '+2 this week',
            trendUp: true,
            status: `${deviceOnlinePercent}% Connected`,
            footer: 'All registered devices',
            color: '#2563EB',
            bgColor: 'rgba(37,99,235,0.08)',
          },
          {
            icon: <Zap size={18} />,
            title: t('dashboard.activeDevices'),
            value: stats.activeDevices,
            trend: '100% Online',
            trendUp: true,
            status: `${stats.activeDevices} of ${stats.totalDevices} active`,
            footer: 'Updated 2 min ago',
            color: '#16A34A',
            bgColor: 'rgba(22,163,74,0.08)',
          },
          {
            icon: <Leaf size={18} />,
            title: t('dashboard.energyToday'),
            value: stats.energyUsageToday.toFixed(2),
            unit: 'kWh',
            status: 'Insufficient data',
            footer: 'Today\'s consumption',
            color: '#EA580C',
            bgColor: 'rgba(234,88,12,0.08)',
          },
          {
            icon: <Wallet size={18} />,
            title: t('dashboard.monthlyBill'),
            value: `₹${stats.monthlyCost.toFixed(0)}`,
            trend: 'Estimated',
            trendUp: null,
            status: '₹0.75 per kWh avg',
            footer: 'This month projection',
            color: '#7C3AED',
            bgColor: 'rgba(124,58,237,0.08)',
          },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            animate={reducedMotion ? {} : { y: [0, -3, 0] }}
            transition={{ duration: 5, delay: idx * 0.15, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-white border border-gray-100 rounded-xl p-5 transition-all duration-200 cursor-default shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            style={{ '--card-color': card.color, '--card-bg': card.bgColor }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--card-bg)] text-[var(--card-color)]">
                {card.icon}
              </div>
              {card.trend && (
                <span
                  className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                    card.trendUp === true ? 'text-[#16A34A] bg-[rgba(22,163,74,0.08)]' : card.trendUp === false ? 'text-[#EF4444] bg-[rgba(239,68,68,0.08)]' : 'text-[#64748B] bg-[rgba(100,116,139,0.08)]'
                  }`}
                >
                  {card.trendUp === true && <ArrowUp size={8} />}
                  {card.trendUp === false && <ArrowDown size={8} />}
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-base font-semibold text-[#64748B]">{card.title}</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-extrabold text-[#0F172A] tracking-tight">{card.value}</span>
              {card.unit && <span className="text-sm font-semibold text-[#94A3B8]">{card.unit}</span>}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--card-color)]" />
              <span className="text-sm font-medium text-[#475569]">{card.status}</span>
            </div>
            <p className="text-xs font-medium text-[#94A3B8] mt-1.5 pt-2 border-t border-gray-50">{card.footer}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ═══════════════════════════════════════
          CHARTS ROW — Daily Energy + Device Usage
          ═══════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Energy Chart */}
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#16A34A] tracking-tight">{t('dashboard.dailyEnergyUsage')}</h2>
              <p className="text-sm font-medium text-[#64748B] mt-0.5">{t('dashboard.hourlyEnergyConsumption')}</p>
            </div>
          </div>

          {insightLoading ? (
            <div className="h-full w-full"><ChartSkeleton /></div>
          ) : (
            <div className="h-full flex items-center justify-center w-full">
              <EmptyState
                icon={BarChart3}
                title={t('dashboard.noEnergyDataTitle') || 'No Energy Data Yet'}
                description={t('dashboard.noEnergyDataDesc') || 'Energy data will appear once devices are active for at least 24 hours.'}
              />
            </div>
          )}
        </motion.div>

        {/* Device Usage Donut */}
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
        >
          <h2 className="text-2xl font-extrabold text-[#16A34A] tracking-tight">{t('dashboard.deviceWiseUsage')}</h2>
          <p className="text-sm font-medium text-[#64748B] mt-0.5 mb-4">{t('dashboard.consumptionDistribution')}</p>

          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <div className="absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'On', value: stats.activeDevices, color: '#16A34A' },
                        { name: 'Off', value: stats.totalDevices - stats.activeDevices, color: '#CBD5E1' },
                      ]}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[
                        { name: 'On', value: stats.activeDevices, color: '#16A34A' },
                        { name: 'Off', value: stats.totalDevices - stats.activeDevices, color: '#CBD5E1' },
                      ].map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute flex flex-col items-center pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 gap-[6px]">
                <p className="text-3xl font-extrabold text-[#0F172A] leading-none">{stats.activeDevices || 6}</p>
                <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">Active</p>
              </div>
            </div>

            <div className="w-full mt-4 space-y-2.5">
              <p className="text-sm font-medium text-[#94A3B8] text-center py-4">
                {t('dashboard.noDeviceData', 'Device consumption breakdown will appear here')}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate('/ai-report')}
              className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#475569] text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            >
              {t('dashboard.viewFullReport')} <ChevronRight size={14} className="text-[#16A34A]" />
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════
          QUICK CONTROLS + RECENT ACTIVITY
          ═══════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Controls */}
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-[#16A34A] tracking-tight">{t('dashboard.quickControls')}</h2>
              <p className="text-sm font-medium text-[#64748B] mt-0.5">Recently used devices</p>
            </div>
            <Link to="/devices" className="text-sm font-bold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1.5">
              {t('dashboard.viewAllDevices')} <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {myDevices.slice(0, 3).map((device) => {
              const isOn = device.status === 'On';
              return (
                <motion.div
                  key={device.deviceId}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between transition-all duration-200"
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#F1F5F9'; }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${
                          isOn ? 'text-[#16A34A] bg-[#16A34A]/8' : 'text-[#94A3B8] bg-gray-50'
                        }`}
                      >
                        {getDeviceIcon(device.type)}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                          isOn ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-gray-100 text-[#94A3B8]'
                        }`}
                      >
                        {isOn ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-[#0F172A] truncate">{device.name}</h4>
                    <p className="text-sm font-medium text-[#94A3B8] mt-0.5">{device.roomName || 'General'}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap size={13} className="text-[#94A3B8]" />
                        <span className="text-xs font-semibold text-[#64748B]">
                          {device.powerConsumption ? `${device.powerConsumption}W` : '—'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleDevice(device.deviceId, device.name, device.status)}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                          isOn ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                            isOn ? 'translate-x-[22px]' : 'translate-x-[1px]'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}


          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-extrabold text-[#16A34A] tracking-tight">{t('dashboard.recentActivity')}</h2>
              <p className="text-sm font-medium text-[#64748B] mt-0.5">Latest events</p>
            </div>
            <Link to="/activity-logs" className="text-sm font-bold text-[#16A34A] hover:text-[#15803D]">
              {t('dashboard.viewAll')}
            </Link>
          </div>

          <div className="space-y-1">
            {displayActivities.length === 0 ? (
              <p className="text-sm font-medium text-[#94A3B8] text-center py-8">{t('dashboard.noActivities')}</p>
            ) : (
              displayActivities.map((activity, idx) => {
                const actType = typeof activity === 'string'
                  ? { title: activity, source: 'System', time: '—', type: 'manual', status: 'default' }
                  : activity;
                const icon = activity.icon ? getActivityIcon(activity.icon) : <Activity />;
                const sc = statusCfg[actType.status] || statusCfg.default;
                const isLast = idx === displayActivities.length - 1;

                return (
                  <div key={actType.id || idx} className="flex gap-4 relative pb-5 last:pb-0" style={{ '--sc-bg': sc.bg, '--sc-text': sc.text, '--sc-dot': sc.dot }}>
                    {!isLast && (
                      <div className="absolute left-[17px] top-9 bottom-0 w-px bg-gray-100" />
                    )}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5 border border-gray-50 bg-[var(--sc-bg)] text-[var(--sc-text)]"
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold text-[#0F172A]">{actType.title}</p>
                        <span className="text-xs font-medium text-[#94A3B8] shrink-0 whitespace-nowrap">{actType.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-medium text-[#64748B]">{actType.source}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--sc-text)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--sc-dot)]" />
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════
          AI INSIGHT + ENERGY SAVING
          ═══════════════════════════════════════ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* AI Insight Card */}
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
        >
          {insightLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : insightError ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm font-medium text-[#EF4444]">Failed to load insights. Please try again later.</p>
            </div>
          ) : !insightData ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm font-medium text-[#94A3B8]">No insights available</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center shrink-0 border border-[#7C3AED]/10 text-[#7C3AED]">
                  <Cpu size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h2 className="text-xl font-extrabold text-[#16A34A] tracking-tight">AI Insight</h2>
                    <span className="text-[10px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-2 py-1 rounded-full">
                      {insightData.efficiencyRating || 82}% confidence
                    </span>
                    <span className="text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-1 rounded-full">
                      Energy Saving
                    </span>
                  </div>
                  <p className="text-base font-medium text-[#475569] leading-relaxed">
                    {insightData.aiInsights?.length > 0
                      ? insightData.aiInsights[0]
                      : 'No AI insights available at this time.'}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => navigate('/ai-report')}
                      className="h-11 px-5 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-[0_4px_12px_rgba(22,163,74,0.25)]"
                    >
                      <TrendingUp size={15} />
                      {t('dashboard.viewSuggestions', 'View Suggestions')}
                    </button>
                    <button className="h-11 px-5 bg-gray-50 hover:bg-gray-100 text-[#475569] text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 border border-gray-100">
                      <Shield size={14} />
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>

              {/* Efficiency Gauge */}
              <div className="flex items-center gap-4 shrink-0 bg-gray-50 border border-gray-100 rounded-xl p-4 w-full lg:w-auto">
                <div className="relative flex items-center justify-center">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="26" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="32" cy="32" r="26" stroke="#16A34A" strokeWidth="6" fill="transparent"
                      strokeDasharray={163.36}
                      strokeDashoffset={163.36 - (163.36 * (insightData.efficiencyRating || 82)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-lg font-extrabold text-[#0F172A] leading-none">{insightData.efficiencyRating || 82}</span>
                    <span className="text-[9px] font-bold text-[#94A3B8] block mt-0.5">/100</span>
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold text-[#0F172A]">AI Health Score</p>
                  <p className="text-sm font-medium text-[#64748B] mt-0.5">Better than last month</p>
                  <p className="text-sm font-bold text-[#16A34A] mt-1.5 flex items-center gap-1.5">
                    <ArrowUp size={10} /> 6 points vs last month
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Energy Saving Recommendation */}
        <motion.div
          animate={reducedMotion ? {} : { y: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#16A34A] tracking-tight">Energy Saving</h2>
              <p className="text-sm font-medium text-[#64748B] mt-0.5">Today's recommendation</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center text-[#16A34A]">
              <Leaf size={18} />
            </div>
          </div>

          {energySavingLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {recommendationData ? (
                <div className="bg-[#16A34A]/5 border border-[#16A34A]/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp size={14} className="text-[#16A34A]" />
                    <span className="text-sm font-bold text-[#0F172A]">{recommendationData.highestConsumer}</span>
                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      recommendationData.priority === 'High'
                        ? 'text-[#EF4444] bg-[#EF4444]/10'
                        : recommendationData.priority === 'Medium'
                        ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                        : 'text-[#16A34A] bg-[#16A34A]/10'
                    }`}>
                      {recommendationData.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#475569] leading-relaxed">
                    {recommendationData.recommendation}
                  </p>
                  {recommendationData.estimatedMonthlySaving && (
                    <p className="text-xs font-bold text-[#16A34A] mt-2">
                      Estimated saving: {recommendationData.estimatedMonthlySaving}/month
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-[#16A34A]/5 border border-[#16A34A]/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp size={14} className="text-[#16A34A]" />
                    <span className="text-sm font-bold text-[#0F172A]">Energy Tip</span>
                  </div>
                  <p className="text-sm font-medium text-[#475569]">
                    Shifting appliance usage to daytime could save up to <span className="font-bold text-[#16A34A]">₹{Math.round(stats.monthlyCost * 0.12)}/month</span>.
                  </p>
                </div>
              )}

              {advisorData && advisorData.recommendations?.length > 0 && (
                <div className="bg-[#2563EB]/5 border border-[#2563EB]/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bot size={14} className="text-[#2563EB]" />
                    <span className="text-sm font-bold text-[#0F172A]">AI Advisor</span>
                  </div>
                  <ul className="space-y-1.5">
                    {advisorData.recommendations.slice(0, 2).map((tip, i) => (
                      <li key={i} className="text-sm font-medium text-[#475569] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {carbonData ? (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                  <Gauge size={20} className="text-[#7C3AED]" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0F172A]">Carbon Footprint</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-sm font-semibold text-[#475569]">{carbonData.co2Produced}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        carbonData.carbonRating === 'A+' || carbonData.carbonRating === 'A'
                          ? 'text-[#16A34A] bg-[#16A34A]/10'
                          : carbonData.carbonRating === 'B+' || carbonData.carbonRating === 'B'
                          ? 'text-[#F59E0B] bg-[#F59E0B]/10'
                          : 'text-[#EF4444] bg-[#EF4444]/10'
                      }`}>
                        Rating {carbonData.carbonRating}
                      </span>
                    </div>
                    {carbonData.equivalentTrees > 0 && (
                      <p className="text-[11px] font-medium text-[#94A3B8] mt-0.5">
                        Equivalent to {carbonData.equivalentTrees} trees needed to offset
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                  <Gauge size={20} className="text-[#7C3AED]" />
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">CO₂ Impact</p>
                    <p className="text-sm font-medium text-[#475569]">{stats.co2Saved.toFixed(2)} kg estimated</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/ai-suggestions')}
            className="w-full mt-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(22,163,74,0.2)]"
          >
            <Bot size={14} />
            Optimize Now
          </button>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════
          FOOTER — System Status + Quick Meta
          ═══════════════════════════════════════ */}
      <motion.div
        variants={fadeUp}
        animate={reducedMotion ? {} : { y: [0, -2, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-sm font-semibold text-[#475569]">All Systems Operational</span>
          </div>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{stats.totalDevices} devices · {stats.activeDevices} active</span>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-medium text-[#94A3B8]">{stats.energyUsageToday.toFixed(1)} kWh today</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-[#94A3B8]" />
          <span className="text-xs font-medium text-[#94A3B8]">Last updated: just now</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
