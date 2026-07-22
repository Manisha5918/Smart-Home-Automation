import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { aiSuggestionService } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FaBrain, FaCheck, FaCog, FaSlidersH,
  FaBolt, FaTint, FaSun, FaCloudRain, FaRegCompass
} from 'react-icons/fa';

const WeatherInsights = ({ suggestions, onRefresh }) => {
  const { t } = useTranslation();
  const [actioningId, setActioningId] = useState(null);

  if (!suggestions) return null;

  const handleAccept = async (id) => {
    setActioningId(id);
    try {
      await aiSuggestionService.acceptSuggestion(id);
      toast.success(t('aiSuggestions.recommendationAccepted') || 'Automation rule activated successfully!');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || t('aiSuggestions.acceptFailed') || 'Failed to activate rule.');
    } finally {
      setActioningId(null);
    }
  };

  const getTriggerIcon = (triggerType) => {
    switch (triggerType?.toLowerCase()) {
      case 'temperature': return <FaBolt style={{ color: '#F56565' }} />;
      case 'humidity': return <FaTint style={{ color: '#4299E1' }} />;
      case 'rain': return <FaCloudRain style={{ color: '#3182CE' }} />;
      case 'uv': return <FaSun style={{ color: '#ED8936' }} />;
      case 'aqi': return <FaRegCompass style={{ color: '#48BB78' }} />;
      default: return <FaSlidersH style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28 }}
      className="glass-card"
      style={{
        padding: '1.75rem',
        borderRadius: '20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '2rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div 
          style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '9px', 
            background: 'rgba(59, 130, 246, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          <FaBrain size={18} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t('weather.smartAutomation') || 'Smart Environment Suggestions'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {t('weather.automationSubtitle') || 'Tailored to your actual devices'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <motion.div
                key={suggestion.suggestionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  padding: '1.15rem',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div 
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '10px', 
                      background: 'rgba(255,255,255,0.02)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}
                  >
                    {getTriggerIcon(suggestion.triggerType)}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
                      {suggestion.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {suggestion.triggerType}: {suggestion.triggerValue}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        Action: {suggestion.action}
                      </span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAccept(suggestion.suggestionId)}
                  disabled={actioningId === suggestion.suggestionId}
                  style={{
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
                    opacity: actioningId === suggestion.suggestionId ? 0.7 : 1
                  }}
                >
                  <FaCheck size={10} />
                  <span>
                    {actioningId === suggestion.suggestionId ? (t('common.applying') || 'Applying...') : (t('common.apply') || 'Apply Rule')}
                  </span>
                </motion.button>
              </motion.div>
            ))
          ) : (
            <div 
              style={{ 
                padding: '2rem 1rem', 
                textAlign: 'center', 
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <FaCog size={24} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <span>
                {t('weather.noSuggestions') || 'No automation suggestions available for your current devices under these weather conditions.'}
              </span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default WeatherInsights;
