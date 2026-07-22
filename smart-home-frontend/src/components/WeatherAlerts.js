import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const WeatherAlerts = ({ alerts, onCloseAlert }) => {
  const { t } = useTranslation();

  if (!alerts || alerts.length === 0) return null;

  const getAlertStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return {
          background: 'rgba(229, 62, 62, 0.08)',
          border: '1px solid rgba(229, 62, 62, 0.25)',
          color: '#E53E3E',
          iconColor: '#E53E3E'
        };
      default:
        return {
          background: 'rgba(221, 107, 32, 0.08)',
          border: '1px solid rgba(221, 107, 32, 0.25)',
          color: '#DD6B20',
          iconColor: '#DD6B20'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2rem' }}>
      <AnimatePresence>
        {alerts.map((alert, idx) => {
          const styles = getAlertStyles(alert.severity);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '1rem 1.25rem',
                borderRadius: '14px',
                background: styles.background,
                border: styles.border,
                color: 'var(--text-primary)',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{ 
                  marginTop: '0.15rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: styles.iconColor
                }}
              >
                <FaExclamationTriangle size={18} />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <strong style={{ fontSize: '0.95rem', fontWeight: 700, color: styles.iconColor }}>
                  {alert.title}
                </strong>
                <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {alert.message}
                </p>
              </div>

              {onCloseAlert && (
                <button
                  onClick={() => onCloseAlert(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.25rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <FaTimes size={12} />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default WeatherAlerts;
