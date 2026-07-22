import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaSun, FaMoon, FaCloudSun, FaCloudMoon, FaCloud, FaSmog, 
  FaCloudRain, FaSnowflake, FaCloudShowersHeavy, FaBolt, FaQuestion,
  FaChartBar
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

const WeatherTimeline = ({ hourlyData }) => {
  const { t } = useTranslation();

  if (!hourlyData || hourlyData.length === 0) return null;

  // Extract forecasts for Morning (08:00), Afternoon (14:00), Evening (19:00), Night (23:00)
  // Search within the hourly data
  const getTimelineItem = (hour) => {
    return hourlyData.find(item => {
      const date = new Date(item.time);
      return date.getHours() === hour;
    });
  };

  // If we can't find specific hours, approximate using relative indices
  const morning = getTimelineItem(8) || hourlyData[Math.min(2, hourlyData.length - 1)];
  const afternoon = getTimelineItem(14) || hourlyData[Math.min(8, hourlyData.length - 1)];
  const evening = getTimelineItem(19) || hourlyData[Math.min(13, hourlyData.length - 1)];
  const night = getTimelineItem(23) || hourlyData[Math.min(18, hourlyData.length - 1)];

  const timelineItems = [
    { name: t('weather.timeline.morning') || 'Morning', time: '08:00', data: morning },
    { name: t('weather.timeline.afternoon') || 'Afternoon', time: '14:00', data: afternoon },
    { name: t('weather.timeline.evening') || 'Evening', time: '19:00', data: evening },
    { name: t('weather.timeline.night') || 'Night', time: '23:00', data: night }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.22 }}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
        <FaChartBar size={16} style={{ color: 'var(--accent-primary)' }} />
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {t('weather.dayTimeline') || 'Day Timeline'}
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1.25rem' }}>
        {timelineItems.map((item, idx) => (
          <div 
            key={idx}
            style={{
              padding: '1rem',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {item.name}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {item.time}
            </span>
            
            {item.data && (
              <>
                <div style={{ height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.25rem 0' }}>
                  {getWeatherIcon(item.data.weatherIcon, 26)}
                </div>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {Math.round(item.data.temperature)}°
                </span>
                {item.data.rainProbability > 0 && (
                  <span style={{ fontSize: '0.65rem', color: '#63B3ED', fontWeight: 600 }}>
                    💧 {Math.round(item.data.rainProbability)}%
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default WeatherTimeline;
