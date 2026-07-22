import React, { useState, useEffect, useCallback } from 'react';
import Skeleton from '../components/Skeleton';
import { Wrench, CheckCircle, Bell, Download, AlertTriangle, RotateCcw, Calendar, ClipboardList, Droplets, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { staggerContainer, slideRight } from '../utils/motionVariants';
import useReducedMotion from '../utils/useReducedMotion';
import { maintenanceService, deviceHealthService } from '../services/api';

const monthsBetween = (d1, d2) => (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth();

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
  } catch { return dateStr; }
};

const Maintenance = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [trackerData, setTrackerData] = useState([]);
  const [deviceHealthData, setDeviceHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ringProgress, setRingProgress] = useState(reducedMotion ? 88 : 0);
  const [warrantyBars, setWarrantyBars] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tracker, health] = await Promise.all([
        maintenanceService.getTracker(),
        deviceHealthService.getMyDevices(),
      ]);
      setTrackerData(Array.isArray(tracker) ? tracker : []);
      setDeviceHealthData(Array.isArray(health) ? health : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || t('common.loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const urgentItem = trackerData
    .filter(item => item.remainingDays != null && item.remainingDays > 0)
    .sort((a, b) => a.remainingDays - b.remainingDays)[0] || null;

  const warrantyItems = trackerData.filter(item => item.warrantyExpiry);

  const serviceHistory = trackerData
    .filter(item => item.lastService)
    .map(item => ({
      serviceType: item.serviceType || t('maintenance.serviceType'),
      date: item.lastService,
      status: item.status || 'completed',
      provider: item.notes || item.device || '-',
      amount: '-',
      device: item.device,
    }));

  const anomalyAlerts = deviceHealthData
    .filter(d => d.totalAnomalies > 0)
    .map(d => ({
      icon: 'warning',
      title: `${d.name} - ${d.totalAnomalies} ${t('common.warning').toLowerCase()}`,
      desc: t('maintenance.hvacDescription'),
    }));

  useEffect(() => {
    if (reducedMotion) return;
    const ringTimer = setTimeout(() => setRingProgress(88), 300);
    return () => clearTimeout(ringTimer);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || warrantyItems.length === 0) {
      if (reducedMotion && warrantyItems.length > 0) {
        const maxMonths = Math.max(1, ...warrantyItems.map(item => Math.max(1, monthsBetween(new Date(), new Date(item.warrantyExpiry)))));
        setWarrantyBars(warrantyItems.map(item => Math.round((Math.max(1, monthsBetween(new Date(), new Date(item.warrantyExpiry))) / maxMonths) * 100)));
      }
      return;
    }
    const maxMonths = Math.max(1, ...warrantyItems.map(item => Math.max(1, monthsBetween(new Date(), new Date(item.warrantyExpiry)))));
    const percentages = warrantyItems.map(item => Math.round((Math.max(1, monthsBetween(new Date(), new Date(item.warrantyExpiry))) / maxMonths) * 100));
    const timer = setTimeout(() => setWarrantyBars(percentages), 400);
    return () => clearTimeout(timer);
  }, [reducedMotion, warrantyItems]);

  const handleSchedule = async (item) => {
    try {
      await maintenanceService.addMaintenance({
        device: item.device,
        serviceType: item.serviceType,
        notes: t('maintenance.scheduleNow'),
      });
      toast.success(t('maintenance.scheduleLogged', { taskName: item.serviceType || item.device }));
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || t('common.error'));
    }
  };

  const handleExport = () => {
    toast.success(t('maintenance.logsExported'));
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <Skeleton className="h-3 w-40 mb-2" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-8 w-48 rounded-full" />
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Skeleton className="w-36 h-36 rounded-full" />
              <div className="flex-grow space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-72" />
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-36 rounded-xl" />
                  <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 flex-1 shadow-sm">
              <Skeleton className="h-5 w-28 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="col-span-12 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 shadow-sm">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-2 w-full rounded-full" /><Skeleton className="h-3 w-32" /></div>
              <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-2 w-full rounded-full" /><Skeleton className="h-3 w-32" /></div>
              <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-2 w-full rounded-full" /><Skeleton className="h-3 w-32" /></div>
            </div>
          </div>
          <div className="col-span-12 bg-white border border-[#0a5c53]/10 rounded-2xl shadow-sm">
            <div className="px-6 py-4 border-b border-[#0a5c53]/5"><Skeleton className="h-5 w-36" /></div>
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center max-w-md">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-500 text-xl" />
          </div>
          <h3 className="text-lg font-bold text-[#1e293b] mb-2">{t('common.error')}</h3>
          <p className="text-sm text-[#5c6e6a] mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 bg-[#0a5c53] hover:bg-[#07463f] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
          >
            <RotateCcw /> {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const hasData = trackerData.length > 0;

  return (
    <div className="space-y-8 animate-fade-in text-[#1e293b]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[#5c6e6a] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('maintenance.serviceLifecycle')}</p>
          <h2 className="text-3xl font-bold text-[#0a5c53] tracking-tight">{t('maintenance.title')}</h2>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#0a5c53]/10 shadow-sm">
          <CheckCircle className="text-[#0a5c53]" />
          <span className="text-xs font-bold text-[#5c6e6a] uppercase tracking-widest">{t('maintenance.allSystemsHealthy')}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">

        {/* Upcoming Maintenance Card */}
        {hasData && urgentItem ? (
          <div className="col-span-12 lg:col-span-8 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 hover:border-[#0a5c53]/30 hover:shadow-[0_8px_24px_rgba(10,92,83,0.04)] transition-all duration-300 shadow-sm">
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-[#f3f7f6]" cx="72" cy="72" r="60" fill="transparent" stroke="currentColor" strokeWidth="8" />
                <circle className="text-[#0a5c53] transition-all duration-1000 ease-out" cx="72" cy="72" r="60" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="377" strokeDashoffset={377 - (ringProgress / 100) * 354} strokeLinecap="round" />
              </svg>
              <div className="absolute text-center">
                <span className="block text-3xl font-extrabold text-[#0a5c53]">{urgentItem.remainingDays}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#5c6e6a]">{t('maintenance.daysLeft')}</span>
              </div>
            </div>
            <div className="flex-grow space-y-4 text-center md:text-left">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#0a5c53]/5 text-[#0a5c53] text-[10px] font-bold border border-[#0a5c53]/15 mb-2">
                  {t('maintenance.criticalTask')}
                </span>
                <h3 className="text-xl font-bold text-[#0a5c53]">{urgentItem.serviceType || urgentItem.device}</h3>
                <p className="text-[#5c6e6a] text-sm mt-1 max-w-md">{urgentItem.notes || t('maintenance.hvacDescription')}</p>
              </div>
              <div className="flex flex-wrap gap-3 pt-1 justify-center md:justify-start">
                <button
                  onClick={() => handleSchedule(urgentItem)}
                  className="bg-[#0a5c53] hover:bg-[#07463f] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 duration-200"
                >
                  {t('maintenance.scheduleNow')}
                </button>
              </div>
            </div>
          </div>
        ) : hasData && !urgentItem ? (
          <div className="col-span-12 lg:col-span-8 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 rounded-full bg-[#f3f7f6] flex items-center justify-center mb-4">
              <CheckCircle className="text-[#0a5c53] text-xl" />
            </div>
            <p className="text-[#0a5c53] font-bold text-lg">{t('maintenance.allSystemsHealthy')}</p>
            <p className="text-[#5c6e6a] text-sm mt-1">{t('dashboard.noMaintenance')}</p>
          </div>
        ) : (
          <div className="col-span-12 lg:col-span-8 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 rounded-full bg-[#f3f7f6] flex items-center justify-center mb-4">
              <ClipboardList className="text-[#0a5c53] text-xl" />
            </div>
            <p className="text-[#0a5c53] font-bold text-lg">{t('maintenance.allSystemsHealthy')}</p>
            <p className="text-[#5c6e6a] text-sm mt-1">{t('dashboard.noMaintenance')}</p>
          </div>
        )}

        {/* System Reminders */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 flex-1 shadow-sm">
            <h4 className="font-bold text-[#0a5c53] mb-4 flex items-center gap-2">
              <Bell className="text-[#2ec4b6]" />
              {t('maintenance.systemAlerts')}
            </h4>
            <motion.div
              className="space-y-4"
              variants={reducedMotion ? {} : staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={reducedMotion ? {} : slideRight} className="flex items-start gap-4 p-3 rounded-xl bg-[#f3f7f6] border border-[#0a5c53]/5">
                <div className="p-2 rounded-lg bg-[#0a5c53]/5 text-[#0a5c53]">
                  <Droplets size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1e293b]">{t('maintenance.waterSoftenerLow')}</p>
                  <p className="text-[11px] text-[#5c6e6a] mt-0.5 font-medium">{t('maintenance.waterSoftenerDesc')}</p>
                </div>
              </motion.div>
              <motion.div variants={reducedMotion ? {} : slideRight} className="flex items-start gap-4 p-3 rounded-xl bg-[#f3f7f6] border border-[#0a5c53]/5">
                <div className="p-2 rounded-lg bg-[#2ec4b6]/10 text-[#0a5c53]">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1e293b]">{t('maintenance.firmwareUpdate')}</p>
                  <p className="text-[11px] text-[#5c6e6a] mt-0.5 font-medium">{t('maintenance.firmwareUpdateDesc')}</p>
                </div>
              </motion.div>
              {anomalyAlerts.map((alert, idx) => (
                <motion.div key={`alert-${idx}`} variants={reducedMotion ? {} : slideRight} className="flex items-start gap-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <AlertTriangle className="text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1e293b]">{alert.title}</p>
                    <p className="text-[11px] text-[#5c6e6a] mt-0.5 font-medium">{alert.desc}</p>
                  </div>
                </motion.div>
              ))}
              {trackerData.filter(item => item.status === 'warning' || item.status === 'error').map((item, idx) => (
                <motion.div key={`tracker-alert-${idx}`} variants={reducedMotion ? {} : slideRight} className="flex items-start gap-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <Wrench className="text-sm" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1e293b]">{item.serviceType || item.device}</p>
                    <p className="text-[11px] text-[#5c6e6a] mt-0.5 font-medium">{item.notes || `${t('maintenance.remainingDays')}: ${item.remainingDays || '-'}`}</p>
                  </div>
                </motion.div>
              ))}
              {!trackerData.some(item => item.status === 'warning' || item.status === 'error') && anomalyAlerts.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-[#5c6e6a] font-medium">{t('dashboard.noAlerts')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Warranty Expiry Timeline */}
        <section className="col-span-12 bg-white border border-[#0a5c53]/10 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0a5c53]">{t('maintenance.warrantyExpiry')}</h3>
            <span className="text-xs text-[#5c6e6a]">{t('maintenance.lastSynced')}</span>
          </div>
          {warrantyItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {warrantyItems.map((item, idx) => {
                const months = monthsBetween(new Date(), new Date(item.warrantyExpiry));
                const years = Math.floor(months / 12);
                const remainingMonths = months % 12;
                const barColor = idx === 1 ? '#2ec4b6' : '#0a5c53';
                const barPercent = warrantyBars[idx] || 0;
                return (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-[#1e293b]">{item.device || t('maintenance.wholeHomeBattery')}</span>
                      <span className={idx === 1 ? 'text-[#2ec4b6] font-bold' : 'text-[#0a5c53]'}>
                        {years > 0
                          ? t('maintenance.yearsLeft', { count: years })
                          : t('maintenance.monthsLeft', { count: Math.max(1, remainingMonths) })}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#f3f7f6] rounded-full overflow-hidden border border-[#0a5c53]/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                        initial={reducedMotion ? {} : { width: '0%' }}
                        animate={reducedMotion ? {} : { width: `${barPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 + idx * 0.1 }}
                      />
                    </div>
                    <p className="text-[10px] text-[#5c6e6a]">
                      {item.notes
                        ? t('maintenance.manufacturer', { name: item.notes })
                        : `${t('maintenance.warranty')}: ${formatDate(item.warrantyExpiry)}`}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-[#f3f7f6] flex items-center justify-center mx-auto mb-3">
                <Calendar className="text-[#0a5c53] text-lg" />
              </div>
              <p className="text-sm font-bold text-[#0a5c53]">{t('maintenance.allSystemsHealthy')}</p>
              <p className="text-xs text-[#5c6e6a] mt-1">{t('dashboard.noMaintenance')}</p>
            </div>
          )}
        </section>

        {/* Service History List */}
        <section className="col-span-12 bg-white border border-[#0a5c53]/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#0a5c53]/5 flex justify-between items-center bg-[#f3f7f6]/30">
            <h3 className="text-base font-bold text-[#0a5c53]">{t('maintenance.serviceHistory')}</h3>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs text-[#0a5c53] font-bold uppercase tracking-wider hover:bg-[#0a5c53]/10 px-3 py-1.5 rounded transition-all"
            >
              <Download className="text-xs" />
              {t('maintenance.exportLogs')}
            </button>
          </div>
          {serviceHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f3f7f6]/50">
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-[#5c6e6a] border-b border-[#0a5c53]/5">{t('maintenance.serviceType')}</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-[#5c6e6a] border-b border-[#0a5c53]/5">{t('maintenance.date')}</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-[#5c6e6a] border-b border-[#0a5c53]/5">{t('maintenance.status')}</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-[#5c6e6a] border-b border-[#0a5c53]/5">{t('maintenance.provider')}</th>
                    <th className="px-6 py-3.5 font-bold text-xs uppercase tracking-wider text-[#5c6e6a] border-b border-[#0a5c53]/5 text-right">{t('maintenance.amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0a5c53]/5 text-[#1e293b]">
                  {serviceHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f3f7f6]/30 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="p-2.5 rounded bg-[#f3f7f6] border border-[#0a5c53]/10 text-[#0a5c53]">
                          <Wrench />
                        </div>
                        <span className="font-bold text-sm text-[#0a5c53]">{item.serviceType}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#5c6e6a] font-medium">{formatDate(item.date)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0a5c53]/10 text-[#0a5c53] text-[10px] font-bold border border-[#0a5c53]/20">
                          {item.status === 'completed' || item.status === 'Completed'
                            ? t('common.completed')
                            : item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs italic text-[#5c6e6a]">{item.provider}</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-[#0a5c53]">{item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#f3f7f6] flex items-center justify-center mb-3">
                <Wrench className="text-[#0a5c53] text-lg" />
              </div>
              <p className="text-sm font-bold text-[#0a5c53]">{t('maintenance.allSystemsHealthy')}</p>
              <p className="text-xs text-[#5c6e6a] mt-1">{t('dashboard.noMaintenance')}</p>
            </div>
          )}
        </section>

      </div>

    </div>
  );
};

export default Maintenance;
