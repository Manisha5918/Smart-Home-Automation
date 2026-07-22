import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Search, Cpu, ChevronLeft, ChevronRight, AlertCircle, Activity } from 'lucide-react';

const AdminDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await adminService.getAllDevices();
        setDevices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || err?.message || 'Failed to load devices');
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const deviceTypes = ['All', ...new Set(devices.map(d => d.type).filter(Boolean))];

  const filtered = devices.filter(d => {
    const query = search.toLowerCase();
    const name = (d.name || '').toLowerCase();
    const owner = (d.ownerName || '').toLowerCase();
    const matchesSearch = name.includes(query) || owner.includes(query);
    const matchesType = filterType === 'All' || d.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getHealthColor = (score) => {
    if (score === null || score === undefined) return 'var(--text-muted)';
    if (score >= 80) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getHealthBg = (score) => {
    if (score === null || score === undefined) return 'var(--bg-tertiary)';
    if (score >= 80) return 'rgba(16,185,129,0.1)';
    if (score >= 50) return 'rgba(245,158,11,0.1)';
    return 'rgba(239,68,68,0.1)';
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

  return (
    <div>
      <h1 className="sr-only">Admin Devices</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)]">Device Management</p>
        <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">All Devices</h2>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <h3>{filtered.length} Devices</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="admin-table-search">
              <Search size={14} />
              <input placeholder="Search by name or owner..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex gap-1 flex-wrap">
              {deviceTypes.slice(0, 8).map(t => (
                <button key={t} onClick={() => { setFilterType(t); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filterType === t ? 'bg-[var(--accent-primary-dim)] text-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Owner</th>
              <th>Room</th>
              <th>Status</th>
              <th>Power</th>
              <th>Health Score</th>
              <th>Anomalies</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-[var(--text-muted)]">No devices found</td></tr>
            ) : paginated.map(device => (
              <tr key={device.deviceId || device.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center ${
                      device.status === 'On' ? 'bg-[var(--accent-primary-dim)] text-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      <Cpu size={16} />
                    </div>
                    <div>
                      <span className="font-semibold">{device.name}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mt-0.5">{device.type}</p>
                    </div>
                  </div>
                </td>
                <td className="text-[var(--text-secondary)]">{device.ownerName || '—'}</td>
                <td className="text-xs text-[var(--text-secondary)]">{device.roomName || 'General'}</td>
                <td>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${device.status === 'On' ? 'text-[#10B981]' : 'text-[var(--text-muted)]'}`}>
                    <span className={`w-2 h-2 rounded-full ${device.status === 'On' ? 'bg-[#10B981]' : 'bg-[var(--text-muted)]'}`} />
                    {device.status === 'On' ? 'Online' : 'Offline'}
                  </span>
                </td>
                <td className="text-sm font-mono">
                  {device.powerConsumption ?? 0} <span className="text-[10px] text-[var(--text-muted)]">W</span>
                </td>
                <td>
                  {device.healthScore !== null && device.healthScore !== undefined ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: getHealthBg(device.healthScore), color: getHealthColor(device.healthScore) }}>
                      {device.healthScore}/100
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">—</span>
                  )}
                </td>
                <td>
                  <span className={`flex items-center gap-1 ${(device.totalAnomalies || 0) > 0 ? 'text-[var(--accent-danger)]' : 'text-[var(--text-muted)]'}`}>
                    <Activity size={12} />
                    <span className="text-xs font-bold">{device.totalAnomalies ?? 0}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between py-4 px-6 border-t border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`p-1.5 rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] ${
                page === 1 ? 'cursor-default opacity-40' : 'cursor-pointer opacity-100'
              }`}
            ><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`p-1.5 rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] ${
                page === totalPages ? 'cursor-default opacity-40' : 'cursor-pointer opacity-100'
              }`}
            ><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDevices;
