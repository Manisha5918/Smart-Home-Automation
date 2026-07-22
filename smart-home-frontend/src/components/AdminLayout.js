import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';
import {
  LayoutDashboard, Users, Cpu, Zap, Brain, CloudSun, History, FileText, Settings, LogOut, Bell, Sun, Moon, Menu, X, ChevronLeft, Search, Home, Shield
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('app-theme') !== 'light';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark', 'dark');
      localStorage.setItem('app-theme', 'dark');
    } else {
      document.body.classList.remove('theme-dark', 'dark');
      document.body.classList.add('theme-light');
      localStorage.setItem('app-theme', 'light');
    }
  }, [darkMode]);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Devices', path: '/admin/devices', icon: Cpu },
    { name: 'Energy', path: '/admin/energy', icon: Zap },
    { name: 'AI Insights', path: '/admin/ai', icon: Brain },
    { name: 'Weather', path: '/admin/weather', icon: CloudSun },
    { name: 'Activity Logs', path: '/admin/activity', icon: History },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item => item.path === location.pathname);
    return current ? current.name : 'Admin Panel';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'expanded' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <Shield size={22} className="admin-brand-icon" />
            {sidebarOpen && <span className="admin-brand-text">Admin Panel</span>}
          </div>
          <button className="admin-sidebar-toggle-desktop" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronLeft size={16} />
          </button>
          <button className="admin-sidebar-close-mobile" onClick={() => setMobileOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="admin-nav">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const IconComp = item.icon;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: sidebarOpen ? -10 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
              >
                <Link
                  to={item.path}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                  title={!sidebarOpen ? item.name : ''}
                >
                  {isActive && (
                    <motion.div layoutId="adminActiveNav" className="admin-nav-indicator" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />
                  )}
                  <IconComp size={18} className="admin-nav-icon" />
                  {sidebarOpen && <span className="admin-nav-text">{item.name}</span>}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-link" onClick={logout}>
            <LogOut size={18} className="admin-nav-icon" />
            {sidebarOpen && <span className="admin-nav-text">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="admin-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className={`admin-main ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="admin-mobile-toggle" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="admin-header-search">
              <Search size={15} />
              <input type="text" placeholder="Search admin panel..." />
            </div>
          </div>

          <div className="admin-header-center">
            <h2 className="admin-page-title">{getPageTitle()}</h2>
          </div>

          <div className="admin-header-right">
            <button className="admin-header-btn" onClick={() => navigate('/')} title="Go to User Dashboard">
              <Home size={18} />
            </button>
            <button className="admin-header-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="admin-header-btn" title="Notifications">
              <Bell size={18} />
            </button>
            <div className="admin-user-profile" onClick={() => navigate('/profile')}>
              <div className="admin-user-avatar">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">{user?.fullName || 'Admin'}</span>
                <span className="admin-user-role">{user?.role || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
