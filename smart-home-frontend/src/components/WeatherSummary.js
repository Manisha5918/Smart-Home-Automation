import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaRobot } from 'react-icons/fa';
import Skeleton from './Skeleton';

const WeatherSummary = ({ summaryData, loading }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass-card"
      style={{
        padding: '1.75rem',
        borderRadius: '20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background visual detail */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-5%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div 
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '9px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <FaRobot size={18} style={{ color: '#6366F1' }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('weather.aiSummary') || 'AI Weather Insights'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {t('weather.ollamaSummaryDesc') || 'Local LLM analysis'}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton width="100%" height="16px" />
          <Skeleton width="95%" height="16px" />
          <Skeleton width="80%" height="16px" />
        </div>
      ) : summaryData?.summary ? (
        <p 
          style={{ 
            fontSize: '0.95rem', 
            color: 'var(--text-primary)', 
            lineHeight: '1.6', 
            margin: 0,
            fontWeight: 500,
            fontStyle: 'italic',
            borderLeft: '3px solid #6366F1',
            paddingLeft: '1rem'
          }}
        >
          "{summaryData.summary}"
        </p>
      ) : (
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
          {t('weather.noSummary') || 'No weather summary available.'}
        </p>
      )}
    </motion.div>
  );
};

export default WeatherSummary;
