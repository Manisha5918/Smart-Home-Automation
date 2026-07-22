import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaSun, FaMoon, FaCloudSun, FaCloudMoon, FaCloud, FaSmog, 
  FaCloudRain, FaSnowflake, FaCloudShowersHeavy, FaBolt, FaQuestion,
  FaCalendarAlt, FaTint
} from 'react-icons/fa';

const getWeatherIcon = (iconName, size = 26) => {
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

const WeeklyForecast = ({ dailyData }) => {
  const { t } = useTranslation();

  if (!dailyData || dailyData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card"
      style={{
        padding: '1.5rem',
        borderRadius: '20px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '2rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <FaCalendarAlt size={16} style={{ color: 'var(--accent-primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {t('weather.weeklyForecast') || '7-Day Forecast'}
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {dailyData.map((item, idx) => {
          const isToday = idx === 0;
          const dayName = isToday ? (t('weather.today') || 'Today') : item.day;
          
          return (
            <motion.div
              key={idx}
              whileHover={{ x: 4, background: 'rgba(255, 255, 255, 0.02)' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.02)',
                gap: '1.5rem'
              }}
            >
              <span style={{ flex: '1', fontSize: '0.9rem', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                {dayName}
              </span>

              <div style={{ flex: '1.5', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {getWeatherIcon(item.weatherIcon, 22)}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {t(`weather.condition.${item.weatherIcon}`) || item.weatherCondition}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '70px', justifyContent: 'flex-end' }}>
                {item.rainChance > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#63B3ED', fontSize: '0.75rem', fontWeight: 600 }}>
                    <FaTint size={9} />
                    <span>{Math.round(item.rainChance)}%</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '90px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {Math.round(item.highTemperature)}°
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  {Math.round(item.lowTemperature)}°
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeeklyForecast;
