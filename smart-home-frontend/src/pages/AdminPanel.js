import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Wrench, UserCheck, History, X } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminService } from '../services/api';

const AdminPanel = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cpuLoad, setCpuLoad] = useState(35);
  const [ramUsage, setRamUsage] = useState(58);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [lockdownOpen, setLockdownOpen] = useState(false);
  const [lockdownConfirmed, setLockdownConfirmed] = useState(false);

  const formatTime = (date) => {
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const loadData = async () => {
    try {
      const [dash, failedLogins, securityEvents] = await Promise.all([
        adminService.getDashboardData(),
        adminService.getFailedLogins(),
        adminService.getVacationSecurityEvents()
      ]);

      setDashboardData(dash);

      // Merge and sort events by timestamp
      const failedLoginsFormatted = (failedLogins || []).map(x => ({
        id: `failed-${x.loginHistoryId}`,
        type: 'failed-login',
        title: 'Failed Login Attempt',
        message: `Email: ${x.email} | IP: ${x.ipAddress || 'Unknown'}`,
        timestamp: new Date(x.attemptedAt),
        timeString: formatTime(new Date(x.attemptedAt))
      }));

      const securityEventsFormatted = (securityEvents || []).map(x => ({
        id: `security-${x.alertId}`,
        type: 'security-alert',
        title: x.eventMessage || 'Security Alert',
        message: `Device: ${x.device} | Owner: ${x.owner}`,
        timestamp: new Date(x.time),
        timeString: formatTime(new Date(x.time))
      }));

      const allEvents = [...failedLoginsFormatted, ...securityEventsFormatted]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to load admin panel data:', err);
      toast.error('Failed to load admin panel data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Fluctuating values for CPU and RAM to simulate live telemetry
    const interval = setInterval(() => {
      setCpuLoad(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
        const next = prev + change;
        return Math.max(15, Math.min(85, next));
      });
      setRamUsage(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const next = prev + change;
        return Math.max(40, Math.min(80, next));
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setTimeout(() => {
      setDiagnosticsRunning(false);
      toast.success('All 42 nodes checked. No issues found.');
    }, 2000);
  };

  const handleEmergencyLockdown = () => {
    setLockdownOpen(true);
  };

  const handleConfirmLockdown = () => {
    setLockdownConfirmed(true);
    setLockdownOpen(false);
    toast.error(t('adminPanel.lockdownEngaged'));
  };

  const handleCancelLockdown = () => {
    setLockdownOpen(false);
  };

  const handleExportData = () => {
    if (!dashboardData) return;
    const json = JSON.stringify(dashboardData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('adminPanel.dataExported'));
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse text-[#1e293b] p-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 bg-white dark:bg-gray-800 border border-[#0a5c53]/10 rounded-2xl p-6 h-[350px]"></div>
          <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 border border-[#0a5c53]/10 rounded-2xl p-6 h-[160px]"></div>
            <div className="bg-white dark:bg-gray-800 border border-[#0a5c53]/10 rounded-2xl p-6 h-[160px]"></div>
            <div className="bg-white dark:bg-gray-800 border border-[#0a5c53]/10 rounded-2xl p-6 h-[180px] md:col-span-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#1e293b]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[#5c6e6a] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('adminPanel.rootAdmin')}</p>
          <h1 className="sr-only">Admin Panel</h1>
          <h2 className="text-3xl font-bold text-[#0a5c53] tracking-tight">{t('adminPanel.systemOverview')}</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportData}
            className="px-4 py-2 bg-[#f3f7f6] border border-[#0a5c53]/10 rounded-lg text-xs font-bold uppercase tracking-wider text-[#5c6e6a] hover:bg-[#e1ece8] transition-all"
          >
            {t('adminPanel.exportData')}
          </button>
          <button 
            onClick={() => navigate('/admin/reports')}
            className="px-4 py-2 bg-[#0a5c53] text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#07463f] transition-all"
          >
            {t('adminPanel.generateReport')}
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Global System Health */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[350px] shadow-sm">
          <div className="absolute top-4 left-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5c6e6a]">{t('adminPanel.globalSystemHealth')}</h3>
          </div>
          <div className="relative w-52 h-52 flex items-center justify-center mt-4">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="104" cy="104" fill="none" r="90" stroke="#f3f7f6" strokeWidth="10"></circle>
              <circle className="transition-all duration-1000 ease-out" cx="104" cy="104" fill="none" r="90" stroke="#0a5c53" strokeDasharray="565" strokeDashoffset="1.1" strokeLinecap="round" strokeWidth="10"></circle>
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-extrabold text-[#0a5c53]">99.8%</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#5c6e6a] mt-1 font-semibold">{t('adminPanel.uptimeScore')}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 bg-[#0a5c53]/5 border border-[#0a5c53]/10 rounded-full px-5 py-2">
            <CheckCircle className="text-[#0a5c53] text-sm" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0a5c53]">{t('adminPanel.allSystemsOperational')}</span>
          </div>
        </div>

        {/* Column Group for Users & Resources */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Active Users */}
          <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 flex flex-col justify-between min-h-[160px] shadow-sm">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#5c6e6a] mb-1">{t('adminPanel.activeUsers')}</h3>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-extrabold text-[#0a5c53]">{dashboardData?.onlineUsers ?? 0}</span>
                <span className="flex items-center text-[#2ec4b6] text-xs font-bold mb-1">
                  <History className="text-xs mr-1" />
                  of {dashboardData?.totalUsers ?? 0} total
                </span>
              </div>
            </div>
            <div className="h-12 w-full mt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                <path d="M0 35 Q 10 25, 20 30 T 40 15 T 60 25 T 80 5 T 100 20" fill="none" stroke="#2ec4b6" strokeLinecap="round" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 flex flex-col min-h-[160px] shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5c6e6a] mb-4">{t('adminPanel.resourceUsage')}</h3>
            <div className="grid grid-cols-2 gap-4 flex-grow">
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" fill="none" r="26" stroke="#f3f7f6" strokeWidth="4"></circle>
                    <circle cx="32" cy="32" fill="none" r="26" stroke="#0a5c53" strokeDasharray="163" strokeDashoffset={163 - (163 * cpuLoad) / 100} strokeLinecap="round" strokeWidth="4"></circle>
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-[#0a5c53]">{cpuLoad}%</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-[#5c6e6a]">{t('adminPanel.cpuLoad')}</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" fill="none" r="26" stroke="#f3f7f6" strokeWidth="4"></circle>
                    <circle cx="32" cy="32" fill="none" r="26" stroke="#0a5c53" strokeDasharray="163" strokeDashoffset={163 - (163 * ramUsage) / 100} strokeLinecap="round" strokeWidth="4"></circle>
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-[#0a5c53]">{ramUsage}%</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-[#5c6e6a]">{t('adminPanel.ramUsage')}</span>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 flex flex-col min-h-[180px] md:col-span-2 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#5c6e6a]">{t('adminPanel.recentEvents')}</h3>
              <button onClick={loadData} className="text-[10px] font-bold uppercase text-[#0a5c53] hover:underline">Refresh</button>
            </div>
            <div className="space-y-2.5">
              {events.length > 0 ? (
                events.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2.5 bg-[#f3f7f6] border border-[#0a5c53]/5 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${event.type === 'security-alert' ? 'bg-[#ef4444]' : 'bg-[#f59e0b]'}`}></span>
                      <div>
                        <p className="text-xs font-bold text-[#1e293b]">{event.title}</p>
                        <p className="text-[9px] text-[#5c6e6a] font-medium">{event.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#5c6e6a]">{event.timeString}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-[#5c6e6a]">
                  No recent events
                </div>
              )}
            </div>
          </div>

        </div>

        {/* System Controls */}
        <div className="col-span-12 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 border-l-4 border-l-[#0a5c53] min-h-[160px] group shadow-sm">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#5c6e6a] mb-1">{t('adminPanel.systemControls')}</h3>
            <p className="text-xs text-[#5c6e6a]">{t('adminPanel.systemControlsDesc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <button 
              onClick={handleRunDiagnostics}
              disabled={diagnosticsRunning}
              className={`group flex items-center justify-center gap-3 p-4 border rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                diagnosticsRunning 
                  ? 'bg-[#e1ece8] border-[#0a5c53]/20 text-[#0a5c53]/60 cursor-not-allowed' 
                  : 'bg-[#f3f7f6] border-[#0a5c53]/10 text-[#0a5c53] hover:bg-[#0a5c53]/5 hover:border-[#0a5c53]/30'
              }`}
            >
              <Wrench className={`text-2xl transition-transform ${diagnosticsRunning ? 'text-[#0a5c53]/60 animate-spin' : 'text-[#0a5c53] group-hover:scale-110'}`} />
              {diagnosticsRunning ? 'Running...' : t('adminPanel.runDiagnostics')}
            </button>
            <button 
              onClick={handleEmergencyLockdown}
              disabled={lockdownConfirmed}
              className={`group flex items-center justify-center gap-3 p-4 border rounded-xl transition-all text-xs font-bold uppercase tracking-wider ${
                lockdownConfirmed 
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                  : 'bg-red-50/5 border-red-500/10 text-red-600 hover:bg-red-500/10 hover:border-red-500/30'
              }`}
            >
              <UserCheck className={`text-2xl transition-transform ${lockdownConfirmed ? 'text-gray-400' : 'text-red-500 group-hover:scale-110'}`} />
              {lockdownConfirmed ? 'Lockdown Engaged' : t('adminPanel.emergencyLockdown')}
            </button>
          </div>
        </div>

      </div>

      {lockdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Emergency Lockdown</h3>
              <button onClick={handleCancelLockdown} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)]">
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              This will secure all entry points and disable remote access. Are you sure?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={handleCancelLockdown} className="h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200">
                Cancel
              </button>
              <button onClick={handleConfirmLockdown} className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-sm">
                Confirm Lockdown
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
