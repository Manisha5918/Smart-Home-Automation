import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FaLeaf, FaShieldAlt } from 'react-icons/fa';

const AirQualityCard = ({ airQuality }) => {
  const { t } = useTranslation();

  if (!airQuality) return null;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'excellent':
        return { color: '#38A169', bg: 'rgba(56, 161, 105, 0.12)', border: 'rgba(56, 161, 105, 0.2)' };
      case 'good':
        return { color: '#319795', bg: 'rgba(49, 151, 149, 0.12)', border: 'rgba(49, 151, 149, 0.2)' };
      case 'moderate':
        return { color: '#D69E2E', bg: 'rgba(214, 158, 46, 0.12)', border: 'rgba(214, 158, 46, 0.2)' };
      case 'poor':
        return { color: '#E53E3E', bg: 'rgba(229, 62, 62, 0.12)', border: 'rgba(229, 62, 62, 0.2)' };
      case 'very poor':
        return { color: '#9F7AEA', bg: 'rgba(159, 122, 234, 0.12)', border: 'rgba(159, 122, 234, 0.2)' };
      default:
        return { color: '#A0AEC0', bg: 'rgba(160, 174, 192, 0.1)', border: 'rgba(160, 174, 192, 0.2)' };
    }
  };

  const statusTheme = getStatusColor(airQuality.status);

  const pollutants = [
    { name: 'PM2.5', value: `${airQuality.pm25.toFixed(1)} µg/m³`, desc: t('weather.fineParticles') || 'Fine particles' },
    { name: 'PM10', value: `${airQuality.pm10.toFixed(1)} µg/m³`, desc: t('weather.coarseParticles') || 'Coarse dust' },
    { name: 'CO', value: `${(airQuality.co / 1000).toFixed(2)} mg/m³`, desc: t('weather.carbonMonoxide') || 'Carbon Monoxide' },
    { name: 'NO₂', value: `${airQuality.no2.toFixed(1)} µg/m³`, desc: t('weather.nitrogenDioxide') || 'Nitrogen Dioxide' },
    { name: 'O₃', value: `${airQuality.o3.toFixed(1)} µg/m³`, desc: t('weather.ozone') || 'Ozone layer' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '10px', 
              background: 'rgba(72,187,120,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <FaLeaf size={18} style={{ color: '#48BB78' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {t('weather.airQuality') || 'Air Quality Index'}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('weather.aqiSubtitle') || 'Real-time pollutant levels'}
            </span>
          </div>
        </div>

        <div 
          style={{ 
            padding: '0.4rem 1rem', 
            borderRadius: '99px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            color: statusTheme.color, 
            background: statusTheme.bg,
            border: `1px solid ${statusTheme.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <FaShieldAlt size={12} />
          {t(`weather.aqiStatus.${airQuality.status.toLowerCase()}`) || airQuality.status}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '1.25rem 2rem',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255,255,255,0.03)',
            minWidth: '130px'
          }}
        >
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {Math.round(airQuality.aqi)}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
            US AQI
          </span>
        </div>

        <div 
          style={{ 
            flex: 1, 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: '1rem' 
          }}
        >
          {pollutants.map((pollutant, idx) => (
            <div 
              key={idx} 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.02)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {pollutant.name}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, margin: '0.1rem 0' }}>
                  {pollutant.value}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  {pollutant.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AirQualityCard;
