import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaSun, FaMoon, FaCloudSun, FaCloudMoon, FaCloud, FaSmog, 
  FaCloudRain, FaSnowflake, FaCloudShowersHeavy, FaBolt, FaQuestion,
  FaTint, FaWind
} from 'react-icons/fa';

const getWeatherIcon = (iconName, size = 80) => {
  switch (iconName) {
    case 'clear-day': return <FaSun size={size} style={{ color: '#FDB813', filter: 'drop-shadow(0 0 12px rgba(253,184,19,0.3))' }} />;
    case 'clear-night': return <FaMoon size={size} style={{ color: '#E2E8F0', filter: 'drop-shadow(0 0 12px rgba(226,232,240,0.3))' }} />;
    case 'cloudy-day': return <FaCloudSun size={size} style={{ color: '#90CDF4', filter: 'drop-shadow(0 0 12px rgba(144,205,244,0.3))' }} />;
    case 'cloudy-night': return <FaCloudMoon size={size} style={{ color: '#A0AEC0', filter: 'drop-shadow(0 0 12px rgba(160,174,192,0.3))' }} />;
    case 'cloudy': return <FaCloud size={size} style={{ color: '#CBD5E0', filter: 'drop-shadow(0 0 12px rgba(203,213,224,0.2))' }} />;
    case 'fog': return <FaSmog size={size} style={{ color: '#A0AEC0' }} />;
    case 'drizzle': return <FaCloudRain size={size} style={{ color: '#63B3ED' }} />;
    case 'freezing-drizzle': return <FaCloudRain size={size} style={{ color: '#4FD1C5' }} />;
    case 'rain': return <FaCloudShowersHeavy size={size} style={{ color: '#3182CE', filter: 'drop-shadow(0 0 10px rgba(49,130,206,0.3))' }} />;
    case 'freezing-rain': return <FaSnowflake size={size} style={{ color: '#4FD1C5' }} />;
    case 'snow': return <FaSnowflake size={size} style={{ color: '#EBF8FF' }} />;
    case 'showers': return <FaCloudShowersHeavy size={size} style={{ color: '#2B6CB0' }} />;
    case 'thunderstorm': return <FaBolt size={size} style={{ color: '#ECC94B', filter: 'drop-shadow(0 0 15px rgba(236,201,75,0.4))' }} />;
    default: return <FaQuestion size={size} style={{ color: '#A0AEC0' }} />;
  }
};

const WeatherHero = ({ weatherData, city }) => {
  const { t } = useTranslation();

  if (!weatherData) return null;

  const formattedDate = weatherData.lastUpdated
    ? new Date(weatherData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card"
      style={{
        padding: '2.5rem',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}
    >
      {/* Decorative ambient light */}
      <div 
        style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Left side: Location and main details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 1, minWidth: '220px', flex: '1 1 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span 
            style={{ 
              fontSize: '0.85rem', 
              fontWeight: 700, 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              color: 'var(--accent-primary)',
              background: 'rgba(59, 130, 246, 0.12)',
              padding: '0.25rem 0.75rem',
              borderRadius: '99px'
            }}
          >
            {t('weather.current') || 'Current Weather'}
          </span>
        </div>

        <h1 style={{ fontSize: '2.8rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: 'var(--text-primary)', tracking: 'tight' }}>
          {city || 'Coimbatore'}
        </h1>

        <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>
          {t(`weather.condition.${weatherData.weatherIcon}`) || weatherData.weatherCondition}
        </p>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {t('weather.lastUpdated') || 'Last Updated'}: {formattedDate}
        </div>
      </div>

      {/* Middle section: Horizontal mini metrics grid to fill empty space */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '2rem', 
        padding: '0.5rem 1.5rem', 
        borderLeft: '1px solid rgba(255,255,255,0.06)', 
        borderRight: '1px solid rgba(255,255,255,0.06)',
        flex: '2 1 300px',
        justifyContent: 'space-evenly',
        zIndex: 1,
        minWidth: '280px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('weather.humidity') || 'Humidity'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4299E1', fontWeight: 700, fontSize: '1.05rem' }}>
            <FaTint size={13} />
            <span style={{ color: 'var(--text-primary)' }}>{weatherData.humidity}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('weather.wind') || 'Wind'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#4FD1C5', fontWeight: 700, fontSize: '1.05rem' }}>
            <FaWind size={13} />
            <span style={{ color: 'var(--text-primary)' }}>{Math.round(weatherData.windSpeed)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>km/h</span></span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('weather.rainProbability') || 'Rain'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#3182CE', fontWeight: 700, fontSize: '1.05rem' }}>
            <FaCloudRain size={13} />
            <span style={{ color: 'var(--text-primary)' }}>{Math.round(weatherData.rainProbability)}%</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('weather.uvIndex') || 'UV Index'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ED8936', fontWeight: 700, fontSize: '1.05rem' }}>
            <FaSun size={13} />
            <span style={{ color: 'var(--text-primary)' }}>{weatherData.uvIndex}</span>
          </div>
        </div>
      </div>

      {/* Right side: Temperature and Animated Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', zIndex: 1, minWidth: '180px', flex: '1 1 auto', justifyContent: 'flex-end' }}>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {getWeatherIcon(weatherData.weatherIcon)}
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', position: 'relative' }}>
            {Math.round(weatherData.temperature)}
            <span style={{ fontSize: '2.2rem', fontWeight: 400, position: 'absolute', top: 0 }}>°</span>
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            {t('weather.feelsLike') || 'Feels Like'}: {Math.round(weatherData.feelsLike)}°C
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherHero;
