import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { CloudSun, Thermometer, Droplets, Wind, Gauge, Sun, Cloud, Eye, Umbrella, Sunrise, Sunset, Clock, MapPin, AlertCircle } from 'lucide-react';

const AdminWeather = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await api.get('/weather/current');
        setWeather(response.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to connect to weather service');
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return <div className="flex-center min-h-[60vh]"><div className="spinner spinner-lg"></div></div>;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="mx-auto mb-3 text-[var(--accent-danger)] opacity-50" />
        <p className="text-sm text-[var(--text-muted)]">{error}</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="text-center py-16">
        <CloudSun size={48} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
        <p className="text-sm text-[var(--text-muted)]">No weather data available</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Temperature', value: weather.temperature, icon: Thermometer, color: '#F59E0B', unit: '°C' },
    { label: 'Feels Like', value: weather.feelsLike, icon: Thermometer, color: '#8B5CF6', unit: '°C' },
    { label: 'Humidity', value: weather.humidity, icon: Droplets, color: '#3B82F6', unit: '%' },
    { label: 'Wind Speed', value: weather.windSpeed, icon: Wind, color: '#10B981', unit: 'km/h' },
    { label: 'Pressure', value: weather.pressure, icon: Gauge, color: '#EC4899', unit: 'hPa' },
    { label: 'UV Index', value: weather.uvIndex, icon: Sun, color: '#F59E0B', unit: '' },
    { label: 'Cloud Cover', value: weather.cloudCover, icon: Cloud, color: '#64748B', unit: '%' },
    { label: 'Visibility', value: weather.visibility, icon: Eye, color: '#14B8A6', unit: 'km' },
    { label: 'Rain Prob.', value: weather.rainProbability, icon: Umbrella, color: '#3B82F6', unit: '%' },
  ];

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  return (
    <div>
      <h1 className="sr-only">Admin Weather</h1>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)] mb-1">Environmental Data</p>
        <h2 className="text-2xl font-bold text-[var(--accent-primary)] font-['Outfit']">Weather & Environment</h2>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="admin-card mb-6"
      >
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-[var(--accent-primary-dim)] flex items-center justify-center">
              {typeof weather.weatherIcon === 'string' && (weather.weatherIcon.startsWith('http') || weather.weatherIcon.startsWith('//')) ? (
                <img src={weather.weatherIcon} alt="" className="w-16 h-16 object-contain" />
              ) : (
                <CloudSun size={48} className="text-[var(--accent-primary)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-[var(--text-muted)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">{weather.city || 'Unknown Location'}</p>
              </div>
              <p className="text-3xl font-bold text-[var(--text-primary)] font-['Outfit'] leading-none">
                {weather.temperature !== undefined ? `${Math.round(weather.temperature)}°` : '—'}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {weather.weatherCondition || ''}
                {weather.feelsLike !== undefined && ` · Feels like ${Math.round(weather.feelsLike)}°`}
              </p>
            </div>
          </div>
          <div className="flex gap-4 ml-auto flex-wrap">
            {weather.sunrise && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)]">
                <Sunrise size={14} className="text-[var(--accent-warning)]" />
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Sunrise</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{formatTime(weather.sunrise)}</p>
                </div>
              </div>
            )}
            {weather.sunset && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)]">
                <Sunset size={14} className="text-[var(--accent-warning)]" />
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Sunset</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{formatTime(weather.sunset)}</p>
                </div>
              </div>
            )}
            {weather.lastUpdated && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)]">
                <Clock size={14} className="text-[var(--text-muted)]" />
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Updated</p>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{formatTime(weather.lastUpdated)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="admin-stats-grid">
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <motion.div key={card.label} className="admin-stat-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
            >
              <div className="admin-stat-icon" style={{ background: `${card.color}15`, color: card.color }}>
                <IconComp size={22} />
              </div>
              <div className="admin-stat-info">
                <h4>{card.label}</h4>
                <p>{card.value !== undefined && card.value !== null ? `${card.value}${card.unit}` : '—'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {weather.windDirection && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
            <span>Wind Direction: {weather.windDirection}</span>
            {weather.windGust !== undefined && <span>Wind Gust: {weather.windGust} km/h</span>}
            {weather.rainAmount !== undefined && <span>Rain Amount: {weather.rainAmount} mm</span>}
            {weather.timezone && <span>Timezone: {weather.timezone}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWeather;
