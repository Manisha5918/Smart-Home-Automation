import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaThermometerHalf, FaTint, FaWind, FaCompress, 
  FaSun, FaCloudRain 
} from 'react-icons/fa';

const WeatherCards = ({ weatherData }) => {
  const { t } = useTranslation();

  if (!weatherData) return null;

  const cardItems = [
    {
      title: t('weather.feelsLike') || 'Feels Like',
      value: `${Math.round(weatherData.feelsLike)}°C`,
      desc: t('weather.actualTemp', { temp: Math.round(weatherData.temperature) }) || `Actual: ${Math.round(weatherData.temperature)}°C`,
      icon: <FaThermometerHalf size={20} style={{ color: '#F56565' }} />,
    },
    {
      title: t('weather.humidity') || 'Humidity',
      value: `${weatherData.humidity}%`,
      desc: weatherData.humidity > 60 ? (t('weather.humidDesc') || 'Humid air') : (t('weather.dryDesc') || 'Comfortable air'),
      icon: <FaTint size={20} style={{ color: '#4299E1' }} />,
    },
    {
      title: t('weather.wind') || 'Wind Speed',
      value: `${weatherData.windSpeed} km/h`,
      desc: `${t('weather.gusts') || 'Gusts'}: ${weatherData.windGust} km/h`,
      icon: <FaWind size={20} style={{ color: '#4FD1C5' }} />,
    },
    {
      title: t('weather.pressure') || 'Pressure',
      value: `${weatherData.pressure} hPa`,
      desc: t('weather.seaLevel') || 'At sea level',
      icon: <FaCompress size={20} style={{ color: '#9F7AEA' }} />,
    },
    {
      title: t('weather.uvIndex') || 'UV Index',
      value: weatherData.uvIndex,
      desc: weatherData.uvIndex > 5 ? (t('weather.highUv') || 'High - Use protection') : (t('weather.lowUv') || 'Low exposure'),
      icon: <FaSun size={20} style={{ color: '#ED8936' }} />,
    },
    {
      title: t('weather.rainProbability') || 'Rain Probability',
      value: `${weatherData.rainProbability}%`,
      desc: `${t('weather.amount') || 'Amount'}: ${weatherData.rainAmount} mm`,
      icon: <FaCloudRain size={20} style={{ color: '#3182CE' }} />,
    },
    {
      title: t('weather.sunrise') || 'Sunrise',
      value: weatherData.sunrise ? new Date(weatherData.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
      desc: t('weather.morning') || 'First daylight',
      icon: <FaSun size={20} style={{ color: '#ECC94B' }} />,
    },
    {
      title: t('weather.sunset') || 'Sunset',
      value: weatherData.sunset ? new Date(weatherData.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
      desc: t('weather.evening') || 'Dusk',
      icon: <FaSun size={20} style={{ color: '#ED64A6' }} />,
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid-4"
      style={{ gap: '1.25rem', marginBottom: '2rem' }}
    >
      {cardItems.map((item, idx) => (
        <motion.div
          key={idx}
          variants={cardVariants}
          whileHover={{ 
            y: -6, 
            borderColor: 'rgba(59, 130, 246, 0.25)',
            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
          }}
          className="glass-card"
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'rgba(255,255,255,0.03)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              flexShrink: 0
            }}
          >
            {item.icon}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', width: '100%', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {item.title}
            </span>
            <span style={{ fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 700, margin: '0.05rem 0' }}>
              {item.value}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3 }}>
              {item.desc}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default WeatherCards;
