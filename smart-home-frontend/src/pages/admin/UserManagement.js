import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, ChevronLeft, ChevronRight, AlertCircle, X, Mail, Calendar, Clock, Activity, Unlock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [failedLogins, setFailedLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, failedData] = await Promise.all([
          adminService.getUsers(),
          adminService.getFailedLogins()
        ]);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setFailedLogins(Array.isArray(failedData) ? failedData : []);
      } catch (err) {
        setError(err.response?.data?.message || err?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = users.filter(u => {
    const query = search.toLowerCase();
    const name = (u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const matchesSearch = name.includes(query) || email.includes(query);
    const matchesRole = filterRole === 'All' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.userId === userId) setSelectedUser(prev => ({ ...prev, role: newRole }));
      toast.success(`User role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update role');
    }
  };

  const handleUnlockUser = async (userId) => {
    try {
      await adminService.unlockUser(userId);
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, locked: false } : u));
      if (selectedUser?.userId === userId) setSelectedUser(prev => ({ ...prev, locked: false }));
      toast.success('User unlocked');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to unlock user');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await adminService.deleteUser(userId, 'Deleted by admin', 'User terminated from Admin Portal');
      setUsers(prev => prev.filter(u => u.userId !== userId));
      setSelectedUser(null);
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete user');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
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
      <h1 className="sr-only">User Management</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)]">Administration</p>
        <h2 className="text-2xl font-bold text-[#16A34A] font-['Outfit']">User Management</h2>
      </div>

      <div className="admin-table-container mb-6">
        <div className="admin-table-toolbar">
          <h3>All Users ({filtered.length})</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="admin-table-search">
              <Search size={14} />
              <input placeholder="Search users..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex gap-1">
              {['All', 'Admin', 'User'].map(r => (
                <button key={r} onClick={() => { setFilterRole(r); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    filterRole === r ? 'bg-[var(--accent-primary-dim)] text-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                  }`}
                >{r}</button>
              ))}
            </div>
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Device Count</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-[var(--text-muted)]">No users found</td></tr>
            ) : paginated.map(user => (
              <tr key={user.userId} onClick={() => setSelectedUser(user)} className="cursor-pointer">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="admin-user-avatar w-9 h-9 text-sm">
                      {(user.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{user.fullName}</span>
                  </div>
                </td>
                <td className="text-[var(--text-secondary)]">{user.email}</td>
                <td>
                  <span className={`admin-badge ${user.role === 'Admin' ? 'admin-badge-success' : 'admin-badge-info'}`}>
                    <Shield size={10} className="mr-1" />
                    {user.role || 'User'}
                  </span>
                </td>
                <td>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: user.online === false ? '#EF4444' : '#10B981' }} />
                    <span className="text-xs">{user.online === false ? 'Offline' : 'Online'}</span>
                  </span>
                </td>
                <td className="text-xs text-[var(--text-secondary)]">{user.deviceCount ?? 0}</td>
                <td className="text-xs text-[var(--text-muted)]">{formatDate(user.accountCreated || user.createdAt)}</td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleRoleChange(user.userId, user.role); }}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-none cursor-pointer"
                    >Toggle Role</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.userId, user.fullName); }}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--accent-danger)] border-none cursor-pointer"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)]">
          <span className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className={`p-1.5 rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] ${
                page === 1 ? 'cursor-default opacity-40' : 'cursor-pointer'
              }`}
            ><ChevronLeft size={14} /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className={`p-1.5 rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] ${
                page === totalPages ? 'cursor-default opacity-40' : 'cursor-pointer'
              }`}
            ><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-toolbar">
          <h3>Recent Failed Logins</h3>
        </div>
        {failedLogins.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-muted)]">No failed login attempts</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Attempted At</th>
                <th>IP Address</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {failedLogins.slice(0, 10).map((entry, i) => (
                <tr key={entry.id || entry.failedLoginId || i}>
                  <td><span className="font-semibold">{entry.fullName || entry.userName || 'Unknown'}</span></td>
                  <td className="text-[var(--text-secondary)]">{entry.email || '—'}</td>
                  <td className="text-xs text-[var(--text-muted)]">{formatDateTime(entry.attemptedAt || entry.timestamp)}</td>
                  <td className="text-xs text-[var(--text-muted)]">{entry.ipAddress || '—'}</td>
                  <td className="text-xs text-[var(--text-secondary)]">{entry.reason || entry.failureReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
            />
            <motion.div
              className="fixed top-0 right-0 h-full w-full max-w-lg overflow-y-auto shadow-2xl bg-[var(--bg-secondary)] border-l border-[var(--border-color)] z-50"
              initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] font-['Outfit']">User Profile</h3>
                  <button onClick={() => setSelectedUser(null)}
                    className="p-1.5 rounded-lg transition-all bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-none cursor-pointer"
                  ><X size={16} /></button>
                </div>

                <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--bg-tertiary)] rounded-[var(--radius-xl)]">
                  <div className="w-16 h-16 rounded-full bg-[var(--gradient-primary)] text-white flex items-center justify-center text-3xl font-bold">
                    {(selectedUser.fullName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--text-primary)]">{selectedUser.fullName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`admin-badge ${selectedUser.role === 'Admin' ? 'admin-badge-success' : 'admin-badge-info'}`}>{selectedUser.role}</span>
                      <span className={`text-xs ${selectedUser.online === false ? 'text-[var(--text-muted)]' : 'text-[#10B981]'}`}>
                        {selectedUser.online === false ? 'Offline' : 'Online'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                    <Mail size={16} className="text-[var(--accent-primary)]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Email</p>
                      <p className="text-sm text-[var(--text-primary)]">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                    <Calendar size={16} className="text-[var(--accent-primary)]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Member Since</p>
                      <p className="text-sm text-[var(--text-primary)]">{formatDate(selectedUser.accountCreated || selectedUser.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                    <Clock size={16} className="text-[var(--accent-primary)]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Last Login</p>
                      <p className="text-sm text-[var(--text-primary)]">{formatDateTime(selectedUser.lastLogin || selectedUser.lastLoginAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)]">
                    <Activity size={16} className="text-[var(--accent-primary)]" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Usage Hours</p>
                      <p className="text-sm text-[var(--text-primary)]">{((selectedUser.usageMinutes || selectedUser.totalUsageMinutes || 0) / 60).toFixed(1)} hrs</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <div className="flex-1 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{selectedUser.deviceCount ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Devices</p>
                  </div>
                  <div className="flex-1 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
                    <p className={`text-xl font-bold ${(selectedUser.failedAttempts || 0) > 3 ? 'text-[var(--accent-danger)]' : 'text-[var(--text-primary)]'}`}>{selectedUser.failedAttempts ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Failed Logins</p>
                  </div>
                  <div className="flex-1 p-3 bg-[var(--bg-tertiary)] rounded-[var(--radius-md)] text-center">
                    <p className={`text-xl font-bold ${selectedUser.locked ? 'text-[var(--accent-danger)]' : 'text-[#10B981]'}`}>{selectedUser.locked ? 'Locked' : 'Active'}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button onClick={() => handleRoleChange(selectedUser.userId, selectedUser.role)}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] border border-[var(--accent-primary-dim)] cursor-pointer"
                  >{selectedUser.role === 'Admin' ? 'Demote to User' : 'Promote to Admin'}</button>
                  {selectedUser.locked && (
                    <button onClick={() => handleUnlockUser(selectedUser.userId)}
                      className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-[rgba(16,185,129,0.1)] text-[#10B981] border border-[rgba(16,185,129,0.2)] cursor-pointer"
                    ><Unlock size={14} className="mr-1.5 inline" />Unlock User</button>
                  )}
                  <button onClick={() => handleDeleteUser(selectedUser.userId, selectedUser.fullName)}
                    className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all bg-[rgba(239,68,68,0.1)] text-[var(--accent-danger)] border border-[rgba(239,68,68,0.2)] cursor-pointer"
                  ><Trash2 size={14} className="mr-1.5 inline" />Delete User</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
