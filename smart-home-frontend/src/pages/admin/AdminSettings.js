import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { adminSettingsService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Settings, Shield, Database, Save, RefreshCw, AlertCircle, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';

const categoryMeta = {
  General: { icon: Settings, color: '#3B82F6' },
  Security: { icon: Shield, color: '#EF4444' },
  'Data & Backup': { icon: Database, color: '#10B981' },
  default: { icon: Sliders, color: 'var(--text-secondary)' }
};

const categoryColorClass = {
  General: 'text-[#3B82F6]',
  Security: 'text-[#EF4444]',
  'Data & Backup': 'text-[#10B981]',
};

const categoryOrder = ['General', 'Security', 'Data & Backup'];

const selectableKeys = ['language', 'timezone', 'timeZone', 'frequency', 'backupFrequency', 'theme'];

const toggleKeys = ['enabled', 'mode', 'auth', 'notification', 'notifications', 'maintenance', 'registration', 'twoFactor'];

const numberKeys = ['timeout', 'attempts', 'limit', 'rate', 'retention', 'interval', 'port', 'max', 'min'];

const toTitleCase = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/(\d+)/g, ' $1')
    .trim();
};

const getInputType = (key, value) => {
  const lower = key.toLowerCase();
  if (toggleKeys.some(t => lower.includes(t))) return 'toggle';
  if (selectableKeys.some(s => lower.includes(s))) return 'select';
  if (numberKeys.some(n => lower.includes(n)) || typeof value === 'number') return 'number';
  return 'text';
};

