import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Calendar, AlertCircle, Cpu, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#1DBA74', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' },
];

const AdminEnergy = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [report, setReport] = useState(null);
  const setReportLoading = useState(false)[1];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, summaryData] = await Promise.all([
          adminService.getEnergyOverview(),
          adminService.getEnergySummary(),
        ]);
        setOverview(overviewData);
        setSummary(summaryData);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load energy data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePeriodSelect = async (period) => {
    setSelectedPeriod(period);
    setReportLoading(true);
    try {
      const reportData = await adminService.getEnergyReport(period);
      setReport(reportData);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load period report');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-center min-h-[60vh]"><div className="spinner spinner-lg"></div></div>;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="mx-auto mb-3 text-[var(--accent-danger)] opacity-50" />
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </div>
    );
  }

  if (!overview && !summary) {
    return (
      <div className="text-center py-16">
        <BarChart3 size={48} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
        <p className="text-sm text-[var(--text-muted)]">No energy data available</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Today Usage', value: overview?.todayUsage, icon: Zap, color: '#F59E0B', unit: 'kWh' },
    { label: 'This Week', value: overview?.weeklyUsage, icon: TrendingUp, color: '#10B981', unit: 'kWh' },
    { label: 'This Month', value: overview?.monthlyUsage, icon: Calendar, color: '#3B82F6', unit: 'kWh' },
    { label: 'Avg Daily', value: overview?.averageDailyUsage, icon: BarChart3, color: '#8B5CF6', unit: 'kWh' },
    { label: 'Total Energy', value: summary?.totalEnergy ?? overview?.totalUsage, icon: Zap, color: '#EC4899', unit: 'kWh' },
    { label: 'Record Count', value: summary?.recordCount, icon: Cpu, color: '#14B8A6', unit: '' },
  ];

  const deviceBreakdown = overview?.deviceBreakdown || [];
  const dailyTrend = overview?.dailyTrend || [];
  const topDevices = summary?.topConsumingDevices || [];

  return (
    <div>
      <h1 className="sr-only">Admin Energy</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)] mb-1">Energy Analytics</p>
        <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">Energy Overview</h2>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <motion.div key={card.label} className="admin-stat-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            >
              <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <IconComp size={22} />
              </div>
              <div className="admin-stat-info">
                <h4>{card.label}</h4>
                <p>{card.value !== undefined && card.value !== null ? `${Number(card.value).toFixed(1)}${card.unit ? ' ' + card.unit : ''}` : '—'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map((p) => (
          <button key={p.value} onClick={() => handlePeriodSelect(p.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              selectedPeriod === p.value
                ? 'bg-[var(--accent-primary)] text-white shadow-md'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-color)] hover:border-[var(--accent-primary-dim)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {report && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="admin-stats-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-[rgba(29,186,116,0.1)] text-[#1DBA74]">
                <Zap size={22} />
              </div>
              <div className="admin-stat-info">
                <h4>Report Total</h4>
                <p>{report.totalConsumption !== undefined ? `${Number(report.totalConsumption).toFixed(1)} kWh` : '—'}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-[rgba(59,130,246,0.1)] text-[#3B82F6]">
                <Cpu size={22} />
              </div>
              <div className="admin-stat-info">
                <h4>Records</h4>
                <p>{report.recordCount ?? '—'}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-[rgba(139,92,246,0.1)] text-[#8B5CF6]">
                <Calendar size={22} />
              </div>
              <div className="admin-stat-info">
                <h4>Period</h4>
                <p className="text-sm font-semibold capitalize">{report.period || selectedPeriod}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="admin-cards-grid">
        <div className="admin-card lg:col-span-2">
          <div className="admin-card-header">
            <h3><TrendingUp size={16} className="mr-1.5" /> Daily Trend</h3>
          </div>
          {dailyTrend.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Area type="monotone" dataKey="consumption" stroke="var(--accent-primary)" fill="url(#energyGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-center h-[300px]">
              <p className="text-sm text-[var(--text-muted)]">No daily trend data available</p>
            </div>
          )}
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3><BarChart3 size={16} className="mr-1.5" /> Device Breakdown</h3>
          </div>
          {deviceBreakdown.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceBreakdown} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="consumption" nameKey="deviceType"
                    label={({ deviceType, percentage }) => `${deviceType} ${percentage ? `(${Number(percentage).toFixed(0)}%)` : ''}`}
                  >
                    {deviceBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-center h-[300px]">
              <p className="text-sm text-[var(--text-muted)]">No device breakdown data</p>
            </div>
          )}
        </div>
      </div>

      {topDevices.length > 0 && (
        <div className="admin-table-container">
          <div className="admin-table-toolbar">
            <h3>Top Consuming Devices</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Consumption (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {topDevices.map((device, idx) => (
                <tr key={device.deviceId || idx}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{device.deviceName}</span>
                    </div>
                  </td>
                  <td className="font-mono font-semibold">{Number(device.consumption).toFixed(1)} <span className="text-[10px] text-[var(--text-muted)]">kWh</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEnergy;
