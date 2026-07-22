import api from './api';

export const weatherService = {
  getCurrentWeather: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/current', { params });
    return response.data;
  },
  getHourlyForecast: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/hourly', { params });
    return response.data;
  },
  getDailyForecast: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/daily', { params });
    return response.data;
  },
  getAirQuality: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/air-quality', { params });
    return response.data;
  },
  getWeatherSummary: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/summary', { params });
    return response.data;
  },
  getWeatherAlerts: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/alerts', { params });
    return response.data;
  },
  getAutomationSuggestions: async (lat, lon) => {
    const params = lat && lon ? { latitude: lat, longitude: lon } : {};
    const response = await api.get('/weather/automation-suggestions', { params });
    return response.data;
  }
};
