import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { automationRuleService, deviceService } from '../services/api';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  SlidersHorizontal,
  Clock,
  Zap,
  Search,
  Filter,
  RefreshCw,
  Droplets,
  Sun,
  CloudRain,
  Compass,
  X
} from 'lucide-react';

const AutomationRules = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('all');

  // Modal CRUD states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form handling
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
  const selectedTriggerType = watch('triggerType', 'Status');
  const selectedWeatherMetric = watch('weatherMetric', 'Temperature');

  const loadData = async () => {
    try {
      const rulesData = await automationRuleService.getAutomationRules();
      setRules(rulesData);
      const devicesData = await deviceService.getDevices();
      setDevices(devicesData);
    } catch (err) {
      console.error('Failed to load rules/devices:', err);
      toast.error(t('automation.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleGlobalSearch = (e) => {
      setSearchTerm(e.detail || '');
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, []);

  // Update default Trigger Values dynamically when Trigger Type changes in the form
  useEffect(() => {
    if (selectedTriggerType === 'Status') {
      setValue('triggerValue', 'On');
    } else if (selectedTriggerType === 'Power') {
      setValue('triggerValue', 'High');
    } else if (selectedTriggerType === 'Time') {
      setValue('triggerValue', '22:00');
    } else if (selectedTriggerType === 'Weather') {
      if (selectedWeatherMetric === 'Temperature') {
        setValue('triggerValue', '28°C');
      } else if (selectedWeatherMetric === 'Rain') {
        setValue('triggerValue', '60%');
      } else if (selectedWeatherMetric === 'AQI') {
        setValue('triggerValue', '100');
      } else if (selectedWeatherMetric === 'UV') {
        setValue('triggerValue', '5');
      } else if (selectedWeatherMetric === 'Humidity') {
        setValue('triggerValue', '70%');
      }
    }
  }, [selectedTriggerType, selectedWeatherMetric, setValue]);

  const openAddModal = () => {
    setEditingRule(null);
    reset({
      ruleName: '',
      deviceId: devices.length > 0 ? devices[0].deviceId.toString() : '',
      triggerType: 'Status',
      triggerValue: 'On',
      weatherMetric: 'Temperature',
      action: 'TurnOff'
    });
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    const isWeather = ['Temperature', 'Rain', 'AQI', 'UV', 'Humidity'].includes(rule.triggerType);
    reset({
      ruleName: rule.ruleName,
      deviceId: rule.deviceId.toString(),
      triggerType: isWeather ? 'Weather' : rule.triggerType,
      weatherMetric: isWeather ? rule.triggerType : 'Temperature',
      triggerValue: rule.triggerValue,
      action: rule.action
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (data) => {
    setSubmitting(true);
    const rulePayload = {
      deviceId: parseInt(data.deviceId),
      ruleName: data.ruleName.trim(),
      triggerType: data.triggerType === 'Weather' ? data.weatherMetric : data.triggerType,
      triggerValue: data.triggerValue,
      action: data.action
    };

    try {
      if (editingRule) {
        await automationRuleService.updateAutomationRule(editingRule.ruleId, rulePayload);
        toast.success(t('automation.updated'));
      } else {
        await automationRuleService.createAutomationRule(rulePayload);
        toast.success(t('automation.created'));
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || t('automation.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(t('automation.deleteConfirm', { name }))) {
      return;
    }
    try {
      await automationRuleService.deleteAutomationRule(id);
      toast.success(t('automation.deleted'));
      loadData();
    } catch (err) {
      toast.error(t('automation.deleteFailed'));
    }
  };

  const handleToggleActive = async (rule) => {
    const nextActive = !rule.isActive;
    try {
      // Optimistic toggling
      setRules(prev => prev.map(r => r.ruleId === rule.ruleId ? { ...r, isActive: nextActive } : r));
      const res = await automationRuleService.toggleAutomationRule(rule.ruleId);
      toast.success(res.message || (nextActive ? t('automation.toggledActive') : t('automation.toggledDisabled')));
      loadData();
    } catch (err) {
      toast.error(t('automation.toggleFailed'));
      loadData();
    }
  };

  const getTriggerIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'power': return <Zap size={16} className="text-[var(--accent-secondary)]" />;
      case 'time': return <Clock size={16} className="text-[var(--accent-warning)]" />;
      case 'temperature': return <Zap size={16} className="text-[#F56565]" />;
      case 'humidity': return <Droplets size={16} className="text-[#4299E1]" />;
      case 'rain': return <CloudRain size={16} className="text-[#3182CE]" />;
      case 'uv': return <Sun size={16} className="text-[#ED8936]" />;
      case 'aqi': return <Compass size={16} className="text-[#48BB78]" />;
      default: return <SlidersHorizontal size={16} className="text-[var(--accent-primary)]" />;
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rule.deviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrigger = triggerFilter === 'all' ||
                           (triggerFilter === 'weather'
                             ? ['temperature', 'rain', 'aqi', 'uv', 'humidity'].includes(rule.triggerType.toLowerCase())
                             : rule.triggerType.toLowerCase() === triggerFilter.toLowerCase());
    return matchesSearch && matchesTrigger;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="180px" height="32px" />
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-4 shadow-sm">
          <div className="flex gap-4">
            <Skeleton width="250px" height="40px" borderRadius="10px" />
            <Skeleton width="150px" height="40px" borderRadius="10px" />
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl shadow-sm h-[300px]">
          <Skeleton width="100%" height="250px" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only">Automation Rules</h1>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('automation.title')}</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">{t('automation.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all duration-200 border border-gray-100 dark:border-[var(--border-color)]"
            title={t('automation.syncRules')}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openAddModal}
            disabled={devices.length === 0}
            className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Plus size={16} />
            {t('automation.addRule')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-4 shadow-sm"
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex items-center min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 text-[var(--text-secondary)]" />
            <input
              type="text"
              className="h-10 pl-10 pr-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
              placeholder={t('automation.searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative flex items-center min-w-[220px] flex-1">
            <Filter size={14} className="absolute left-3 text-[var(--text-secondary)]" />
            <select
              className="h-10 pl-10 pr-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none"
              value={triggerFilter}
              onChange={e => setTriggerFilter(e.target.value)}
            >
              <option value="all">{t('automation.allTriggers')}</option>
              <option value="status">{t('automation.filterStatus')}</option>
              <option value="power">{t('automation.filterPower')}</option>
              <option value="time">{t('automation.filterTime')}</option>
              <option value="weather">{t('automation.filterWeather') || 'Weather'}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Premium Rules Table */}
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden"
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[#F9FAFB] dark:bg-[var(--bg-tertiary)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{t('automation.ruleDetails')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{t('automation.triggerLogic')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{t('automation.actionResult')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)]">{t('automation.status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-secondary)] text-right">{t('automation.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map(rule => (
                <tr key={rule.ruleId} className="border-b border-[var(--border-color)] hover:bg-[#F9FAFB] dark:hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                        rule.isActive ? 'bg-blue-500/10' : 'bg-gray-100 dark:bg-[var(--bg-tertiary)]'
                      }`}>
                        {getTriggerIcon(rule.triggerType)}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-[var(--text-primary)]">{rule.ruleName}</span>
                        <span className="text-xs text-[var(--text-secondary)] block">{t('automation.appliance', { name: rule.deviceName })}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">{t('automation.if')}</span>
                      <span className="text-[var(--text-secondary)]">
                        {rule.triggerType === 'Power' && t('automation.powerIs', { value: rule.triggerValue, detail: rule.triggerValue === 'High' ? '> 40W' : '< 10W' })}
                        {rule.triggerType === 'Status' && t('automation.stateChanges', { value: rule.triggerValue })}
                        {rule.triggerType === 'Time' && t('automation.clockTriggers', { value: rule.triggerValue })}
                        {['Temperature', 'Rain', 'AQI', 'UV', 'Humidity'].includes(rule.triggerType) && t('automation.weatherTriggers', { metric: rule.triggerType, value: rule.triggerValue })}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">{t('automation.then')}</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {rule.action === 'TurnOn' ? t('automation.switchON') : t('automation.switchOFF')}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => handleToggleActive(rule)}
                      />
                      <span className="slider"></span>
                    </label>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-1.5">
                      <button
                        onClick={() => openEditModal(rule)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all duration-200 border border-gray-100 dark:border-[var(--border-color)]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.ruleId, rule.ruleName)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 border border-gray-100 dark:border-[var(--border-color)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRules.length === 0 && (
          <div className="p-14 text-center text-[var(--text-secondary)]">
            <p>{t('automation.noRulesMatch')}</p>
            {devices.length === 0 ? (
              <p className="text-red-500 text-sm mt-2">{t('automation.noDevices')}</p>
            ) : (
              <button onClick={openAddModal} className="mt-4 h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200">
                {t('automation.setNewRule')}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(9,13,12,0.6)] backdrop-blur-[8px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-[520px] w-full shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 pb-3 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingRule ? t('automation.modifyRule') : t('automation.addRuleLabel')}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleModalSubmit)} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('automation.ruleLabelName')}</label>
                <input
                  type="text"
                  className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                  placeholder={t('automation.ruleNamePlaceholder')}
                  {...register('ruleName', { required: t('automation.ruleNameRequired') })}
                />
                {errors.ruleName && <span className="text-xs text-red-500 mt-1">{errors.ruleName.message}</span>}
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('automation.targetDevice')}</label>
                <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('deviceId', { required: t('automation.selectDevice') })}>
                  {devices.map(dev => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.name} ({dev.type})
                    </option>
                  ))}
                </select>
                {errors.deviceId && <span className="text-xs text-red-500 mt-1">{errors.deviceId.message}</span>}
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('automation.triggerParameter')}</label>
                <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerType')}>
                  <option value="Status">{t('automation.triggerStatus')}</option>
                  <option value="Power">{t('automation.triggerPower')}</option>
                  <option value="Time">{t('automation.triggerTime')}</option>
                  <option value="Weather">{t('automation.triggerWeather') || 'Weather Condition'}</option>
                </select>
              </div>

              {selectedTriggerType === 'Weather' && (
                <div className="space-y-1.5 mb-4">
                  <label className="text-sm font-semibold text-[var(--text-primary)]">{t('automation.weatherMetric') || 'Weather Parameter'}</label>
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('weatherMetric')}>
                    <option value="Temperature">Temperature</option>
                    <option value="Rain">Rain Probability</option>
                    <option value="AQI">Air Quality Index (AQI)</option>
                    <option value="UV">UV Index</option>
                    <option value="Humidity">Humidity</option>
                  </select>
                </div>
              )}

              {/* Dynamic values based on selected trigger type */}
              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('automation.triggerValue')}</label>

                {selectedTriggerType === 'Status' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="On">{t('automation.valueOn')}</option>
                    <option value="Off">{t('automation.valueOff')}</option>
                    <option value="Offline">{t('automation.valueOffline')}</option>
                  </select>
                )}

                {selectedTriggerType === 'Power' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="High">{t('automation.valueHigh')}</option>
                    <option value="Low">{t('automation.valueLow')}</option>
                  </select>
                )}

                {selectedTriggerType === 'Time' && (
                  <input
                    type="time"
                    className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                    {...register('triggerValue', { required: t('automation.timeRequired') })}
                  />
                )}

                {selectedTriggerType === 'Weather' && selectedWeatherMetric === 'Temperature' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="28°C">{"Hot (> 28°C)"}</option>
                    <option value="20°C">{"Cold (< 20°C)"}</option>
                    <option value="24°C">{"Pleasant (> 24°C)"}</option>
                  </select>
                )}

                {selectedTriggerType === 'Weather' && selectedWeatherMetric === 'Rain' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="60%">{"High Probability (> 60%)"}</option>
                    <option value="70%">{"Very High Probability (> 70%)"}</option>
                  </select>
                )}

                {selectedTriggerType === 'Weather' && selectedWeatherMetric === 'AQI' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="100">{"Poor AQI (> 100)"}</option>
                    <option value="150">{"Unhealthy AQI (> 150)"}</option>
                  </select>
                )}

                {selectedTriggerType === 'Weather' && selectedWeatherMetric === 'UV' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="5">{"Moderate/High UV (> 5)"}</option>
                    <option value="7">{"Very High UV (> 7)"}</option>
                  </select>
                )}

                {selectedTriggerType === 'Weather' && selectedWeatherMetric === 'Humidity' && (
                  <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('triggerValue')}>
                    <option value="70%">{"High Humidity (> 70%)"}</option>
                    <option value="80%">{"Very High Humidity (> 80%)"}</option>
                  </select>
                )}
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-semibold text-[var(--text-primary)]">{t('automation.actionExecution')}</label>
                <select className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full appearance-none" {...register('action')}>
                  <option value="TurnOff">{t('automation.actionOff')}</option>
                  <option value="TurnOn">{t('automation.actionOn')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)] mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <span className="spinner border-t-white w-4 h-4 inline-block"></span> : t('automation.setAutomation')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AutomationRules;