const AdminSettings = () => {
  const [settings, setSettings] = useState([]);
  const [originalSettings, setOriginalSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminSettingsService.getSettings();
        const arr = Array.isArray(data) ? data : [];
        setSettings(arr);
        setOriginalSettings(JSON.parse(JSON.stringify(arr)));
      } catch (err) {
        setError(err.response?.data?.message || err.message || t('admin.settings.loadError', 'Failed to load settings'));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    const uncategorized = [];
    const emailKeys = ['email', 'mail', 'smtp', 'smtpPort', 'smtpHost', 'smtpUser', 'smtpPass', 'smtpSecure', 'fromEmail', 'fromName', 'mailgun', 'sendgrid', 'maintenancemessage', 'maintenancemode', 'pushnotification', 'smsnotification'].map(k => k.toLowerCase());
    settings.forEach(s => {
      const key = (s.key || '').toLowerCase();
      const cat = (s.category || '').toLowerCase();
      if (emailKeys.some(ek => key.includes(ek) || cat.includes(ek))) return;
      const category = s.category || 'Other';
      if (categoryOrder.includes(category) || category === 'Other') {
        if (!map[category]) map[category] = [];
        map[category].push(s);
      } else {
        uncategorized.push(s);
      }
    });
    if (uncategorized.length > 0) map['Other'] = uncategorized;
    return map;
  }, [settings]);

  const getChangedSettings = () => {
    const changed = [];
    settings.forEach(s => {
      const orig = originalSettings.find(o => o.settingId === s.settingId);
      if (!orig || orig.value !== s.value) {
        changed.push({ settingId: s.settingId, key: s.key, value: s.value, category: s.category });
      }
    });
    return changed;
  };

  const handleChange = (settingId, newValue) => {
    setSettings(prev => prev.map(s => s.settingId === settingId ? { ...s, value: newValue } : s));
  };

  const handleSave = async () => {
    const changed = getChangedSettings();
    if (changed.length === 0) {
      toast.error(t('admin.settings.noChanges', 'No changes to save'));
      return;
    }
    setSaving(true);
    try {
      await adminSettingsService.updateSettings(changed);
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      toast.success(t('admin.settings.saveSuccess', 'Settings saved successfully'));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t('admin.settings.saveError', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    toast.success(t('admin.settings.resetSuccess', 'Settings reset to saved values'));
  };

  const inputBase = 'w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-[border-color] duration-200';

  const renderInput = (setting) => {
    const type = getInputType(setting.key, setting.value);
    const label = toTitleCase(setting.key);

    if (type === 'toggle') {
      const checked = setting.value === true || setting.value === 'true' || setting.value === 'True';
      return (
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => handleChange(setting.settingId, e.target.checked)}
              className="absolute w-0 h-0 opacity-0"
            />
            <div className={`w-[38px] h-5 rounded-[10px] relative transition-[background] duration-200 border border-[var(--border-color)] ${
              checked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
            }`}>
              <div className={`absolute top-px w-4 h-4 rounded-full transition-[left] duration-200 ${
                checked ? 'left-[19px] bg-white' : 'left-px bg-[var(--text-muted)]'
              }`} />
            </div>
          </label>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
            {setting.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{setting.description}</p>}
          </div>
        </div>
      );
    }

    if (type === 'select') {
      const options = setting.value === 'true' || setting.value === 'false'
        ? ['true', 'false']
        : ['daily', 'weekly', 'monthly', 'hourly'];
      return (
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--text-muted)] block mb-1.5">{label}</label>
          <select value={String(setting.value)} onChange={e => handleChange(setting.settingId, e.target.value)} className={inputBase}>
            {options.map(o => <option key={o} value={o}>{toTitleCase(o)}</option>)}
          </select>
          {setting.description && <p className="text-xs text-[var(--text-muted)] mt-1">{setting.description}</p>}
        </div>
      );
    }

    const input = (type === 'number' ? 'number' : 'text');
    return (
      <div>
        <label className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--text-muted)] block mb-1.5">{label}</label>
        <input type={input} value={setting.value ?? ''} onChange={e => handleChange(setting.settingId, e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          className={inputBase}
        />
        {setting.description && <p className="text-xs text-[var(--text-muted)] mt-1">{setting.description}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <AlertCircle size={48} className="mx-auto mb-3 text-[var(--accent-danger)] opacity-50" />
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </motion.div>
    );
  }

  if (settings.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)] mb-1">{t('admin.settings.heading', 'System Configuration')}</p>
          <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">{t('admin.settings.title', 'Settings')}</h2>
        </div>
        <div className="admin-card text-center p-12">
          <Sliders size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm text-[var(--text-muted)]">{t('admin.settings.empty', 'No settings available')}</p>
        </div>
      </motion.div>
    );
  }

  const hasChanges = getChangedSettings().length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="sr-only">Admin Settings</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)] mb-1">{t('admin.settings.heading', 'System Configuration')}</p>
        <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">{t('admin.settings.title', 'Settings')}</h2>
      </div>

      <div className="flex flex-col gap-6">
        {categoryOrder.filter(cat => grouped[cat]).concat(Object.keys(grouped).filter(k => !categoryOrder.includes(k))).map((category, catIdx) => {
          const items = grouped[category] || [];
          const meta = categoryMeta[category] || categoryMeta.default;
          const IconComp = meta.icon;

          return (
            <motion.div key={category} className="admin-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.08 }}
            >
              <div className="admin-card-header">
                <h3><IconComp size={16} className={`mr-1.5 ${categoryColorClass[category] || 'text-[var(--text-secondary)]'}`} /> {category}</h3>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
                {items.map((setting, idx) => (
                  <motion.div key={setting.settingId || idx}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                  >
                    {renderInput(setting)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2.5 justify-end mt-6 py-4">
        <button onClick={handleReset} disabled={!hasChanges}
          className={`px-5 py-2.5 rounded-[var(--radius-md)] text-xs font-bold uppercase tracking-[0.05em] border border-[var(--border-color)] flex items-center gap-1.5 transition-all ${
            hasChanges
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-pointer'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
          }`}
        ><RefreshCw size={13} /> {t('admin.settings.reset', 'Reset')}</button>
        <button onClick={handleSave} disabled={!hasChanges || saving}
          className={`px-5 py-2.5 rounded-[var(--radius-md)] text-xs font-bold uppercase tracking-[0.05em] border-none flex items-center gap-1.5 transition-all ${
            !hasChanges || saving
              ? 'bg-[var(--accent-primary)] text-white opacity-60 cursor-not-allowed'
              : 'bg-[var(--accent-primary)] text-white cursor-pointer opacity-100'
          }`}
        ><Save size={13} /> {saving ? t('common.saving', 'Saving...') : t('admin.settings.saveSettings', 'Save Settings')}</button>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
