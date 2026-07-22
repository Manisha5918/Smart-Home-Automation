import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminReportsService, adminService } from '../../services/api';
import { File, FileSpreadsheet, Calendar, Download, Zap, Cpu, Activity, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const reportTypes = [
  {
    id: 'energy',
    title: 'Energy Report',
    description: 'Energy consumption and cost analysis',
    icon: Zap,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    dataKey: 'energyData',
    summaryFields: [
      { label: 'Today', key: 'todayUsage', suffix: ' kWh' },
      { label: 'Weekly', key: 'weeklyUsage', suffix: ' kWh' },
      { label: 'Monthly', key: 'monthlyUsage', suffix: ' kWh' }
    ]
  },
  {
    id: 'device',
    title: 'Device Report',
    description: 'Device status and performance metrics',
    icon: Cpu,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    dataKey: 'deviceData',
    summaryFields: [
      { label: 'Total Devices', key: 'totalDevices' },
      { label: 'Faulty', key: 'faultyDevices' },
      { label: 'Avg Health', key: 'averageHealthScore', suffix: '%' }
    ]
  },
  {
    id: 'activity',
    title: 'Activity Report',
    description: 'User actions and system events audit',
    icon: Activity,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.1)',
    dataKey: 'activityData',
    summaryFields: [
      { label: 'Total', key: 'totalActivities' },
      { label: 'Today', key: 'todayActivities' },
      { label: 'Monthly', key: 'monthlyActivities' }
    ]
  }
];

const reportColorStyles = {
  energy: { color: 'text-[#F59E0B]', bg: 'bg-[rgba(245,158,11,0.1)]' },
  device: { color: 'text-[#3B82F6]', bg: 'bg-[rgba(59,130,246,0.1)]' },
  activity: { color: 'text-[#8B5CF6]', bg: 'bg-[rgba(139,92,246,0.1)]' },
};

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' }
];

