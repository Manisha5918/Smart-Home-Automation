import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { activityLogService } from '../services/api';
import { useSignalR } from '../context/SignalRContext';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Calendar,
  Trash2,
  CheckCircle,
  PlusCircle,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

const ActivityLogs = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await activityLogService.getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      toast.error(t('activityLogs.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    const handleGlobalSearch = (e) => {
      setSearchTerm(e.detail || '');
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, []);

  const { on, off } = useSignalR();
  useEffect(() => {
    on('NewActivity', loadLogs);
    return () => off('NewActivity', loadLogs);
  }, [on, off]);

  const uniqueDevices = Array.from(new Set(logs.map(log => log.device?.name).filter(Boolean)));
  const uniqueActions = Array.from(new Set(logs.map(log => log.action).filter(Boolean)));

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDevice('all');
    setSelectedAction('all');
    setDateRange('all');
    toast.success(t('activityLogs.filtersCleared'));
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDevice =
      selectedDevice === 'all' ||
      (log.device && log.device.name === selectedDevice);

    const matchesAction =
      selectedAction === 'all' ||
      log.action === selectedAction;

    let matchesDate = true;
    if (dateRange !== 'all') {
      const logDate = new Date(log.createdAt);
      const today = new Date();

      if (dateRange === 'today') {
        matchesDate = logDate.toDateString() === today.toDateString();
      } else if (dateRange === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        matchesDate = logDate >= oneWeekAgo;
      } else if (dateRange === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        matchesDate = logDate >= oneMonthAgo;
      }
    }

    return matchesSearch && matchesDevice && matchesAction && matchesDate;
  });

  const getLogIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) {
      return <PlusCircle className="text-[var(--accent-success)]" size={16} />;
    }
    if (act.includes('delete') || act.includes('remove')) {
      return <Trash2 className="text-[var(--accent-danger)]" size={16} />;
    }
    if (act.includes('power') || act.includes('consumption')) {
      return <SlidersHorizontal className="text-[var(--accent-secondary)]" size={16} />;
    }
    if (act.includes('status') || act.includes('toggle') || act.includes('changed')) {
      return <CheckCircle className="text-[var(--accent-primary)]" size={16} />;
    }
    return <History className="text-[var(--accent-primary)]" size={16} />;
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[900px] mx-auto">
        <Skeleton width="220px" height="32px" className="mb-6" />
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} height="40px" borderRadius="10px" />)}
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm flex gap-4 items-center h-[100px]">
            <Skeleton width="40px" height="40px" borderRadius="50%" />
            <div className="flex-1 space-y-2">
              <Skeleton width="30%" height="16px" />
              <Skeleton width="80%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only">Activity Logs</h1>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {t('activityLogs.title')}
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            {t('activityLogs.description')}
          </p>
        </div>
        <button
          onClick={loadLogs}
          title={t('activityLogs.refresh')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all duration-200"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm"
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="input-group m-0">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('activityLogs.searchLogs')}</label>
            <div className="relative flex items-center mt-1">
              <Search size={14} className="absolute left-3 text-[var(--text-secondary)]" />
              <input
                type="text"
                className="input-control pl-9"
                placeholder={t('activityLogs.searchPlaceholder')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group m-0">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('activityLogs.filterByDevice')}</label>
            <select
              className="input-control mt-1"
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
            >
              <option value="all">{t('activityLogs.allDevices')}</option>
              {uniqueDevices.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="input-group m-0">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('activityLogs.filterByAction')}</label>
            <select
              className="input-control mt-1"
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
            >
              <option value="all">{t('activityLogs.allActions')}</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="input-group m-0">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('activityLogs.filterByDate')}</label>
            <select
              className="input-control mt-1"
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
            >
              <option value="all">{t('activityLogs.allTime')}</option>
              <option value="today">{t('activityLogs.today')}</option>
              <option value="week">{t('activityLogs.last7Days')}</option>
              <option value="month">{t('activityLogs.last30Days')}</option>
            </select>
          </div>
        </div>

        {(searchTerm || selectedDevice !== 'all' || selectedAction !== 'all' || dateRange !== 'all') && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="h-9 px-4 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200"
            >
              {t('activityLogs.clearFilters')}
            </button>
          </div>
        )}
      </motion.div>

      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl shadow-sm"
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        {filteredLogs.length > 0 ? (
          <div className="relative pl-10 ml-6 border-l-2 border-[var(--accent-primary)] py-6 pr-6">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map(log => (
                <motion.div
                  layout
                  key={log.activityLogId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative mb-6 last:mb-0"
                >
                  <div
                    className="absolute -left-[57px] top-1 w-6 h-6 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] flex items-center justify-center text-xs z-10"
                  >
                    {getLogIcon(log.action)}
                  </div>

                  <div className="bg-[var(--bg-tertiary)] border border-gray-100 dark:border-[var(--border-color)] rounded-2xl p-4">
                    <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{log.action}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium">
                        <Calendar size={11} />
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] m-0 mb-2 leading-relaxed">{log.description}</p>
                    {log.device && (
                      <span className="inline-flex items-center text-xs text-[var(--text-primary)] bg-[var(--accent-primary-dim)] border border-gray-100 dark:border-[var(--border-color)] px-2 py-1 rounded-md">
                        {t('activityLogs.deviceLabel')} <strong className="ml-1">{log.device.name}</strong> ({log.device.type})
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <History size={40} className="mx-auto mb-3 opacity-30 text-[var(--accent-primary)]" />
            <p className="font-semibold text-[var(--text-primary)]">{t('activityLogs.noLogsMatch')}</p>
            <span className="text-sm">{t('activityLogs.adjustFilters')}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivityLogs;
