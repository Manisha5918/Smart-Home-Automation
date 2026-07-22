import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Activity, AlertTriangle, CheckCircle, Clock, Cpu, Shield, Wrench, BarChart3, HeartPulse } from 'lucide-react';
import { predictiveMaintenanceService, deviceHealthService, maintenanceService } from '../services/api';
import Skeleton from '../components/Skeleton';
import useReducedMotion from '../utils/useReducedMotion';
import { staggerContainer, fadeUp } from '../utils/motionVariants';

const PredictiveMaintenance = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const [deviceHealth, setDeviceHealth] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [tracker, setTracker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, preds, track] = await Promise.all([
        deviceHealthService.getMyDevices(),
        predictiveMaintenanceService.getMyPredictions(),
        maintenanceService.getTracker()
      ]);
      setDeviceHealth(Array.isArray(health) ? health : []);
      setPredictions(Array.isArray(preds) ? preds : []);
      setTracker(Array.isArray(track) ? track : []);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t('predictive.loadFailed', 'Failed to load predictive data');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getHealthCategory = (score) => {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'warning';
    return 'critical';
  };

  const getHealthColor = (score) => {
    const category = getHealthCategory(score);
    if (category === 'healthy') return '#0a5c53';
    if (category === 'warning') return '#f59e0b';
    return '#ef4444';
  };

  const getHealthBg = (score) => {
    const category = getHealthCategory(score);
    if (category === 'healthy') return 'bg-[#0a5c53]/10 text-[#0a5c53] border-[#0a5c53]/20';
    if (category === 'warning') return 'bg-amber-50 text-amber-600 border-amber-200';
    return 'bg-red-50 text-red-600 border-red-200';
  };

  const stats = {
    total: deviceHealth.length,
    healthy: deviceHealth.filter(d => getHealthCategory(d.healthScore) === 'healthy').length,
    warning: deviceHealth.filter(d => getHealthCategory(d.healthScore) === 'warning').length,
    critical: deviceHealth.filter(d => getHealthCategory(d.healthScore) === 'critical').length,
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse text-[#1e293b]">
        <div>
          <Skeleton width="180px" height="14px" className="mb-2" />
          <Skeleton width="280px" height="32px" />
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 shadow-sm">
              <Skeleton width="60%" height="14px" className="mb-3" />
              <Skeleton width="40px" height="32px" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton width="56px" height="56px" borderRadius="50%" />
                <div className="flex-1">
                  <Skeleton width="70%" height="16px" className="mb-1.5" />
                  <Skeleton width="40%" height="12px" />
                </div>
              </div>
              <Skeleton width="100%" height="10px" className="mb-4" />
              <div className="flex justify-between">
                <Skeleton width="30%" height="12px" />
                <Skeleton width="30%" height="12px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && deviceHealth.length === 0) {
    return (
      <div className="space-y-8 text-[#1e293b]">
        <div>
          <p className="text-[#5c6e6a] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('predictive.deviceHealth', 'Device Health')}</p>
          <h2 className="text-3xl font-bold text-[#0a5c53] tracking-tight">{t('predictive.title', 'Predictive Maintenance')}</h2>
        </div>
        <div className="bg-white border border-red-200 rounded-2xl p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-bold text-[#1e293b] mb-2">{t('predictive.loadError', 'Failed to load data')}</h3>
          <p className="text-sm text-[#5c6e6a] mb-6">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-[#0a5c53] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#07463f] transition-all shadow-sm"
          >
            {t('common.retry', 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[#1e293b]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <p className="text-[#5c6e6a] text-xs font-bold uppercase tracking-[0.2em] mb-1">{t('predictive.deviceHealth', 'Device Health')}</p>
          <h1 className="sr-only">Predictive Maintenance</h1>
          <h2 className="text-3xl font-bold text-[#0a5c53] tracking-tight">{t('predictive.title', 'Predictive Maintenance')}</h2>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#0a5c53]/10 shadow-sm">
          <HeartPulse className="text-[#0a5c53]" size={16} />
          <span className="text-xs font-bold text-[#5c6e6a] uppercase tracking-widest">
            {stats.healthy}/{stats.total} {t('predictive.healthy', 'Healthy')}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Cpu className="text-[#0a5c53]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('predictive.title', 'Total Devices')}</span>
          </div>
          <span className="text-3xl font-extrabold text-[#0a5c53]">{stats.total}</span>
        </div>
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-[#0a5c53]" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('predictive.healthy', 'Healthy')}</span>
          </div>
          <span className="text-3xl font-extrabold text-[#0a5c53]">{stats.healthy}</span>
        </div>
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="text-amber-500" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('predictive.warning', 'Warning')}</span>
          </div>
          <span className="text-3xl font-extrabold text-amber-500">{stats.warning}</span>
        </div>
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="text-red-500" size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5c6e6a]">{t('predictive.critical', 'Critical')}</span>
          </div>
          <span className="text-3xl font-extrabold text-red-500">{stats.critical}</span>
        </div>
      </div>

      {/* Device Health Cards */}
      {deviceHealth.length === 0 ? (
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl p-12 text-center shadow-sm">
          <Activity className="mx-auto mb-4 text-[#5c6e6a]" size={48} />
          <p className="text-sm font-medium text-[#5c6e6a]">{t('predictive.noData', 'No device health data available.')}</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={reducedMotion ? {} : staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {deviceHealth.map((device) => {
            const score = device.healthScore ?? 0;
            const color = getHealthColor(score);
            const category = getHealthCategory(score);
            const radius = 42;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            const prediction = predictions.find(p => p.deviceId === device.deviceId);
            const failureProb = prediction?.failureProbability ?? null;

            return (
              <motion.div
                key={device.deviceId}
                variants={reducedMotion ? {} : fadeUp}
                className="bg-white border border-[#0a5c53]/10 rounded-2xl p-6 hover:border-[#0a5c53]/30 hover:shadow-[0_8px_30px_rgba(10,92,83,0.06)] transition-all duration-300 shadow-sm"
              >
                {/* Top: Icon + Name + Type */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={radius} fill="none" stroke="#f3f7f6" strokeWidth="8" />
                      <circle
                        cx="50" cy="50" r={radius}
                        fill="none" stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={reducedMotion ? 0 : offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-extrabold text-[#0a5c53]">{score}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-[#0a5c53] truncate">{device.name}</h4>
                    <span className="text-[10px] font-bold text-[#5c6e6a] bg-[#f3f7f6] px-2 py-0.5 rounded border border-[#0a5c53]/5">
                      {device.type}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5c6e6a] font-medium">{t('predictive.failureProbability', 'Failure Probability')}</span>
                    <span className={`font-bold ${failureProb !== null && failureProb > 60 ? 'text-red-500' : 'text-[#0a5c53]'}`}>
                      {failureProb !== null ? `${failureProb}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5c6e6a] font-medium">{t('predictive.anomalies', 'Anomalies')}</span>
                    <span className="font-bold text-[#1e293b]">{device.totalAnomalies ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5c6e6a] font-medium">{t('predictive.lastUpdated', 'Last Updated')}</span>
                    <span className="font-bold text-[#1e293b]">
                      {device.lastHealthUpdated
                        ? new Date(device.lastHealthUpdated).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between pt-3 border-t border-[#0a5c53]/5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getHealthBg(score)}`}>
                    {category === 'healthy' && <CheckCircle size={12} />}
                    {category === 'warning' && <AlertTriangle size={12} />}
                    {category === 'critical' && <Shield size={12} />}
                    {category === 'healthy' ? t('predictive.healthy', 'Healthy') : category === 'warning' ? t('predictive.warning', 'Warning') : t('predictive.critical', 'Critical')}
                  </span>
                  <span className="text-xs font-mono text-[#5c6e6a]">{device.powerConsumption ?? 0} W</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Maintenance Predictions Timeline */}
      {tracker.length > 0 && (
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#0a5c53]/5 flex items-center gap-3 bg-[#f3f7f6]/30">
            <Wrench className="text-[#0a5c53]" size={18} />
            <h3 className="text-base font-bold text-[#0a5c53]">{t('predictive.maintenanceTimeline', 'Maintenance Timeline')}</h3>
          </div>
          <div className="divide-y divide-[#0a5c53]/5">
            {tracker.map((item, idx) => (
              <motion.div
                key={idx}
                initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="px-6 py-4 hover:bg-[#f3f7f6]/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-[#f3f7f6] border border-[#0a5c53]/10 text-[#0a5c53] flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0a5c53] truncate">{item.device}</p>
                      <p className="text-[11px] text-[#5c6e6a] font-medium">{item.serviceType}</p>
                      {item.notes && (
                        <p className="text-[10px] text-[#5c6e6a] mt-1 italic">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5c6e6a]">{t('predictive.upcoming', 'Upcoming')}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        item.status === 'Completed' || item.status === 'Healthy'
                          ? 'bg-[#0a5c53]/10 text-[#0a5c53] border-[#0a5c53]/20'
                          : item.remainingDays <= 7
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {item.status || (item.remainingDays <= 7 ? t('predictive.critical', 'Critical') : t('predictive.warning', 'Warning'))}
                      </span>
                    </div>
                    {item.nextService && (
                      <p className="text-xs font-mono text-[#5c6e6a]">
                        {new Date(item.nextService).toLocaleDateString()}
                      </p>
                    )}
                    {item.remainingDays !== undefined && item.remainingDays !== null && (
                      <p className="text-[10px] text-[#5c6e6a]">{item.remainingDays} {t('predictive.daysRemaining', 'days remaining')}</p>
                    )}
                  </div>
                </div>

                {/* Recommended Actions */}
                {item.notes && (
                  <div className="mt-3 ml-11 flex items-center gap-2">
                    <BarChart3 size={12} className="text-[#0a5c53]" />
                    <span className="text-[10px] text-[#0a5c53] font-medium">{t('predictive.recommendedActions', 'Recommended Actions')}: {item.notes}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Predictions-only section if we have predictions not linked to health devices */}
      {predictions.length > 0 && tracker.length === 0 && (
        <div className="bg-white border border-[#0a5c53]/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#0a5c53]/5 flex items-center gap-3 bg-[#f3f7f6]/30">
            <BarChart3 className="text-[#0a5c53]" size={18} />
            <h3 className="text-base font-bold text-[#0a5c53]">{t('predictive.predictions', 'Predictions')}</h3>
          </div>
          <div className="divide-y divide-[#0a5c53]/5">
            {predictions.map((pred, idx) => (
              <motion.div
                key={idx}
                initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="px-6 py-4 hover:bg-[#f3f7f6]/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#f3f7f6] border border-[#0a5c53]/10 text-[#0a5c53]">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0a5c53]">{t('predictive.devicePrefix', 'Device #')}{pred.deviceId}</p>
                      {pred.predictedAt && (
                        <p className="text-[10px] text-[#5c6e6a]">{t('predictive.predicted', 'Predicted:')} {new Date(pred.predictedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${pred.failureProbability > 60 ? 'text-red-500' : pred.failureProbability > 30 ? 'text-amber-500' : 'text-[#0a5c53]'}`}>
                    {t('predictive.failureProbability', 'Failure Probability')}: {pred.failureProbability ?? 'N/A'}%
                  </span>
                </div>
                {pred.recommendedActions && (
                  <div className="mt-2 ml-11 text-xs text-[#5c6e6a]">
                    <span className="font-bold text-[#0a5c53]">{t('predictive.recommendedActions', 'Recommended Actions')}:</span> {pred.recommendedActions}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PredictiveMaintenance;