const AdminReports = () => {
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState({ energy: true, device: true, activity: true, reports: true });
  const [error, setError] = useState({ energy: null, device: null, activity: null, reports: null });
  const [energyData, setEnergyData] = useState(null);
  const [deviceData, setDeviceData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [reports, setReports] = useState([]);
  const [generating, setGenerating] = useState(null);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.allSettled([
        adminService.getEnergyOverview(),
        adminService.getDeviceMetrics(),
        adminService.getActivitySummary(),
        adminReportsService.getReports()
      ]);

      const [energyRes, deviceRes, activityRes, reportsRes] = results;

      if (energyRes.status === 'fulfilled') {
        setEnergyData(energyRes.value);
      } else {
        setError(prev => ({ ...prev, energy: energyRes.reason?.response?.data?.message || energyRes.reason?.message || 'Failed to load energy data' }));
      }
      setLoading(prev => ({ ...prev, energy: false }));

      if (deviceRes.status === 'fulfilled') {
        setDeviceData(deviceRes.value);
      } else {
        setError(prev => ({ ...prev, device: deviceRes.reason?.response?.data?.message || deviceRes.reason?.message || 'Failed to load device data' }));
      }
      setLoading(prev => ({ ...prev, device: false }));

      if (activityRes.status === 'fulfilled') {
        setActivityData(activityRes.value);
      } else {
        setError(prev => ({ ...prev, activity: activityRes.reason?.response?.data?.message || activityRes.reason?.message || 'Failed to load activity data' }));
      }
      setLoading(prev => ({ ...prev, activity: false }));

      if (reportsRes.status === 'fulfilled') {
        setReports(Array.isArray(reportsRes.value) ? reportsRes.value : []);
      } else {
        setError(prev => ({ ...prev, reports: reportsRes.reason?.response?.data?.message || reportsRes.reason?.message || 'Failed to load reports' }));
      }
      setLoading(prev => ({ ...prev, reports: false }));
    };
    fetchAll();
  }, []);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printPdf = (htmlContent) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.bottom = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlContent);
    iframe.contentDocument.close();
    iframe.contentWindow.addEventListener('afterprint', () => {
      document.body.removeChild(iframe);
    }, { once: true });
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  const buildHtmlReport = (type, data, generatedBy) => {
    const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;
    const rows = Object.entries(data).filter(([k]) => !Array.isArray(data[k])).map(([k, v]) =>
      `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;color:#374151;font-weight:600;text-transform:capitalize;background:#f9fafb">${k.replace(/([A-Z])/g, ' $1').trim()}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;color:#111827">${v ?? '—'}</td></tr>`
    ).join('');
    const arrays = Object.entries(data).filter(([k]) => Array.isArray(data[k]));
    const tables = arrays.map(([k, arr]) => {
      if (!arr.length) return '';
      const cols = Object.keys(arr[0]);
      const header = cols.map(c => `<th style="padding:8px 12px;border:1px solid #e5e7eb;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;background:#f3f4f6">${c}</th>`).join('');
      const body = arr.map(item => `<tr>${cols.map(c => `<td style="padding:6px 12px;border:1px solid #e5e7eb;font-size:12px;color:#374151">${item[c] ?? '—'}</td>`).join('')}</tr>`).join('');
      return `<h3 style="font-size:14px;font-weight:700;color:#111827;margin:20px 0 8px;text-transform:capitalize">${k.replace(/([A-Z])/g, ' $1').trim()}</h3><table style="width:100%;border-collapse:collapse;margin-bottom:16px"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
    }).join('');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body style="font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:32px 24px;background:#fff"><div style="border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:24px"><h1 style="font-size:22px;font-weight:800;color:#111827;margin:0">${title}</h1><p style="font-size:12px;color:#6b7280;margin:4px 0 0">Generated by ${generatedBy} on ${new Date().toLocaleString()}</p></div><table style="width:100%;border-collapse:collapse;margin-bottom:24px">${rows}</table>${tables}</body></html>`;
  };

  const downloadCsv = (data, filename) => {
    const flatten = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
      typeof v === 'object' && v !== null && !Array.isArray(v)
        ? flatten(v, `${prefix}${k}.`)
        : [[`${prefix}${k}`, Array.isArray(v) ? JSON.stringify(v) : String(v)]]
    );
    const csvContent = '\uFEFF' + flatten(data).map(r => `${r[0]},${r[1]}`).join('\n');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
  };

  const handleGenerate = useCallback(async (type, format) => {
    setGenerating(`${type}-${format}`);
    try {
      const result = await adminReportsService.generateReport(type, format, { period: dateRange });
      const ts = new Date().toISOString().slice(0, 10);
      const reportData = result.data || result;
      if (format === 'csv') {
        downloadCsv(reportData, `${type}-report-${ts}.csv`);
      } else {
        const html = buildHtmlReport(type, reportData, result.generatedBy || 'Admin');
        printPdf(html);
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`);
      const updated = await adminReportsService.getReports();
      setReports(Array.isArray(updated) ? updated : []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to generate report');
    } finally {
      setGenerating(null);
    }
  }, [dateRange]);

  const handleQuickExport = useCallback(async (type) => {
    setExporting(type);
    try {
      const result = await adminReportsService.generateReport(type, 'csv', { period: dateRange });
      const ts = new Date().toISOString().slice(0, 10);
      const reportData = result.data || result;
      downloadCsv(reportData, `${type}-export-${ts}.csv`);
      toast.success(`${type} data downloaded as CSV`);
      const updated = await adminReportsService.getReports();
      setReports(Array.isArray(updated) ? updated : []);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to export data');
    } finally {
      setExporting(null);
    }
  }, [dateRange]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getValByKey = (obj, key) => {
    const v = obj?.[key];
    return v !== undefined && v !== null ? v : '—';
  };

  const renderSummary = (fields, data) => {
    if (!data) return null;
    return (
      <div className="flex gap-3 flex-wrap my-2 mb-3">
        {fields.map(f => (
          <div key={f.key} className="flex-1 min-w-[60px]">
            <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-[0.05em]">{f.label}</p>
            <p className="text-base font-bold text-[var(--text-primary)]">
              {getValByKey(data, f.key)}{f.suffix || ''}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="sr-only">Admin Reports</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Analytics & Export</p>
        <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">Reports</h2>
      </div>

      <motion.div
        className="flex flex-wrap gap-4 mb-6 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[var(--radius-xl)]"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[var(--text-muted)]" />
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-[var(--radius-md)] text-xs font-bold px-3 py-2 text-[var(--text-secondary)] outline-none cursor-pointer"
          >
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <div className="admin-cards-grid">
        {reportTypes.map((report, idx) => {
          const dataMap = { energy: energyData, device: deviceData, activity: activityData };
          const loadingMap = { energy: loading.energy, device: loading.device, activity: loading.activity };
          const errorMap = { energy: error.energy, device: error.device, activity: error.activity };
          const data = dataMap[report.id];
          const isGenerating = generating === `${report.id}-pdf` || generating === `${report.id}-csv`;
          const IconComp = report.icon;
          const style = reportColorStyles[report.id] || { color: 'text-[var(--text-primary)]', bg: 'bg-[var(--bg-tertiary)]' };

          return (
            <motion.div key={report.id} className="admin-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-[var(--radius-xl)] flex items-center justify-center ${style.bg} ${style.color}`}>
                  <IconComp size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{report.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{report.description}</p>
                </div>
              </div>

              <div className="min-h-[80px]">
                {loadingMap[report.id] ? (
                  <div className="flex items-center justify-center h-[80px]">
                    <div className="spinner spinner-sm"></div>
                  </div>
                ) : errorMap[report.id] ? (
                  <div className="flex items-center gap-2 py-2 text-[var(--accent-danger)]">
                    <AlertCircle size={14} />
                    <span className="text-[11px]">{errorMap[report.id]}</span>
                  </div>
                ) : data ? (
                  renderSummary(report.summaryFields, data)
                ) : (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">No data available</p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={() => handleGenerate(report.id, 'pdf')}
                  disabled={isGenerating}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-[var(--radius-xl)] border-none transition-all flex items-center justify-center gap-1.5 ${
                    isGenerating ? 'bg-[#059669] text-white opacity-60 cursor-not-allowed' : 'bg-[#059669] text-white cursor-pointer opacity-100'
                  }`}
                >{isGenerating ? <><span className="spinner w-3 h-3 border-2 border-t-[var(--text-white)]"></span> Generating...</> : 'Generate PDF'}</button>
                <button
                  onClick={() => handleGenerate(report.id, 'csv')}
                  disabled={isGenerating}
                  className={`px-3.5 py-2.5 text-sm font-bold rounded-[var(--radius-xl)] border-none transition-all flex items-center gap-1 ${
                    isGenerating ? 'bg-[#374151] text-white opacity-60 cursor-not-allowed' : 'bg-[#374151] text-white cursor-pointer'
                  }`}
                  title="Export CSV"
                ><FileSpreadsheet size={14} /> CSV</button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div className="admin-card mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="admin-card-header">
          <h3><Clock size={16} className="mr-1.5" /> Recent Reports</h3>
        </div>
        {loading.reports ? (
          <div className="flex items-center justify-center p-8">
            <div className="spinner spinner-sm"></div>
          </div>
        ) : error.reports ? (
          <div className="flex items-center gap-2 p-4 text-[var(--accent-danger)]">
            <AlertCircle size={14} />
            <span className="text-xs">{error.reports}</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center p-8 text-[var(--text-muted)] text-sm">
            <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
            <p>No reports generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                  <tr>
                    <th>Report Type</th>
                    <th>Format</th>
                    <th>Period</th>
                    <th>Generated By</th>
                    <th>Generated</th>
                    <th>Status</th>
                  </tr>
              </thead>
              <tbody>
                  {reports.map((rpt, idx) => (
                    <tr key={rpt.id || idx}>
                      <td className="text-sm font-semibold text-[var(--text-primary)] capitalize">{rpt.type || '—'}</td>
                      <td className="text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1">
                          {rpt.format === 'pdf' ? <File size={12} /> : <FileSpreadsheet size={12} />}
                          {(rpt.format || '—').toUpperCase()}
                        </span>
                      </td>
                      <td className="text-xs text-[var(--text-secondary)] capitalize">{rpt.period || '—'}</td>
                      <td className="text-xs text-[var(--text-secondary)]">{rpt.generatedBy || '—'}</td>
                      <td className="text-xs text-[var(--text-muted)] font-mono">{formatDate(rpt.createdAt || rpt.generatedAt)}</td>
                      <td>
                        <span className={`admin-badge ${rpt.status === 'Completed' || rpt.status === 'Ready' ? 'admin-badge-success' : rpt.status === 'Failed' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                          {rpt.status || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div className="admin-card mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="admin-card-header">
          <h3><Download size={16} className="mr-1.5" /> Quick Export</h3>
        </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
            {[
              { type: 'energy', label: 'Energy Data' },
              { type: 'activity', label: 'User Logs' },
              { type: 'device', label: 'Device Inventory' }
            ].map(btn => {
              const isExporting = exporting === btn.type;
              return (
                <button key={btn.type}
                  onClick={() => handleQuickExport(btn.type)}
                  disabled={isExporting}
                  className={`px-3 py-2 rounded-[var(--radius-md)] border-none transition-all flex items-center gap-1.5 bg-[#059669] ${
                    isExporting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isExporting ? (
                    <div className="spinner w-3 h-3 border-2 border-t-[var(--text-white)] border-l-[var(--text-white)] shrink-0"></div>
                  ) : (
                    <Download size={12} className="text-white shrink-0" />
                  )}
                  <span className="text-[10px] font-bold text-white">{isExporting ? 'Exporting...' : btn.label}</span>
                </button>
              );
            })}
          </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminReports;
