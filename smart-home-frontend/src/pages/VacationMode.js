import React, { useState, useEffect } from 'react';
import { vacationModeService } from '../services/api';
import { Calendar, Shield, Zap, Leaf, DollarSign, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import { useTranslation } from 'react-i18next';

const VacationMode = () => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);

  // Form states
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [enableSecurity, setEnableSecurity] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await vacationModeService.getSummary();
      if (data && !data.message) {
        setIsActive(data.vacationStatus === 'Active');
        setSummary(data);
      } else {
        setIsActive(false);
        setSummary(null);
      }
    } catch (err) {
      console.error('Failed to load vacation summary:', err);
      setIsActive(false);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error(t('validation.selectDates', 'Please select both start and end dates.'));
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error(t('validation.invalidDateRange', 'Start date cannot be after end date.'));
      return;
    }

    try {
      setSubmitting(true);
      const dto = {
        StartDate: new Date(startDate).toISOString(),
        EndDate: new Date(endDate).toISOString(),
        EnableSecurityMode: enableSecurity
      };
      await vacationModeService.enable(dto);
      toast.success(t('vacation.enableSuccess', 'Vacation Mode successfully enabled.'));
      fetchSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('vacation.enableFailed', 'Failed to activate Vacation Mode.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSubmitting(true);
      await vacationModeService.disable();
      toast.success(t('vacation.disableSuccess', 'Vacation Mode deactivated. Standard schedule resumed.'));
      fetchSummary();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('vacation.disableFailed', 'Failed to deactivate Vacation Mode.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <Skeleton className="h-10 w-48 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-[var(--text-primary)] p-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-[0.2em] mb-1">
            {t('common.subtitle', 'Intelligent Home Management')}
          </p>
          <h1 className="sr-only">Vacation Mode</h1>
          <h2 className="text-3xl font-extrabold text-[#16A34A] tracking-tight">
            {t('navigation.vacation', 'Vacation Mode')}
          </h2>
        </div>
        {summary && isActive && (
          <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] px-4 py-2 rounded-full border border-[var(--border-color)] shadow-sm">
            <Calendar className="text-[var(--accent-secondary)]" />
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              {t('vacation.activeDaysScheduled', { defaultValue: 'Active: {count} Days Scheduled', count: summary.durationDays })}
            </span>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Toggle/Configure Panel */}
        <section className="col-span-12 lg:col-span-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 relative overflow-hidden shadow-sm">
          <div className="relative z-10 flex flex-col justify-between h-full gap-8">
            <div className="max-w-md space-y-3">
              <span className="bg-[var(--accent-primary-dim)] text-[var(--accent-secondary)] px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase border border-[var(--border-color)]">
                {t('vacation.resourceConservation', 'RESOURCE CONSERVATION')}
              </span>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {isActive ? (t('vacation.modeEngaged', 'Vacation Mode Engaged')) : (t('vacation.configureSchedule', 'Configure Vacation Schedule'))}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                {t('vacation.description', 'Reduce energy consumption while away. Connected devices will be set to minimum standby modes, scheduled automation triggers will pause, and security shielding will be fully armed.')}
              </p>
            </div>

            {isActive ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-6 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{t('vacation.currentlyMonitoring', 'Vacation mode is currently monitoring your home')}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t('vacation.conservingProfiles', 'Connected devices are set to resource-conserving profiles.')}</p>
                </div>
                <button
                  onClick={handleDeactivate}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {submitting ? (t('common.deactivating', 'Deactivating...')) : (t('common.deactivate', 'Deactivate'))}
                </button>
              </div>
            ) : (
              <form onSubmit={handleActivate} className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 w-full">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="startDate">{t('vacation.departureDate', 'Departure Date')}</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] focus:border-[var(--border-focus)] text-[var(--text-primary)] px-3 py-2 outline-none rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]" htmlFor="endDate">{t('vacation.returnDate', 'Return Date')}</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-input)] focus:border-[var(--border-focus)] text-[var(--text-primary)] px-3 py-2 outline-none rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-secondary)]">
                    <input
                      type="checkbox"
                      checked={enableSecurity}
                      onChange={(e) => setEnableSecurity(e.target.checked)}
                      className="rounded border-[var(--border-input)] text-[var(--accent-primary)] focus:ring-0 bg-[var(--bg-input)] w-4 h-4"
                    />
                    {t('vacation.enableSecurityShield', 'Enable Security Shield')}
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (t('common.enabling', 'Enabling...')) : (t('vacation.activateMode', 'Activate Mode'))}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Security Status Panel */}
        <section className="col-span-12 lg:col-span-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
            <Shield className="text-9xl text-[var(--accent-secondary)]" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary-dim)] flex items-center justify-center border border-[var(--border-color)] text-[var(--accent-secondary)]">
              <Shield className="text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{t('vacation.securityStatus', 'Security Shield')}</h3>
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[var(--accent-primary)] animate-pulse' : 'bg-[var(--text-disabled)]'}`}></span>
                {t('vacation.shieldStatus', 'Shield Status:')} {isActive && summary ? t('status.' + summary.securityStatus.toLowerCase()) || summary.securityStatus : t('status.disabled', 'Disabled')}
              </p>
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)] text-xs font-semibold">{t('vacation.sensorGrid', 'Sensor Grid')}</span>
              <span className={`text-xs font-bold ${isActive ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-disabled)]'}`}>
                {isActive ? (t('status.protected', 'Protected')) : (t('status.standby', 'Standby'))}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)] text-xs font-semibold">{t('vacation.relayProtection', 'Relay Protection')}</span>
              <span className={`text-xs font-bold ${isActive ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-disabled)]'}`}>
                {isActive ? (t('common.active', 'Active')) : (t('status.standby', 'Standby'))}
              </span>
            </div>
          </div>
        </section>

        {/* Stats Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Energy Saved */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-dim)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-secondary)]">
                <Zap />
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{t('vacation.energySaved', 'Energy Saved')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                {isActive && summary ? summary.energySaved : t('vacation.valueZero', '0.00 kWh')}
              </span>
            </div>
          </div>

          {/* Money Saved */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-dim)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-secondary)]">
                <DollarSign />
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{t('vacation.moneySaved', 'Money Saved')}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                {isActive && summary ? summary.moneySaved : t('vacation.valueZeroMoney', '₹0.00')}
              </span>
            </div>
          </div>

          {/* CO2 Reduced */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-dim)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-secondary)]">
                <Leaf />
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{t('vacation.co2Saved', 'CO2 Reduced')}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                {isActive && summary ? summary.co2Saved : t('vacation.valueZeroCo2', '0.00 kg')}
              </span>
            </div>
          </div>

        </div>

        {summary && (
          <section className="col-span-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('vacation.activeScheduleSummary', 'Active Schedule Summary')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)]">{t('vacation.devicesTurnedOff', 'Devices Turned Off')}</span>
                  <span className="text-[var(--text-primary)] font-bold">{summary.devicesTurnedOff}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)]">{t('vacation.devicesKeptRunning', 'Devices Kept Running')}</span>
                  <span className="text-[var(--text-primary)] font-bold">{summary.devicesKeptRunning}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center p-6 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl text-center">
                <Info className="text-[var(--accent-secondary)] text-2xl mb-2" />
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('vacation.safetyDevicesWarning', 'Devices kept running include safety-critical elements such as security cameras, alarms, and fire detectors.')}
                </p>
              </div>
            </div>
          </section>
        )}

      </div>

    </div>
  );
};

export default VacationMode;
