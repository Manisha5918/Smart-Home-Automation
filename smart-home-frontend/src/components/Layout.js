import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from "./LanguageSelector";
import GlobalHeader from "./GlobalHeader";
import VoiceAssistant from "./VoiceAssistant";
import ErrorBoundary from "./ErrorBoundary";
import ConnectionStatus from "./ConnectionStatus";
import { useSignalR } from '../context/SignalRContext';
import { useTranslation } from 'react-i18next';
import { FaShieldAlt } from 'react-icons/fa';
import { 
  FaThLarge, 
  FaPlug, 
  FaDoorOpen, 
  FaBell, 
  FaHistory, 
  FaSlidersH, 
  FaBrain, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSearch,
  FaSun,
  FaMoon,
  FaHome,
  FaChartLine,
  FaCog,
  FaLightbulb,
  FaCloudSun,
  FaTools
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('app-theme') !== 'light';
  });

  // Sync theme class
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

  // Fetch unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await notificationService.getUnreadCount();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch unread notification count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const { on, off } = useSignalR();
  useEffect(() => {
    const handleNewNotification = () => {
      setUnreadCount(prev => prev + 1);
    };
    on('NewNotification', handleNewNotification);
    return () => off('NewNotification', handleNewNotification);
  }, [on, off]);

  const navItems = [
    { name: t('navigation.dashboard') || 'Dashboard', path: '/', icon: <FaThLarge /> },
    { name: t('navigation.devices') || 'Devices', path: '/devices', icon: <FaPlug /> },
    { name: t('navigation.rooms') || 'Rooms', path: '/rooms', icon: <FaDoorOpen /> },
    { name: t('navigation.automation') || 'Automation', path: '/automation-rules', icon: <FaSlidersH /> },
    { name: t('navigation.energy') || 'Energy', path: '/ai-report', icon: <FaChartLine /> },
    { name: t('navigation.suggestions') || 'AI Assistant', path: '/ai-suggestions', icon: <FaBrain />, isNew: true },
    { name: t('navigation.insights') || 'Smart Insights', path: '/smart-insights', icon: <FaLightbulb /> },
    { name: t('navigation.weather') || 'Weather & Environment', path: '/weather', icon: <FaCloudSun /> },
    { name: t('navigation.notifications') || 'Notifications', path: '/notifications', icon: <FaBell />, badge: unreadCount },
    { name: t('navigation.activity') || 'Activity Logs', path: '/activity-logs', icon: <FaHistory /> },
    { name: t('navigation.vacation') || 'Settings', path: '/vacation-mode', icon: <FaCog /> },
    { name: t('navigation.security') || 'Security', path: '/security', icon: <FaShieldAlt /> },
    { name: t('navigation.predictive') || 'Maintenance', path: '/predictive-maintenance', icon: <FaTools /> },
  ];

  // Add Admin Panel link only for admin users
  if (user?.role === 'Admin') {
    navItems.push({
      name: 'Admin Panel',
      path: '/admin/dashboard',
      icon: <FaShieldAlt />,
      isAdmin: true
    });
  }

  const handleLogout = () => {
    logout();
  };

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : t('common.smartHome');
  };

  return (
    <div className="app-layout">
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            fontSize: '0.88rem',
            padding: '0.85rem 1.15rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }
        }}
      />

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <FaHome className="logo-icon text-[var(--accent-primary)]" />
            <span className="font-bold tracking-tight text-[var(--text-primary)]">{t('common.smartHome')}</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="nav-active-indicator"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <motion.span className="nav-icon" style={{ position: 'relative', zIndex: 1 }} whileHover={{ scale: 1.1, transition: { duration: 0.15 } }}>
                     {item.icon}
                  </motion.span>
                  <span className="nav-text" style={{ position: 'relative', zIndex: 1 }}>{item.name}</span>
                  
                  {item.isNew && (
                    <span 
                      className="px-1.5 py-0.5 text-[8px] font-extrabold bg-[#1DBA74] text-white rounded-md ml-auto"
                      style={{ position: 'relative', zIndex: 1 }}
                    >
                      New
                    </span>
                  )}

                  {item.badge !== undefined && item.badge > 0 && (
                    <span 
                      className="w-5 h-5 rounded-full bg-[#1DBA74] text-white text-[9px] font-black flex items-center justify-center ml-auto"
                      style={{ position: 'relative', zIndex: 1 }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="sidebar-footer">


          <button className="nav-link btn-logout" onClick={handleLogout}>
            <span className="nav-icon"><FaSignOutAlt /></span>
            <span className="nav-text">{t('navigation.logout') || 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="app-container">
        {/* Top Header */}
        <header className="app-header">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          
          <div className="header-search">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={t('common.searchPlaceholder') || t('common.search') || 'Search appliances, logs...'} 
              onChange={(e) => {
                const event = new CustomEvent('global-search', { detail: e.target.value });
                window.dispatchEvent(event);
              }}
            />
          </div>

          <div className="header-title">
            <h2>{getPageTitle()}</h2>
          </div>

          <GlobalHeader />

          <div className="header-actions">
            <ConnectionStatus />
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <div className="header-notification" onClick={() => setDarkMode(!darkMode)} title={darkMode ? t('common.lightMode') : t('common.darkMode')}>
              {darkMode ? <FaSun className="bell-icon text-yellow-400" /> : <FaMoon className="bell-icon" />}
            </div>

            {/* Notification Bell */}
            <div className="header-notification" onClick={() => navigate('/notifications')}>
              <FaBell className="bell-icon" />
              {unreadCount > 0 && (
                <span className="bell-badge">{unreadCount}</span>
              )}
            </div>
            
            {/* User Profile Info */}
            <div className="user-profile" onClick={() => navigate('/profile')}>
              <div className="user-avatar">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : t('common.avatarFallback')}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.fullName || t('common.userFallback')}</span>
                <span className="user-role">{user?.role || t('common.resident')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Pane with Framer Motion entry transitions */}
        <main className="app-content">
          <div className="dashboard-glow" />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="sidebar-overlay" 
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
