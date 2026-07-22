import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../services/api';
import { useSignalR } from '../context/SignalRContext';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Check, AlertTriangle, Info, Calendar } from 'lucide-react';

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      toast.error(t('notifications.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const { on, off } = useSignalR();
  useEffect(() => {
    on('NewNotification', loadNotifications);
    return () => off('NewNotification', loadNotifications);
  }, [on, off]);

  const groupedNotifications = notifications.reduce((acc, n) => {
    const key = `${n.title}::${n.message}`;
    if (!acc[key]) {
      acc[key] = { ...n, groupCount: 1, groupIds: [n.notificationId] };
    } else {
      acc[key].groupCount += 1;
      acc[key].groupIds.push(n.notificationId);
      if (!n.isRead) acc[key].isRead = false;
    }
    return acc;
  }, {});

  const groupedList = Object.values(groupedNotifications);

  const handleMarkAsRead = async (ids) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    try {
      setNotifications(prev => prev.map(n => idList.includes(n.notificationId) ? { ...n, isRead: true } : n));
      await Promise.allSettled(idList.map(id => notificationService.markAsRead(id)));
      toast.success(t('notifications.markedAsRead'));
      loadNotifications();
    } catch (err) {
      toast.error(t('notifications.markReadFailed'));
      loadNotifications();
    }
  };

  const handleDelete = async (ids) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    try {
      setNotifications(prev => prev.filter(n => !idList.includes(n.notificationId)));
      await Promise.allSettled(idList.map(id => notificationService.deleteNotification(id)));
      toast.success(t('notifications.removed'));
    } catch (err) {
      toast.error(t('notifications.deleteFailed'));
      loadNotifications();
    }
  };

  const getAlertIcon = (title) => {
    const text = title.toLowerCase();
    if (text.includes('power') || text.includes('high') || text.includes('warning') || text.includes('alert')) {
      return <AlertTriangle className="text-[var(--accent-danger)]" size={16} />;
    }
    return <Info className="text-[var(--accent-primary)]" size={16} />;
  };

  const translateNotification = (title, message) => {
    let transTitle = title;
    let transMessage = message;

    if (title === "Automation Executed") {
      transTitle = t('notifications.automationExecuted');
    } else if (title === "High Power Consumption") {
      transTitle = t('notifications.highPowerConsumption');
    } else if (title === "Unusual Energy Usage Detected") {
      transTitle = t('notifications.unusualEnergyUsage');
    } else if (title === "Automation Rule Executed") {
      transTitle = t('notifications.automationRuleExecuted');
    } else if (title === "Account Deleted") {
      transTitle = t('notifications.accountDeleted');
    }

    const autoChangeRegex = /^(.+?) automatically changed to (On|Off)\.$/i;
    const autoChangeMatch = message.match(autoChangeRegex);
    if (autoChangeMatch) {
      const devName = autoChangeMatch[1];
      const status = autoChangeMatch[2];
      const transStatus = status.toLowerCase() === 'on' ? t('common.on') : t('common.off');
      const cleanDevName = devName.replace(/\s+/g, '');
      const transDevName = t(`devices.names.${cleanDevName}`) || devName;
      
      transMessage = t('notifications.deviceAutoChanged', { 
        deviceName: transDevName, 
        status: transStatus 
      });
    }

    const powerConsRegex = /^(.+?) is consuming (\d+(?:\.\d+)?) units of power\.$/i;
    const powerConsMatch = message.match(powerConsRegex);
    if (powerConsMatch) {
      const devName = powerConsMatch[1];
      const watts = powerConsMatch[2];
      const cleanDevName = devName.replace(/\s+/g, '');
      const transDevName = t(`devices.names.${cleanDevName}`) || devName;
      
      transMessage = t('notifications.deviceConsumingPower', { 
        deviceName: transDevName, 
        watts: watts 
      });
    }

    const unusualPowerRegex = /^(.+?) is consuming (\d+(?:\.\d+)?)% more power than its recent average\. Check the device\.$/i;
    const unusualPowerMatch = message.match(unusualPowerRegex);
    if (unusualPowerMatch) {
      const devName = unusualPowerMatch[1];
      const percent = unusualPowerMatch[2];
      const cleanDevName = devName.replace(/\s+/g, '');
      const transDevName = t(`devices.names.${cleanDevName}`) || devName;
      
      transMessage = t('notifications.deviceUnusualPower', { 
        deviceName: transDevName, 
        percent: percent 
      });
    }

    const ruleExecRegex = /^Rule '(.+?)' executed for (.+?)\.$/i;
    const ruleExecMatch = message.match(ruleExecRegex);
    if (ruleExecMatch) {
      const ruleName = ruleExecMatch[1];
      const devName = ruleExecMatch[2];
      const cleanDevName = devName.replace(/\s+/g, '');
      const transDevName = t(`devices.names.${cleanDevName}`) || devName;
      
      transMessage = t('notifications.ruleExecuted', { 
        ruleName: ruleName, 
        deviceName: transDevName 
      });
    }

    return { title: transTitle, message: transMessage };
  };

  if (loading) {
    return (
      <div className="space-y-5 max-w-[850px] mx-auto">
        <Skeleton width="200px" height="32px" className="mb-6" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm flex gap-4 items-center">
            <Skeleton width="40px" height="40px" borderRadius="10px" />
            <div className="flex-1 space-y-2">
              <Skeleton width="40%" height="16px" />
              <Skeleton width="80%" height="12px" />
            </div>
            <Skeleton width="80px" height="30px" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[850px] mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[var(--border-color)]">
        <h1 className="sr-only">Notifications</h1>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          {t('notifications.systemNotifications')}
        </h1>
        <span className="badge badge-info text-xs">
          {groupedList.filter(n => !n.isRead).length} {t('notifications.unread')}
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {groupedList.map(notification => {
            const isUnread = !notification.isRead;
            const count = notification.groupCount;
            const { title, message } = translateNotification(notification.title, notification.message);
            return (
              <motion.div
                layout
                key={notification.groupIds[0]}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <motion.div
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm border-l-[var(--notif-border-left)] bg-[var(--notif-bg)]"
                  style={{
                    '--notif-border-left': count > 1
                      ? '4px solid var(--accent-warning)'
                      : isUnread
                        ? '4px solid var(--accent-primary)'
                        : '1px solid var(--border-color)',
                    '--notif-bg': isUnread
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(20, 184, 166, 0.01) 100%)'
                      : '',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base bg-[var(--notif-icon-bg)]"
                      style={{ '--notif-icon-bg': isUnread ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-tertiary)' }}
                    >
                      {count > 1 ? (
                        <div className="relative">
                          {getAlertIcon(notification.title)}
                          <span className="absolute -top-1.5 -right-2 bg-[var(--accent-warning)] text-white text-[0.6rem] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-[var(--bg-card)] leading-none">
                            {count}
                          </span>
                        </div>
                      ) : getAlertIcon(notification.title)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-1">
                        <h3 className={`text-sm m-0 ${isUnread ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-secondary)]'}`}>
                          {title}
                          {count > 1 && (
                            <span className="text-xs font-semibold text-[var(--accent-warning)] ml-1"> x{count}</span>
                          )}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] font-medium shrink-0">
                          <Calendar size={12} />
                          <span>{new Date(notification.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] m-0 leading-relaxed">{message}</p>
                    </div>

                    <div className="flex items-center gap-2 self-center shrink-0">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(notification.groupIds)}
                          title={t('notifications.markAsRead')}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] transition-all duration-200"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.groupIds)}
                        title={t('notifications.deleteNotification')}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--accent-danger)] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {groupedList.length === 0 && (
          <motion.div
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl shadow-sm py-14 text-center"
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Bell size={48} className="mx-auto mb-4 opacity-30 text-[var(--accent-primary)]" />
            <p className="font-semibold text-[var(--text-primary)]">{t('notifications.clearInbox')}</p>
            <span className="text-sm text-[var(--text-secondary)]">{t('notifications.alertsWillAppear')}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
