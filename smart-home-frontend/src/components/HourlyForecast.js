import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaSun, FaMoon, FaCloudSun, FaCloudMoon, FaCloud, FaSmog, 
  FaCloudRain, FaSnowflake, FaCloudShowersHeavy, FaBolt, FaQuestion,
  FaClock
} from 'react-icons/fa';

const getWeatherIcon = (iconName, size = 30) => {
  switch (iconName) {
    case 'clear-day': return <FaSun size={size} style={{ color: '#FDB813' }} />;
    case 'clear-night': return <FaMoon size={size} style={{ color: '#E2E8F0' }} />;
    case 'cloudy-day': return <FaCloudSun size={size} style={{ color: '#90CDF4' }} />;
    case 'cloudy-night': return <FaCloudMoon size={size} style={{ color: '#A0AEC0' }} />;
    case 'cloudy': return <FaCloud size={size} style={{ color: '#CBD5E0' }} />;
    case 'fog': return <FaSmog size={size} style={{ color: '#A0AEC0' }} />;
    case 'drizzle': return <FaCloudRain size={size} style={{ color: '#63B3ED' }} />;
    case 'freezing-drizzle': return <FaCloudRain size={size} style={{ color: '#4FD1C5' }} />;
    case 'rain': return <FaCloudShowersHeavy size={size} style={{ color: '#3182CE' }} />;
    case 'freezing-rain': return <FaSnowflake size={size} style={{ color: '#4FD1C5' }} />;
    case 'snow': return <FaSnowflake size={size} style={{ color: '#EBF8FF' }} />;
    case 'showers': return <FaCloudShowersHeavy size={size} style={{ color: '#2B6CB0' }} />;
    case 'thunderstorm': return <FaBolt size={size} style={{ color: '#ECC94B' }} />;
    default: return <FaQuestion size={size} style={{ color: '#A0AEC0' }} />;
  }
};

const HourlyForecast = ({ hourlyData }) => {
  const { t } = useTranslation();

  if (!hourlyData || hourlyData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card"
      style={{
        padding: '1.5rem',
        borderRadius: '20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <FaClock size={16} style={{ color: 'var(--accent-primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {t('weather.hourlyForecast') || 'Hourly Forecast'}
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {t('weather.next24Hours') || 'Next 24 hours'}
        </span>
      </div>

      <div 
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          msOverflowStyle: 'none'
        }}
      >
        {hourlyData.map((item, idx) => {
          const itemTime = new Date(item.time);
          const hourText = itemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isNow = idx === 0;

          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, background: 'rgba(255, 255, 255, 0.03)' }}
              style={{
                flex: '0 0 85px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '1rem 0.5rem',
                borderRadius: '14px',
                background: isNow ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.01)',
                border: isNow ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(255,255,255,0.02)',
                gap: '0.6rem',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: isNow ? 700 : 500, color: isNow ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {isNow ? (t('weather.now') || 'Now') : hourText}
              </span>
              
              <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getWeatherIcon(item.weatherIcon, 26)}
              </div>

              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {Math.round(item.temperature)}°
              </span>

              {item.rainProbability > 0 && (
                <span style={{ fontSize: '0.65rem', color: '#63B3ED', fontWeight: 600 }}>
                  {Math.round(item.rainProbability)}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default HourlyForecast;
