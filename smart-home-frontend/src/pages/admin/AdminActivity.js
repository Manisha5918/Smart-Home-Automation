import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminService } from '../../services/api';
import { Activity, Search, ChevronLeft, ChevronRight, Shield, AlertTriangle, Cpu, User, History, Clock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const ITEMS_PER_PAGE = 20;

const actionIcons = {
  Login: User,
  Logout: User,
  Create: Cpu,
  Update: Cpu,
  Delete: AlertTriangle,
  Security: Shield,
  default: History
};

const actionColors = {
  Login: 'var(--accent-primary)',
  Logout: 'var(--text-secondary)',
  Create: '#10B981',
  Update: '#F59E0B',
  Delete: 'var(--accent-danger)',
  Security: '#8B5CF6'
};

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [selectedAction, setSelectedAction] = useState(null);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [logsRes, summaryRes] = await Promise.all([
          adminService.getActivityLogs(currentPage, ITEMS_PER_PAGE),
          adminService.getActivitySummary()
        ]);
        setLogs(logsRes.logs || []);
        setTotalLogs(logsRes.total || 0);
        setSummary(summaryRes);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    let result = logs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.action || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.userName || '').toLowerCase().includes(q) ||
        (l.userEmail || '').toLowerCase().includes(q) ||
        (l.deviceName || '').toLowerCase().includes(q)
      );
    }
    if (selectedAction) {
      result = result.filter(l => l.action === selectedAction);
    }
    setFiltered(result);
  }, [logs, search, selectedAction]);

  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE);

  const getStatusBadge = (status) => {
    const map = {
      Online: 'admin-badge-success',
      Offline: 'admin-badge-danger',
      Warning: 'admin-badge-warning',
      Active: 'admin-badge-success',
      Inactive: 'admin-badge-danger'
    };
    return map[status] || 'admin-badge-info';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !logs.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (error && !logs.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <AlertTriangle size={48} className="mx-auto mb-3 text-[var(--accent-danger)] opacity-50" />
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </motion.div>
    );
  }

  const byAction = summary?.byAction || [];

  const actionTypes = [...new Set(byAction.map(a => a.action))];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="sr-only">Admin Activity</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1">Audit Trail</p>
        <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">Activity Logs</h2>
      </div>

      {summary && (
        <div className="admin-stats-grid mb-6">
          <motion.div className="admin-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <div className="admin-stat-icon bg-[rgba(59,130,246,0.1)] text-[#3B82F6]">
              <Activity size={22} />
            </div>
            <div className="admin-stat-info">
              <h4>Total Activities</h4>
              <p>{summary.totalActivities ?? 0}</p>
            </div>
          </motion.div>
          <motion.div className="admin-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="admin-stat-icon bg-[rgba(16,185,129,0.1)] text-[#10B981]">
              <Clock size={22} />
            </div>
            <div className="admin-stat-info">
              <h4>Today</h4>
              <p>{summary.todayActivities ?? 0}</p>
            </div>
          </motion.div>
          <motion.div className="admin-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="admin-stat-icon bg-[rgba(245,158,11,0.1)] text-[#F59E0B]">
              <History size={22} />
            </div>
            <div className="admin-stat-info">
              <h4>This Month</h4>
              <p>{summary.monthlyActivities ?? 0}</p>
            </div>
          </motion.div>
        </div>
      )}

      {byAction.length > 0 && (
        <motion.div className="admin-card mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="admin-card-header">
            <h3><Activity size={16} className="mr-1.5" /> Activity Breakdown</h3>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byAction}>
                <XAxis dataKey="action" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={{ stroke: 'var(--border-color)' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--accent-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <motion.div className="admin-table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="admin-table-toolbar">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <h3 className="whitespace-nowrap">{totalLogs} Events</h3>
            <div className="flex gap-1.5 flex-wrap">
              {actionTypes.map(action => (
                <button
                  key={action}
                  onClick={() => setSelectedAction(selectedAction === action ? null : action)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border border-[var(--border-color)] uppercase tracking-wider cursor-pointer ${
                    selectedAction === action
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >{action}</button>
              ))}
            </div>
          </div>
          <div className="admin-table-search">
            <Search size={14} />
            <input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>Device</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[var(--text-muted)] text-sm">
                  {search || selectedAction ? 'No logs match your search criteria' : 'No activity logs found'}
                </td>
              </tr>
            ) : filtered.map((log, idx) => {
              const ActionIcon = actionIcons[log.action] || actionIcons.default;
              return (
                <motion.tr key={log.activityLogId || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                >
                  <td className="text-xs text-[var(--text-muted)] font-mono whitespace-nowrap">
                    {formatDate(log.createdAt || log.timestamp)}
                  </td>
                  <td>
                    <div className="flex flex-col gap-0">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{log.userName || 'System'}</span>
                      {log.userEmail && <span className="text-[11px] text-[var(--text-muted)]">{log.userEmail}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <ActionIcon size={13} color={actionColors[log.action] || 'var(--text-muted)'} />
                      <span className="text-sm text-[var(--text-primary)] font-medium">{log.action || '—'}</span>
                    </div>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)] max-w-[240px] truncate">
                    {log.description || '—'}
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">
                    {log.deviceName || '—'}
                  </td>
                  <td>
                    <span className={`admin-badge ${getStatusBadge(log.deviceStatus)}`}>
                      {log.deviceStatus || '—'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-[var(--border-color)]">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-1 text-xs font-semibold ${
                currentPage === 1 ? 'text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-secondary)] cursor-pointer'
              }`}
            ><ChevronLeft size={14} /> Prev</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-[30px] h-[30px] rounded-lg border border-[var(--border-color)] text-xs font-semibold cursor-pointer ${
                    currentPage === p
                      ? 'bg-[var(--accent-primary)] text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >{p}</button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-2.5 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-1 text-xs font-semibold ${
                currentPage === totalPages ? 'text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-secondary)] cursor-pointer'
              }`}
            >Next <ChevronRight size={14} /></button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminActivity;
