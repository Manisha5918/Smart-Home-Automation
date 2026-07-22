import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { weatherService } from '../services/weatherService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { RefreshCw, CloudSun, MapPin, Settings } from 'lucide-react';

import WeatherHero from '../components/WeatherHero';
import WeatherCards from '../components/WeatherCards';
import AirQualityCard from '../components/AirQualityCard';
import HourlyForecast from '../components/HourlyForecast';
import WeeklyForecast from '../components/WeeklyForecast';
import WeatherTimeline from '../components/WeatherTimeline';
import WeatherSummary from '../components/WeatherSummary';
import WeatherAlerts from '../components/WeatherAlerts';
import WeatherInsights from '../components/WeatherInsights';
import Skeleton from '../components/Skeleton';

const Weather = () => {
  const { t } = useTranslation();
  const [locationMode, setLocationMode] = useState('default');
  const [customLocation, setCustomLocation] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [formCity, setFormCity] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLon, setFormLon] = useState('');

  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeatherData = async (lat = null, lon = null, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [currentRes, hourlyRes, dailyRes, aqRes, alertsRes, suggestionsRes] = await TaskWhenAll([
        weatherService.getCurrentWeather(lat, lon),
        weatherService.getHourlyForecast(lat, lon),
        weatherService.getDailyForecast(lat, lon),
        weatherService.getAirQuality(lat, lon),
        weatherService.getWeatherAlerts(lat, lon),
        weatherService.getAutomationSuggestions(lat, lon)
      ]);

      setCurrent(currentRes);
      setHourly(hourlyRes);
      setDaily(dailyRes);
      setAirQuality(aqRes);
      setAlerts(alertsRes);
      setSuggestions(suggestionsRes);

      if (isRefresh) {
        toast.success(t('weather.refreshed', 'Weather data updated.'));
      }
    } catch (err) {
      console.error('Failed to load weather data:', err);
      setError(t('weather.loadFailed', 'Failed to sync weather information. Please check connection.'));
      toast.error(t('weather.loadFailed', 'Weather sync failed.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSummary = async (lat = null, lon = null) => {
    setSummaryLoading(true);
    try {
      const summaryRes = await weatherService.getWeatherSummary(lat, lon);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const TaskWhenAll = (promises) => Promise.all(promises);

  const handleAutoDetect = () => {
    if (navigator.geolocation) {
      const loadToast = toast.loading(t('weather.detectingLocation', 'Detecting location...'));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lon = position.coords.longitude.toFixed(4);
          setFormCity(t('weather.detectedLocation', 'Detected Location'));
          setFormLat(lat);
          setFormLon(lon);
          toast.success(t('weather.locationDetected', 'Coordinates detected!'), { id: loadToast });
        },
        (geoErr) => {
          console.warn("Geolocation failed or denied:", geoErr);
          toast.error(t('weather.geoFailed', 'Location permission denied.'), { id: loadToast });
        }
      );
    } else {
      toast.error(t('weather.geoNotSupported', 'Geolocation is not supported by your browser.'));
    }
  };

  const handleSaveLocation = () => {
    if (!formCity || !formLat || !formLon) {
      toast.error(t('weather.enterAllFields', 'Please enter city name, latitude, and longitude.'));
      return;
    }

    const latVal = parseFloat(formLat);
    const lonVal = parseFloat(formLon);

    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      toast.error(t('weather.latitudeError', 'Latitude must be a number between -90 and 90.'));
      return;
    }

    if (isNaN(lonVal) || lonVal < -180 || lonVal > 180) {
      toast.error(t('weather.longitudeError', 'Longitude must be a number between -180 and 180.'));
      return;
    }

    const locationObj = { lat: latVal, lon: lonVal, city: formCity };
    localStorage.setItem('home_location', JSON.stringify(locationObj));
    setCustomLocation(locationObj);
    setLocationMode('custom');
    setShowSettings(false);
    toast.success(t('weather.locationUpdated', 'Home location updated!'));

    fetchWeatherData(latVal, lonVal);
    fetchSummary(latVal, lonVal);
  };

  const handleResetDefault = () => {
    localStorage.removeItem('home_location');
    setCustomLocation(null);
    setLocationMode('default');
    setFormCity('');
    setFormLat('');
    setFormLon('');
    setShowSettings(false);
    toast.success(t('weather.locationReverted', 'Reverted to system default location.'));

    fetchWeatherData(null, null);
    fetchSummary(null, null);
  };

  useEffect(() => {
    const stored = localStorage.getItem('home_location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomLocation(parsed);
        setLocationMode('custom');
        setFormCity(parsed.city);
        setFormLat(parsed.lat);
        setFormLon(parsed.lon);
        fetchWeatherData(parsed.lat, parsed.lon);
        fetchSummary(parsed.lat, parsed.lon);
        return;
      } catch (e) {
        console.error('Failed to parse cached home location:', e);
      }
    }

    fetchWeatherData(null, null);
    fetchSummary(null, null);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const lat = locationMode === 'custom' ? customLocation?.lat : null;
      const lon = locationMode === 'custom' ? customLocation?.lon : null;
      fetchWeatherData(lat, lon, true);
      fetchSummary(lat, lon);
    }, 600000);

    return () => clearInterval(interval);
  }, [locationMode, customLocation]);

  const handleCloseAlert = (index) => {
    setAlerts(prev => prev.filter((_, idx) => idx !== index));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Skeleton width="180px" height="32px" />
            <Skeleton width="300px" height="16px" className="mt-2" />
          </div>
          <Skeleton width="120px" height="40px" borderRadius="10px" />
        </div>

        <Skeleton width="100%" height="200px" borderRadius="24px" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            <Skeleton width="100%" height="150px" borderRadius="20px" />
            <Skeleton width="100%" height="220px" borderRadius="20px" />
          </div>
          <div className="flex flex-col gap-6">
            <Skeleton width="100%" height="180px" borderRadius="20px" />
            <Skeleton width="100%" height="180px" borderRadius="20px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl p-5 shadow-sm max-w-[450px] text-center">
          <CloudSun size={50} className="text-[var(--text-muted)] mx-auto mb-6 opacity-60" />
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">{t('weather.errorTitle', 'Connection Offline')}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                const lat = locationMode === 'custom' ? customLocation?.lat : null;
                const lon = locationMode === 'custom' ? customLocation?.lon : null;
                fetchWeatherData(lat, lon);
                fetchSummary(lat, lon);
              }}
              className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm"
            >
              <RefreshCw size={12} />
              <span>{t('common.retry', 'Retry Sync')}</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200 flex items-center gap-2"
            >
              <Settings size={12} />
              <span>{t('weather.configureLocation', 'Configure Location')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="sr-only">Weather & Environment</h1>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {t('navigation.weather', 'Weather & Environment')}
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
            {t('weather.pageDesc', 'Real-time microclimate sensors and forecasts')}
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(true)}
            className="h-10 px-5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-[var(--accent-primary)] text-sm font-bold rounded-xl border border-blue-200 dark:border-blue-800/30 transition-all duration-200 flex items-center gap-2"
          >
            <Settings size={14} />
            <span>{t('weather.configureLocation', 'Configure Location')}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const lat = locationMode === 'custom' ? customLocation?.lat : null;
              const lon = locationMode === 'custom' ? customLocation?.lon : null;
              fetchWeatherData(lat, lon, true);
              fetchSummary(lat, lon);
            }}
            disabled={refreshing}
            className={`h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200 flex items-center gap-2 ${refreshing ? 'opacity-70' : ''}`}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? t('common.syncing', 'Syncing...') : t('common.sync', 'Sync Data')}</span>
          </motion.button>
        </div>
      </div>

      {/* Main hero card */}
      <WeatherHero
        weatherData={current}
        city={locationMode === 'custom' ? customLocation?.city : current?.city}
      />

      {/* Weather Alerts if present */}
      <WeatherAlerts alerts={alerts} onCloseAlert={handleCloseAlert} />

      {/* Environment Parameters */}
      <div className="flex flex-col">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
          {t('weather.envParameters', 'Environment Parameters')}
        </h3>
        <WeatherCards weatherData={current} />
      </div>

      {/* Grid structure: 2 columns on desktop for secondary elements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <HourlyForecast hourlyData={hourly} />
          <WeeklyForecast dailyData={daily} />
          <WeatherTimeline hourlyData={hourly} />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <AirQualityCard airQuality={airQuality} />
          <WeatherSummary summaryData={summary} loading={summaryLoading} />
          <WeatherInsights
            suggestions={suggestions}
            onRefresh={() => {
              const lat = locationMode === 'custom' ? customLocation?.lat : null;
              const lon = locationMode === 'custom' ? customLocation?.lon : null;
              fetchWeatherData(lat, lon, false);
            }}
          />
        </div>
      </div>

      {/* Location Settings Modal overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md flex items-center justify-center z-[1000]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[var(--bg-card)] border border-gray-100 dark:border-[var(--border-color)] rounded-2xl p-8 max-w-[480px] w-[90%] shadow-xl"
          >
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-6">
              <MapPin size={20} className="text-[var(--accent-primary)]" />
              {t('weather.configureHomeLocation', 'Configure Home Location')}
            </h3>

            <div className="flex flex-col gap-5 mb-8">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('weather.cityName', 'City Name')}</label>
                <input
                  type="text"
                  placeholder={t('weather.cityPlaceholder', 'e.g. Coimbatore, Mumbai, London')}
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('weather.latitude', 'Latitude')}</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder={t('weather.latPlaceholder', 'e.g. 11.0168')}
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('weather.longitude', 'Longitude')}</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder={t('weather.lonPlaceholder', 'e.g. 76.9558')}
                    value={formLon}
                    onChange={(e) => setFormLon(e.target.value)}
                    className="h-10 px-4 bg-white dark:bg-[var(--bg-input)] border border-gray-100 dark:border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200 w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleAutoDetect}
                className="h-10 px-5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-[var(--accent-primary)] text-sm font-bold rounded-xl border border-blue-200 dark:border-blue-800/30 transition-all duration-200 flex items-center justify-center gap-2 mt-1"
              >
                <MapPin size={14} />
                {t('weather.autoDetect', 'Auto-Detect Current Location')}
              </button>
            </div>

            <div className="flex justify-end gap-3 flex-wrap">
              <button
                onClick={() => setShowSettings(false)}
                className="h-10 px-5 bg-gray-50 dark:bg-[var(--bg-tertiary)] hover:bg-gray-100 dark:hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-bold rounded-xl border border-gray-100 dark:border-[var(--border-color)] transition-all duration-200"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              {locationMode === 'custom' && (
                <button
                  onClick={handleResetDefault}
                  className="h-10 px-5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 text-sm font-bold rounded-xl border border-red-200 dark:border-red-800/30 transition-all duration-200"
                >
                  {t('weather.resetDefault', 'Reset Default')}
                </button>
              )}
              <button
                onClick={handleSaveLocation}
                className="h-10 px-5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-sm"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Weather;
